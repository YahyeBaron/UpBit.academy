import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  roundMoney,
  calculatePromoDiscount,
  PAYMENT_STATUS,
  PROMO_USAGE_STATUS,
  CHECKOUT_ORDER_STATUS,
} from '../lib/payments/domain.ts';

describe('Phase 3 — Decimal, CheckoutOrder, and PromoCodeCourse Unit Tests', () => {

  describe('Decimal & Monetary Policy Audits (roundMoney)', () => {
    test('rounds standard numbers to 2 decimals', () => {
      assert.strictEqual(roundMoney(49.99), 49.99);
      assert.strictEqual(roundMoney(49.994), 49.99);
      assert.strictEqual(roundMoney(49.995), 50.00);
    });

    test('handles string decimal inputs safely', () => {
      assert.strictEqual(roundMoney('99.99'), 99.99);
      assert.strictEqual(roundMoney('12.3456'), 12.35);
    });

    test('handles object with .toNumber() or .toString() (simulating Prisma.Decimal)', () => {
      const mockDecimal = { toNumber: () => 149.99 };
      assert.strictEqual(roundMoney(mockDecimal), 149.99);

      const mockDecimalStr = { toString: () => '79.50' };
      assert.strictEqual(roundMoney(mockDecimalStr), 79.50);
    });

    test('gracefully handles null, undefined, NaN, and negative values', () => {
      assert.strictEqual(roundMoney(null), 0);
      assert.strictEqual(roundMoney(undefined), 0);
      assert.strictEqual(roundMoney(-25.00), 0);
      assert.strictEqual(roundMoney(NaN), 0);
    });
  });

  describe('PromoCodeCourse Course-Specific Targeting', () => {
    test('allows discount when course slug matches targetedCourses relation', () => {
      const res = calculatePromoDiscount({
        code: 'NEXTJS_ONLY',
        courseSlug: 'nextjs-mastery',
        basePrice: 100.00,
        promoRecord: {
          id: 'p-10',
          code: 'NEXTJS_ONLY',
          discount: 25,
          targetedCourses: [{ courseId: 'nextjs-mastery' }],
          expiresAt: new Date(Date.now() + 86400000),
          usedCount: 0,
          maxPerUser: 1,
          isActive: true,
        },
      });

      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.calculatedDiscount, 25.00);
      assert.strictEqual(res.finalPrice, 75.00);
    });

    test('rejects discount when course slug does NOT match targetedCourses relation', () => {
      const res = calculatePromoDiscount({
        code: 'NEXTJS_ONLY',
        courseSlug: 'python-pro',
        basePrice: 100.00,
        promoRecord: {
          id: 'p-10',
          code: 'NEXTJS_ONLY',
          discount: 25,
          targetedCourses: [{ courseId: 'nextjs-mastery' }],
          expiresAt: new Date(Date.now() + 86400000),
          usedCount: 0,
          maxPerUser: 1,
          isActive: true,
        },
      });

      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.error, 'This promo code is not applicable to this course');
    });
  });

  describe('Discount Types (PERCENTAGE vs FIXED)', () => {
    test('calculates FIXED discount correctly', () => {
      const res = calculatePromoDiscount({
        code: 'FLAT_50',
        courseSlug: 'react-mastery',
        basePrice: 120.00,
        promoRecord: {
          id: 'p-11',
          code: 'FLAT_50',
          discountType: 'FIXED',
          discountValue: 50.00,
          expiresAt: new Date(Date.now() + 86400000),
          usedCount: 0,
          maxPerUser: 1,
          isActive: true,
        },
      });

      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.discountType, 'FIXED');
      assert.strictEqual(res.calculatedDiscount, 50.00);
      assert.strictEqual(res.finalPrice, 70.00);
    });

    test('calculates PERCENTAGE discount correctly', () => {
      const res = calculatePromoDiscount({
        code: 'PCT_30',
        courseSlug: 'react-mastery',
        basePrice: 200.00,
        promoRecord: {
          id: 'p-12',
          code: 'PCT_30',
          discountType: 'PERCENTAGE',
          discountValue: 30,
          expiresAt: new Date(Date.now() + 86400000),
          usedCount: 0,
          maxPerUser: 1,
          isActive: true,
        },
      });

      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.discountType, 'PERCENTAGE');
      assert.strictEqual(res.calculatedDiscount, 60.00);
      assert.strictEqual(res.finalPrice, 140.00);
    });
  });

  describe('CheckoutOrder & PromoCodeUsage Status Lifecycle', () => {
    test('validates CheckoutOrder status definitions', () => {
      assert.strictEqual(CHECKOUT_ORDER_STATUS.PENDING, 'PENDING');
      assert.strictEqual(CHECKOUT_ORDER_STATUS.COMPLETED, 'COMPLETED');
      assert.strictEqual(CHECKOUT_ORDER_STATUS.FAILED, 'FAILED');
      assert.strictEqual(CHECKOUT_ORDER_STATUS.EXPIRED, 'EXPIRED');
      assert.strictEqual(CHECKOUT_ORDER_STATUS.REVERSED, 'REVERSED');
    });

    test('validates PromoCodeUsage status definitions', () => {
      assert.strictEqual(PROMO_USAGE_STATUS.RESERVED, 'RESERVED');
      assert.strictEqual(PROMO_USAGE_STATUS.REDEEMED, 'REDEEMED');
      assert.strictEqual(PROMO_USAGE_STATUS.REVERSED, 'REVERSED');
    });
  });
});
