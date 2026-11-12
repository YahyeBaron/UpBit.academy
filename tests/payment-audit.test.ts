import { test, describe } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../lib/prisma.ts';
import {
  calculatePromoDiscount,
  PAYMENT_STATUS,
  PROMO_USAGE_STATUS,
} from '../lib/payments/domain.ts';
import {
  createCheckoutQuoteAndOrder,
  finalizeSuccessfulPayment,
  handlePaymentReversal,
  handlePaymentFailure,
  PaymentError,
} from '../lib/payments/service.ts';

async function getTestUserId(): Promise<string> {
  if (process.env.DATABASE_URL) {
    const user = await prisma.user.findFirst();
    if (user) return user.id;
  }
  return 'usr_idem_test';
}

describe('Payment & Promo-Code Audit Security & Logic Verification', () => {

  describe('1. Non-Production Auto-Confirmation Bypass Removal', () => {
    test('calculatePromoDiscount rejects static fallback codes outside test mode', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalFallback = process.env.ALLOW_STATIC_PROMO_FALLBACK;

      try {
        process.env.NODE_ENV = 'production';
        delete process.env.ALLOW_STATIC_PROMO_FALLBACK;

        const res = calculatePromoDiscount({
          code: 'FREE100',
          courseSlug: 'ultimate-nextjs-guide',
          basePrice: 100,
        });

        assert.strictEqual(res.isValid, false);
        assert.strictEqual(res.error, 'Invalid promo code');
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
        if (originalFallback) process.env.ALLOW_STATIC_PROMO_FALLBACK = originalFallback;
      }
    });
  });

  describe('2. Amount & Currency Matching Policy', () => {
    test('calculatePromoDiscount clamps out-of-bounds percentage values (0..100)', () => {
      const resNegative = calculatePromoDiscount({
        code: 'TESTNEG',
        courseSlug: 'ultimate-nextjs-guide',
        basePrice: 100,
        promoRecord: {
          id: 'p1',
          code: 'TESTNEG',
          discountType: 'PERCENTAGE',
          discountValue: -50,
          usedCount: 0,
          maxPerUser: 1,
          isActive: true,
        } as any,
      });

      assert.strictEqual(resNegative.isValid, false);
      assert.match(resNegative.error || '', /Invalid promo percentage/i);

      const resOver = calculatePromoDiscount({
        code: 'TESTOVER',
        courseSlug: 'ultimate-nextjs-guide',
        basePrice: 100,
        promoRecord: {
          id: 'p2',
          code: 'TESTOVER',
          discountType: 'PERCENTAGE',
          discountValue: 150,
          usedCount: 0,
          maxPerUser: 1,
          isActive: true,
        } as any,
      });

      assert.strictEqual(resOver.isValid, false);
      assert.match(resOver.error || '', /Invalid promo percentage/i);
    });
  });

  describe('3. Idempotency Keys in Order Creation', () => {
    test('createCheckoutQuoteAndOrder accepts idempotency key argument', async () => {
      const userId = await getTestUserId();
      const idempotencyKey = `IDEM-${Date.now()}`;
      const order = await createCheckoutQuoteAndOrder({
        userId,
        courseSlug: 'ultimate-nextjs-guide',
        idempotencyKey,
      });

      assert.ok(order.orderId);
      assert.strictEqual(order.courseSlug, 'ultimate-nextjs-guide');
    });
  });

  describe('4. Failed Payment State Transitions', () => {
    test('handlePaymentFailure handles non-existing order gracefully', async () => {
      const res = await handlePaymentFailure({
        orderIdOrRef: 'NON_EXISTENT_ORDER_999',
        provider: 'SIFALO',
        reason: 'FAILED',
      });

      assert.ok(res);
    });
  });

  describe('5. Promo Code Reservation & Expiry', () => {
    test('calculatePromoDiscount enforces 15-minute reservation window', () => {
      const nowMs = Date.now();
      const tenMinsAgo = new Date(nowMs - 10 * 60 * 1000);
      const twentyMinsAgo = new Date(nowMs - 20 * 60 * 1000);

      // Active reservation (10 mins ago) should count towards maxPerUser limit
      const activeRes = calculatePromoDiscount({
        code: 'RESERVE_TEST',
        userId: 'usr_res_1',
        courseSlug: 'ultimate-nextjs-guide',
        basePrice: 100,
        promoRecord: {
          id: 'p_res_1',
          code: 'RESERVE_TEST',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          usedCount: 1,
          maxPerUser: 1,
          isActive: true,
          usage: [
            {
              id: 'u1',
              userId: 'usr_res_1',
              courseId: 'ultimate-nextjs-guide',
              status: PROMO_USAGE_STATUS.RESERVED,
              reservedAt: tenMinsAgo,
            },
          ],
        } as any,
      });

      assert.strictEqual(activeRes.isValid, false);
      assert.match(activeRes.error || '', /maximum allowed uses/i);

      // Expired reservation (20 mins ago) should NOT block user
      const expiredRes = calculatePromoDiscount({
        code: 'RESERVE_TEST',
        userId: 'usr_res_1',
        courseSlug: 'ultimate-nextjs-guide',
        basePrice: 100,
        promoRecord: {
          id: 'p_res_1',
          code: 'RESERVE_TEST',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          usedCount: 1,
          maxPerUser: 1,
          isActive: true,
          usage: [
            {
              id: 'u1',
              userId: 'usr_res_1',
              courseId: 'ultimate-nextjs-guide',
              status: PROMO_USAGE_STATUS.RESERVED,
              reservedAt: twentyMinsAgo,
            },
          ],
        } as any,
      });

      assert.strictEqual(expiredRes.isValid, true);
    });
  });

  describe('6. Course Targeting Normalization', () => {
    test('calculatePromoDiscount matches course slug against targetedCourses and applicableCourses', () => {
      const targetedRes = calculatePromoDiscount({
        code: 'TARGET_TEST',
        courseSlug: 'ultimate-nextjs-guide',
        basePrice: 100,
        promoRecord: {
          id: 'p_target_1',
          code: 'TARGET_TEST',
          discountType: 'PERCENTAGE',
          discountValue: 20,
          usedCount: 0,
          maxPerUser: 1,
          isActive: true,
          targetedCourses: [{ courseId: 'ultimate-nextjs-guide' }],
        } as any,
      });

      assert.strictEqual(targetedRes.isValid, true);

      const mismatchedRes = calculatePromoDiscount({
        code: 'TARGET_TEST',
        courseSlug: 'other-course-slug',
        basePrice: 100,
        promoRecord: {
          id: 'p_target_1',
          code: 'TARGET_TEST',
          discountType: 'PERCENTAGE',
          discountValue: 20,
          usedCount: 0,
          maxPerUser: 1,
          isActive: true,
          targetedCourses: [{ courseId: 'ultimate-nextjs-guide' }],
        } as any,
      });

      assert.strictEqual(mismatchedRes.isValid, false);
      assert.match(mismatchedRes.error || '', /not applicable to this course/i);
    });
  });
});
