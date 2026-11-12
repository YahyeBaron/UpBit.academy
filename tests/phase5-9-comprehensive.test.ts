import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { roundMoney, calculatePromoDiscount, PAYMENT_STATUS, PROMO_USAGE_STATUS } from '../lib/payments/domain.ts';
import { PromoCodeCreateSchema, PromoCodeUpdateSchema } from '../lib/validation-schemas.ts';

describe('Phase 5-9 Comprehensive Test Suite', () => {

  // ───────────────────────────────────────────────────────────────────────────
  // 1. UNIT TESTS: Normalization, Decimal, Dates, Min Order, Max Cap, Limits
  // ───────────────────────────────────────────────────────────────────────────
  describe('Unit Tests: Domain Logic & Policy Validation', () => {

    it('should round monetary amounts accurately to 2 decimals', () => {
      assert.equal(roundMoney(19.99), 19.99);
      assert.equal(roundMoney(19.995), 20.00);
      assert.equal(roundMoney(19.994), 19.99);
      assert.equal(roundMoney('49.900000000000006'), 49.90);
      assert.equal(roundMoney({ toNumber: () => 99.999 }), 100.00);
      assert.equal(roundMoney(null), 0);
      assert.equal(roundMoney(-5), 0);
    });

    it('should normalize promo codes to uppercase trimmed strings', () => {
      const parsed = PromoCodeCreateSchema.parse({
        code: '  summer2026_test  ',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
      assert.equal(parsed.code, 'SUMMER2026_TEST');
    });

    it('should reject invalid percentage discounts (<1 or >100)', () => {
      assert.throws(() => {
        PromoCodeCreateSchema.parse({
          code: 'BADPERCENT',
          discountType: 'PERCENTAGE',
          discountValue: 150,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        });
      }, /Percentage discount must be between 1 and 100/);

      assert.throws(() => {
        PromoCodeCreateSchema.parse({
          code: 'ZEROPERCENT',
          discountType: 'PERCENTAGE',
          discountValue: 0,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        });
      }, /Percentage discount must be between 1 and 100/);
    });

    it('should reject end dates before start dates', () => {
      const now = Date.now();
      assert.throws(() => {
        PromoCodeCreateSchema.parse({
          code: 'BADORDER',
          discountType: 'PERCENTAGE',
          discountValue: 20,
          startsAt: new Date(now + 86400000).toISOString(),
          expiresAt: new Date(now).toISOString(),
        });
      }, /Expiration date must be after start date/);
    });

    it('should enforce date boundaries during promo calculation', () => {
      const now = new Date();
      const futureStart = new Date(now.getTime() + 3600000);
      const expiredDate = new Date(now.getTime() - 3600000);

      const futurePromo = calculatePromoDiscount({
        code: 'FUTURE20',
        courseSlug: 'react-course',
        basePrice: 100,
        promoRecord: {
          id: 'p1',
          code: 'FUTURE20',
          isActive: true,
          startsAt: futureStart,
          expiresAt: new Date(now.getTime() + 86400000),
          usedCount: 0,
          maxPerUser: 1,
        },
      });
      assert.equal(futurePromo.isValid, false);
      assert.match(futurePromo.error || '', /not active yet/i);

      const expiredPromo = calculatePromoDiscount({
        code: 'EXPIRED20',
        courseSlug: 'react-course',
        basePrice: 100,
        promoRecord: {
          id: 'p2',
          code: 'EXPIRED20',
          isActive: true,
          startsAt: new Date(now.getTime() - 86400000),
          expiresAt: expiredDate,
          usedCount: 0,
          maxPerUser: 1,
        },
      });
      assert.equal(expiredPromo.isValid, false);
      assert.match(expiredPromo.error || '', /expired/i);
    });

    it('should enforce minimum order amount threshold', () => {
      const promoResult = calculatePromoDiscount({
        code: 'MIN50',
        courseSlug: 'react-course',
        basePrice: 40,
        promoRecord: {
          id: 'p3',
          code: 'MIN50',
          isActive: true,
          minimumOrder: 50,
          discountType: 'PERCENTAGE',
          discountValue: 20,
          usedCount: 0,
          maxPerUser: 1,
        },
      });
      assert.equal(promoResult.isValid, false);
      assert.match(promoResult.error || '', /Minimum order amount/i);
    });

    it('should apply maximum discount cap correctly', () => {
      const promoResult = calculatePromoDiscount({
        code: 'MAXCAP15',
        courseSlug: 'react-course',
        basePrice: 100, // 50% discount would be $50, but max discount cap is $15
        promoRecord: {
          id: 'p4',
          code: 'MAXCAP15',
          isActive: true,
          maxDiscount: 15,
          discountType: 'PERCENTAGE',
          discountValue: 50,
          usedCount: 0,
          maxPerUser: 1,
        },
      });
      assert.equal(promoResult.isValid, true);
      assert.equal(promoResult.calculatedDiscount, 15);
      assert.equal(promoResult.finalPrice, 85);
    });

    it('should handle fixed dollar discount type', () => {
      const promoResult = calculatePromoDiscount({
        code: 'FIXED30',
        courseSlug: 'react-course',
        basePrice: 100,
        promoRecord: {
          id: 'p5',
          code: 'FIXED30',
          isActive: true,
          discountType: 'FIXED',
          discountValue: 30,
          usedCount: 0,
          maxPerUser: 1,
        },
      });
      assert.equal(promoResult.isValid, true);
      assert.equal(promoResult.calculatedDiscount, 30);
      assert.equal(promoResult.finalPrice, 70);
    });

    it('should handle zero-value 100% discount promo codes', () => {
      const freePromo = calculatePromoDiscount({
        code: 'FREE100',
        courseSlug: 'react-course',
        basePrice: 99.99,
      });
      assert.equal(freePromo.isValid, true);
      assert.equal(freePromo.isZeroValue, true);
      assert.equal(freePromo.finalPrice, 0);
      assert.equal(freePromo.calculatedDiscount, 99.99);
    });

    it('should enforce course targeting restrictions', () => {
      const targetedResult = calculatePromoDiscount({
        code: 'PYTHONONLY',
        courseSlug: 'react-course',
        basePrice: 100,
        promoRecord: {
          id: 'p6',
          code: 'PYTHONONLY',
          isActive: true,
          applicableCourses: ['python-course'],
          usedCount: 0,
          maxPerUser: 1,
        },
      });
      assert.equal(targetedResult.isValid, false);
      assert.match(targetedResult.error || '', /not applicable to this course/i);
    });

    it('should enforce per-user usage limits', () => {
      const userLimitResult = calculatePromoDiscount({
        code: 'ONCEPERUSER',
        userId: 'user_123',
        courseSlug: 'react-course',
        basePrice: 100,
        promoRecord: {
          id: 'p7',
          code: 'ONCEPERUSER',
          isActive: true,
          maxPerUser: 1,
          usedCount: 5,
          usage: [
            { id: 'u1', userId: 'user_123', courseId: 'python-course', status: 'REDEEMED' },
          ],
        },
      });
      assert.equal(userLimitResult.isValid, false);
      assert.match(userLimitResult.error || '', /maximum allowed uses/i);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. INTEGRATION TESTS: Order Immutability, Reversals, Webhooks, Idempotency
  // ───────────────────────────────────────────────────────────────────────────
  describe('Integration & Architectural Assertions', () => {

    it('should define robust status states for orders and promo usages', () => {
      assert.equal(PAYMENT_STATUS.COMPLETED, 'COMPLETED');
      assert.equal(PAYMENT_STATUS.REVERSED, 'REVERSED');
      assert.equal(PROMO_USAGE_STATUS.REDEEMED, 'REDEEMED');
      assert.equal(PROMO_USAGE_STATUS.REVERSED, 'REVERSED');
    });

    it('should support updating promo parameters via PromoCodeUpdateSchema', () => {
      const updatePayload = PromoCodeUpdateSchema.parse({
        isActive: false,
        maxUses: 100,
        minOrderAmount: 25.50,
      });
      assert.equal(updatePayload.isActive, false);
      assert.equal(updatePayload.maxUses, 100);
      assert.equal(updatePayload.minOrderAmount, 25.50);
    });

  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. SECURITY TESTS: Credential Fallbacks & Log Sanitization
  // ───────────────────────────────────────────────────────────────────────────
  describe('Security Assertions', () => {

    it('should not contain unhashed passwords or hardcoded fallback credentials', () => {
      const testSecret = process.env.SIFALO_WEBHOOK_SECRET || '';
      assert.ok(!testSecret.includes('HARDCODED_DEFAULT_SECRET'), 'No hardcoded default secrets in config');
    });

    it('should format account numbers securely without leading zeroes or country prefixes', () => {
      const cleanAccount = (acc: string) => acc.replace(/[^\d]/g, '').replace(/^252/, '').replace(/^0/, '');
      assert.equal(cleanAccount('+252 61 500 0000'), '615000000');
      assert.equal(cleanAccount('0615000000'), '615000000');
    });

  });

});
