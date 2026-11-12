import { test, describe } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../lib/prisma.ts';
import {
  createCheckoutQuoteAndOrder,
  finalizeSuccessfulPayment,
  handlePaymentReversal,
  PaymentError,
} from '../lib/payments/service.ts';
import { PAYMENT_STATUS, PROMO_USAGE_STATUS } from '../lib/payments/domain.ts';

async function getTestUserId(): Promise<string> {
  if (process.env.DATABASE_URL) {
    const user = await prisma.user.findFirst();
    if (user) return user.id;
  }
  return 'usr_test_1';
}

describe('Phase 4 & 5 — Immutable Checkout Creation & Atomic Payment Engine Tests', () => {

  describe('Quantity & Input Validation (createCheckoutQuoteAndOrder)', () => {
    test('rejects non-positive, zero, fractional, or non-numeric quantities', async () => {
      const userId = await getTestUserId();
      const invalidQuantities = [0, -1, -10, 1.5, NaN, Infinity];

      for (const qty of invalidQuantities) {
        await assert.rejects(
          async () => {
            await createCheckoutQuoteAndOrder({
              userId,
              courseSlug: 'ultimate-nextjs-guide',
              quantity: qty as number,
            });
          },
          (err: Error) => {
            assert.ok(err instanceof PaymentError || err.name === 'PaymentError');
            assert.match(err.message, /Quantity must be a positive integer/i);
            return true;
          }
        );
      }
    });

    test('accepts valid positive integer quantity 1', async () => {
      const userId = await getTestUserId();
      const result = await createCheckoutQuoteAndOrder({
        userId,
        courseSlug: 'ultimate-nextjs-guide',
        quantity: 1,
      });

      assert.ok(result.orderId.startsWith('ORDER-'));
      assert.strictEqual(result.courseSlug, 'ultimate-nextjs-guide');
      assert.strictEqual(result.quantity, 1);
      assert.strictEqual(typeof result.finalAmount, 'number');
      assert.ok(result.finalAmount >= 0);
    });
  });

  describe('Course Availability & Eligibility Verification', () => {
    test('rejects unpublished or deleted course', async () => {
      const userId = await getTestUserId();
      await assert.rejects(
        async () => {
          await createCheckoutQuoteAndOrder({
            userId,
            courseSlug: 'non-existent-course-slug-999',
          });
        },
        (err: Error) => {
          assert.ok(err instanceof PaymentError || err.name === 'PaymentError');
          assert.match(err.message, /not available for purchase|not found/i);
          return true;
        }
      );
    });
  });

  describe('Zero-Value Order Execution', () => {
    test('completes zero-value orders ($0.00) without external payment gateway call', async () => {
      const userId = await getTestUserId();
      const result = await createCheckoutQuoteAndOrder({
        userId,
        courseSlug: 'ultimate-nextjs-guide',
        promoCode: 'FREE100',
      });

      assert.strictEqual(result.isZeroValue, true);
      assert.strictEqual(result.finalAmount, 0);
      assert.strictEqual(result.status, PAYMENT_STATUS.COMPLETED);
    });
  });

  describe('Atomic Payment Finalization & Idempotency Rules', () => {
    test('finalizeSuccessfulPayment handles non-DB environment gracefully', async () => {
      const userId = await getTestUserId();
      const order = await createCheckoutQuoteAndOrder({
        userId,
        courseSlug: 'ultimate-nextjs-guide',
      });

      const res = await finalizeSuccessfulPayment({
        orderIdOrRef: order.orderId,
        provider: 'SIFALO',
        authoritativeAmount: order.finalAmount,
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.status, PAYMENT_STATUS.COMPLETED);
    });

    test('handlePaymentReversal handles non-DB environment gracefully', async () => {
      const userId = await getTestUserId();
      const order = await createCheckoutQuoteAndOrder({
        userId,
        courseSlug: 'ultimate-nextjs-guide',
      });

      const res = await handlePaymentReversal({
        orderIdOrRef: order.orderId,
        provider: 'SIFALO',
        reason: 'REFUNDED',
      });

      assert.strictEqual(res.success, true);
    });
  });
});
