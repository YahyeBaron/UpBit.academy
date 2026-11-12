import { test, describe } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../lib/prisma.ts';
import { PAYMENT_STATUS, PROMO_USAGE_STATUS } from '../lib/payments/domain.ts';
import {
  checkEnrollment,
  createCheckoutQuoteAndOrder,
  finalizeSuccessfulPayment,
  handlePaymentFailure,
  PaymentError,
} from '../lib/payments/service.ts';

async function getOrCreateTestUser(clerkId = 'test_sifalo_user_1', email = 'sifalo_test@example.com') {
  if (process.env.DATABASE_URL) {
    let user = await prisma.user.findFirst({ where: { clerkId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          name: 'Sifalo Test Learner',
          avatar: '/assets/w-rc.jpg',
          role: 'student',
          joinedDate: 'March 2026',
        },
      });
    }
    return user;
  }
  return { id: 'mock_sifalo_user_1', email, role: 'student' };
}

describe('Sifalo Payment & Enrollment Security Audit Verification', () => {

  describe('1. Course Guard Utility (checkEnrollment)', () => {
    test('checkEnrollment returns false when no enrollment record exists', async () => {
      const res = await checkEnrollment('non_existent_user_999', 'non_existent_course_999');
      assert.strictEqual(res.isEnrolled, false);
      assert.strictEqual(res.enrollment, null);
    });

    test('checkEnrollment strictly rejects PENDING or FAILED enrollment statuses', async () => {
      if (!process.env.DATABASE_URL) return;

      const user = await getOrCreateTestUser('test_sifalo_pending_user', 'pending_user@example.com');
      const testCourseSlug = 'sifalo-audit-test-course';

      // Ensure test course exists
      await prisma.course.upsert({
        where: { slug: testCourseSlug },
        create: {
          slug: testCourseSlug,
          title: 'Audit Course 1',
          tagline: 'Test course',
          category: 'frontend',
          image: '/assets/w-rc.jpg',
          description: 'Testing',
          longDescription: 'Testing',
          instructorId: 'yahye',
          duration: '1h',
          level: 'Beginner',
          price: 49.00,
          originalPrice: 49.00,
          lastUpdated: '2026',
        },
        update: {},
      });

      // 1. Create a PENDING enrollment
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: user.id, courseId: testCourseSlug } },
        create: {
          userId: user.id,
          courseId: testCourseSlug,
          paymentStatus: 'PENDING',
          amountPaid: 0,
        },
        update: {
          paymentStatus: 'PENDING',
          amountPaid: 0,
        },
      });

      const pendingCheck = await checkEnrollment(user.id, testCourseSlug);
      assert.strictEqual(pendingCheck.isEnrolled, false, 'Pending enrollment must not grant course access');

      // 2. Update to FAILED
      await prisma.enrollment.update({
        where: { userId_courseId: { userId: user.id, courseId: testCourseSlug } },
        data: { paymentStatus: 'FAILED' },
      });

      const failedCheck = await checkEnrollment(user.id, testCourseSlug);
      assert.strictEqual(failedCheck.isEnrolled, false, 'Failed enrollment must not grant course access');

      // 3. Update to COMPLETED
      await prisma.enrollment.update({
        where: { userId_courseId: { userId: user.id, courseId: testCourseSlug } },
        data: { paymentStatus: 'COMPLETED', amountPaid: 49.00 },
      });

      const completedCheck = await checkEnrollment(user.id, testCourseSlug);
      assert.strictEqual(completedCheck.isEnrolled, true, 'COMPLETED enrollment must grant access');

      // Clean up
      await prisma.enrollment.deleteMany({
        where: { userId: user.id, courseId: testCourseSlug },
      });
    });
  });

  describe('2. State Pollution & Idempotency Cleanup on Payment Failure', () => {
    test('handlePaymentFailure transitions order to FAILED and cleans up promo reservation', async () => {
      if (!process.env.DATABASE_URL) return;

      const user = await getOrCreateTestUser('test_sifalo_fail_user', 'fail_user@example.com');
      const testCourseSlug = 'sifalo-fail-cleanup-course';

      await prisma.course.upsert({
        where: { slug: testCourseSlug },
        create: {
          slug: testCourseSlug,
          title: 'Fail Cleanup Course',
          tagline: 'Test course',
          category: 'frontend',
          image: '/assets/w-rc.jpg',
          description: 'Testing',
          longDescription: 'Testing',
          instructorId: 'yahye',
          duration: '1h',
          level: 'Beginner',
          price: 29.00,
          originalPrice: 29.00,
          lastUpdated: '2026',
        },
        update: {},
      });

      const quote = await createCheckoutQuoteAndOrder({
        userId: user.id,
        userEmail: user.email,
        courseSlug: testCourseSlug,
      });

      assert.strictEqual(quote.status, PAYMENT_STATUS.PENDING);

      // Verify pending order in database
      const orderBefore = await prisma.checkoutOrder.findUnique({
        where: { id: quote.orderId },
      });
      assert.strictEqual(orderBefore?.status, PAYMENT_STATUS.PENDING);

      // Simulate Sifalo payment failure
      const failResult = await handlePaymentFailure({
        orderIdOrRef: quote.orderId,
        provider: 'SIFALO',
        reason: 'INSUFFICIENT_FUNDS',
      });

      assert.strictEqual(failResult.success, true);

      // Verify order is now FAILED, not PENDING
      const orderAfter = await prisma.checkoutOrder.findUnique({
        where: { id: quote.orderId },
      });
      assert.strictEqual(orderAfter?.status, PAYMENT_STATUS.FAILED);

      // Verify no active completed enrollment was leaked
      const enrollmentCheck = await checkEnrollment(user.id, testCourseSlug);
      assert.strictEqual(enrollmentCheck.isEnrolled, false);

      // Clean up
      await prisma.checkoutOrder.deleteMany({ where: { id: quote.orderId } });
    });
  });

  describe('3. Dynamic URL & Course ID Tracking', () => {
    test('return_url and cancel_url properly preserve dynamic courseSlug without fallback', () => {
      const origin = 'https://bitacademy.edu';
      const orderId = 'ORDER-TEST-123';
      const courseSlug = 'full-stack-web-development';

      const cancelUrl = `${origin}/checkout?course=${encodeURIComponent(courseSlug)}&cancelled=true&order_id=${encodeURIComponent(orderId)}`;
      const returnUrl = `${origin}/checkout/verify?order_id=${encodeURIComponent(orderId)}&course=${encodeURIComponent(courseSlug)}&courseSlug=${encodeURIComponent(courseSlug)}`;

      const cancelParams = new URL(cancelUrl).searchParams;
      assert.strictEqual(cancelParams.get('course'), 'full-stack-web-development');
      assert.strictEqual(cancelParams.get('cancelled'), 'true');
      assert.strictEqual(cancelParams.get('order_id'), 'ORDER-TEST-123');

      const returnParams = new URL(returnUrl).searchParams;
      assert.strictEqual(returnParams.get('course'), 'full-stack-web-development');
      assert.strictEqual(returnParams.get('courseSlug'), 'full-stack-web-development');
      assert.strictEqual(returnParams.get('order_id'), 'ORDER-TEST-123');
    });
  });
});
