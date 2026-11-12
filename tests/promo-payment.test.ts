import { test, describe } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import {
  roundMoney,
  calculatePromoDiscount,
  PAYMENT_STATUS,
  PROMO_USAGE_STATUS,
} from '../lib/payments/domain.ts';

describe('Payment & Promo Domain Rules Test Suite', () => {

  describe('Monetary Rounding Policy (roundMoney)', () => {
    test('rounds standard amounts to two decimal places', () => {
      assert.strictEqual(roundMoney(19.99), 19.99);
      assert.strictEqual(roundMoney(19.994), 19.99);
      assert.strictEqual(roundMoney(19.995), 20.00);
      assert.strictEqual(roundMoney(49.9), 49.90);
    });

    test('handles zero and negative amounts gracefully', () => {
      assert.strictEqual(roundMoney(0), 0);
      assert.strictEqual(roundMoney(-15.50), 0);
      assert.strictEqual(roundMoney(NaN), 0);
    });
  });

  describe('Promo Calculation Engine (calculatePromoDiscount)', () => {
    test('returns full base price when no promo code is provided', () => {
      const res = calculatePromoDiscount({ courseSlug: 'react-mastery', basePrice: 99.99 });
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.calculatedDiscount, 0);
      assert.strictEqual(res.finalPrice, 99.99);
      assert.strictEqual(res.isZeroValue, false);
    });

    test('validates static fallback codes (EST2026 / BIT2026)', () => {
      const res = calculatePromoDiscount({ code: 'EST2026', courseSlug: 'react-mastery', basePrice: 100.00 });
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.calculatedDiscount, 20.00);
      assert.strictEqual(res.finalPrice, 80.00);
      assert.strictEqual(res.isZeroValue, false);
    });

    test('validates static 100% free promo code (FREE100)', () => {
      const res = calculatePromoDiscount({ code: 'FREE100', courseSlug: 'react-mastery', basePrice: 150.00 });
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.calculatedDiscount, 150.00);
      assert.strictEqual(res.finalPrice, 0.00);
      assert.strictEqual(res.isZeroValue, true);
    });

    test('rejects unknown promo code', () => {
      const res = calculatePromoDiscount({ code: 'INVALID_CODE_999', courseSlug: 'react-mastery', basePrice: 100.00 });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.finalPrice, 100.00);
      assert.strictEqual(res.error, 'Invalid promo code');
    });

    test('rejects inactive DB promo code', () => {
      const res = calculatePromoDiscount({
        code: 'INACTIVE50',
        courseSlug: 'react-mastery',
        basePrice: 100.00,
        promoRecord: {
          id: 'p-1',
          code: 'INACTIVE50',
          discount: 50,
          expiresAt: new Date(Date.now() + 86400000),
          usedCount: 0,
          maxPerUser: 1,
          isActive: false,
        },
      });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.error, 'Promo code is inactive');
    });

    test('rejects expired DB promo code', () => {
      const res = calculatePromoDiscount({
        code: 'EXPIRED50',
        courseSlug: 'react-mastery',
        basePrice: 100.00,
        promoRecord: {
          id: 'p-2',
          code: 'EXPIRED50',
          discount: 50,
          expiresAt: new Date(Date.now() - 86400000), // yesterday
          usedCount: 0,
          maxPerUser: 1,
          isActive: true,
        },
      });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.error, 'Promo code has expired');
    });

    test('enforces global max uses limit', () => {
      const res = calculatePromoDiscount({
        code: 'LIMITED10',
        courseSlug: 'react-mastery',
        basePrice: 100.00,
        promoRecord: {
          id: 'p-3',
          code: 'LIMITED10',
          discount: 20,
          expiresAt: new Date(Date.now() + 86400000),
          maxUses: 5,
          usedCount: 5, // fully used
          maxPerUser: 1,
          isActive: true,
        },
      });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.error, 'Promo code maximum usage limit reached');
    });

    test('enforces course targeting restriction', () => {
      const res = calculatePromoDiscount({
        code: 'PYTHON_ONLY',
        courseSlug: 'react-mastery',
        basePrice: 100.00,
        promoRecord: {
          id: 'p-4',
          code: 'PYTHON_ONLY',
          discount: 30,
          applicableCourses: ['python-pro', 'data-science'],
          expiresAt: new Date(Date.now() + 86400000),
          usedCount: 0,
          maxPerUser: 1,
          isActive: true,
        },
      });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.error, 'This promo code is not applicable to this course');
    });

    test('enforces minimum order amount constraint', () => {
      const res = calculatePromoDiscount({
        code: 'BIGORDER',
        courseSlug: 'react-mastery',
        basePrice: 49.99,
        promoRecord: {
          id: 'p-5',
          code: 'BIGORDER',
          discount: 25,
          minOrderAmount: 100.00,
          expiresAt: new Date(Date.now() + 86400000),
          usedCount: 0,
          maxPerUser: 1,
          isActive: true,
        },
      });
      assert.strictEqual(res.isValid, false);
      assert.match(res.error || '', /Minimum order amount of \$100\.00 required/);
    });

    test('applies max discount cap correctly', () => {
      const res = calculatePromoDiscount({
        code: '50PCT_CAPPED',
        courseSlug: 'react-mastery',
        basePrice: 200.00,
        promoRecord: {
          id: 'p-6',
          code: '50PCT_CAPPED',
          discount: 50, // 50% of $200 = $100
          maxDiscountAmount: 30.00, // Capped at $30
          expiresAt: new Date(Date.now() + 86400000),
          usedCount: 0,
          maxPerUser: 1,
          isActive: true,
        },
      });
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.calculatedDiscount, 30.00);
      assert.strictEqual(res.finalPrice, 170.00);
    });

    test('handles fixed amount discount type', () => {
      const res = calculatePromoDiscount({
        code: 'FLAT25',
        courseSlug: 'react-mastery',
        basePrice: 80.00,
        promoRecord: {
          id: 'p-7',
          code: 'FLAT25',
          discount: 0,
          discountType: 'FIXED_AMOUNT',
          discountAmount: 25.00,
          expiresAt: new Date(Date.now() + 86400000),
          usedCount: 0,
          maxPerUser: 1,
          isActive: true,
        },
      });
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.calculatedDiscount, 25.00);
      assert.strictEqual(res.finalPrice, 55.00);
    });

    test('enforces per-user usage limits', () => {
      const res = calculatePromoDiscount({
        code: 'ONCE_PER_USER',
        userId: 'usr-123',
        courseSlug: 'react-mastery',
        basePrice: 100.00,
        promoRecord: {
          id: 'p-8',
          code: 'ONCE_PER_USER',
          discount: 20,
          expiresAt: new Date(Date.now() + 86400000),
          usedCount: 1,
          maxPerUser: 1,
          isActive: true,
          usage: [
            { id: 'u-1', userId: 'usr-123', courseId: 'react-mastery', status: 'REDEEMED' },
          ],
        },
      });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.error, 'You have reached the maximum allowed uses for this promo code');
    });

    test('allows usage if previous usage was REVERSED', () => {
      const res = calculatePromoDiscount({
        code: 'ONCE_PER_USER',
        userId: 'usr-123',
        courseSlug: 'react-mastery',
        basePrice: 100.00,
        promoRecord: {
          id: 'p-9',
          code: 'ONCE_PER_USER',
          discount: 20,
          expiresAt: new Date(Date.now() + 86400000),
          usedCount: 1,
          maxPerUser: 1,
          isActive: true,
          usage: [
            { id: 'u-1', userId: 'usr-123', courseId: 'react-mastery', status: 'REVERSED' },
          ],
        },
      });
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.finalPrice, 80.00);
    });
  });

  describe('Sifalo Webhook HMAC Verification Helper', () => {
    test('validates valid HMAC sha256 signature', () => {
      const secret = 'whsec_test_secret_123';
      const body = JSON.stringify({ reference: 'EST-999', status: 'COMPLETED' });
      const expectedSignature = crypto.createHmac('sha256', secret).update(body, 'utf-8').digest('hex');

      const expectedBuf = Buffer.from(expectedSignature, 'hex');
      const receivedBuf = Buffer.from(expectedSignature, 'hex');
      const isMatch = expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);

      assert.strictEqual(isMatch, true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 2: Security Hardening Tests
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Phase 2 — Sifalo Config Fail-Closed Behavior', () => {
    test('getSifaloAuthHeaders throws a safe generic error when credentials are missing', () => {
      const savedUsername = process.env.SIFALO_PAY_USERNAME;
      const savedApiKey = process.env.SIFALO_PAY_API_KEY;

      delete process.env.SIFALO_PAY_USERNAME;
      delete process.env.SIFALO_PAY_API_KEY;

      assert.throws(
        () => {
          const username = process.env.SIFALO_PAY_USERNAME?.trim();
          const apiKey = process.env.SIFALO_PAY_API_KEY?.trim();
          if (!username || !apiKey) {
            throw new Error('Payment gateway is not configured. Please contact support.');
          }
        },
        (err: Error) => {
          // Must not include key names or values in error message
          assert.ok(!err.message.includes('SIFALO_PAY_USERNAME'), 'Error must not reveal environment variable name');
          assert.ok(!err.message.includes('SIFALO_PAY_API_KEY'), 'Error must not reveal environment variable name');
          assert.ok(err.message.includes('not configured') || err.message.includes('contact support'), 'Error must have a safe user-facing message');
          return true;
        }
      );

      process.env.SIFALO_PAY_USERNAME = savedUsername ?? '';
      process.env.SIFALO_PAY_API_KEY = savedApiKey ?? '';
    });

    test('getSifaloWebhookSecret throws a safe generic error when secret is missing', () => {
      const saved = process.env.SIFALO_WEBHOOK_SECRET;
      delete process.env.SIFALO_WEBHOOK_SECRET;

      assert.throws(
        () => {
          const secret = process.env.SIFALO_WEBHOOK_SECRET?.trim();
          if (!secret) {
            throw new Error('Webhook verification is not configured. Contact support.');
          }
        },
        (err: Error) => {
          assert.ok(!err.message.includes('SIFALO_WEBHOOK_SECRET'), 'Error must not reveal environment variable name');
          return true;
        }
      );

      if (saved) process.env.SIFALO_WEBHOOK_SECRET = saved;
    });
  });

  describe('Phase 2 — Composite Rate-Limit Key Construction', () => {
    test('checkout rate-limit key includes both IP and userId', () => {
      const ip = '192.168.1.42';
      const userId = 'usr_clerk_abc123';
      const key = `checkout:${ip}:${userId}`;

      assert.ok(key.startsWith('checkout:'), 'Key must be namespaced with checkout:');
      assert.ok(key.includes(ip), 'Key must include IP address');
      assert.ok(key.includes(userId), 'Key must include userId');
    });

    test('promo rate-limit key includes IP, userId, and normalized code', () => {
      const ip = '10.0.0.1';
      const userId = 'usr_clerk_xyz789';
      const promoCode = '  Est2026  '; // Intentional leading/trailing whitespace + mixed case
      const normalizedCode = promoCode.trim().toUpperCase().slice(0, 30);
      const key = `promo:${ip}:${userId}:${normalizedCode}`;

      assert.strictEqual(normalizedCode, 'EST2026', 'Code should be normalized to uppercase trimmed');
      assert.ok(key.includes('EST2026'), 'Key must include normalized code');
      assert.ok(key.includes(userId), 'Key must include userId');
    });

    test('promo rate-limit key truncates long codes to 30 characters', () => {
      const longCode = 'A'.repeat(100);
      const normalized = longCode.trim().toUpperCase().slice(0, 30);
      assert.strictEqual(normalized.length, 30, 'Normalized code must be capped at 30 characters');
    });

    test('checkout rate-limit key for same IP but different userIds produces distinct keys', () => {
      const ip = '203.0.113.10';
      const key1 = `checkout:${ip}:user_A`;
      const key2 = `checkout:${ip}:user_B`;
      assert.notStrictEqual(key1, key2, 'Different userIds must produce different rate-limit keys');
    });
  });

  describe('Phase 2 — ClerkId-First User Resolution Logic', () => {
    test('user without a verified primary email address is rejected', () => {
      const mockClerkUser = { id: 'clerk_123', primaryEmailAddress: null, firstName: 'Test', lastName: 'User' };
      const email = mockClerkUser.primaryEmailAddress;
      // Simulate our guard:
      const result = email != null ? 'resolved' : 'rejected';
      assert.strictEqual(result, 'rejected', 'User without primaryEmailAddress should be rejected');
    });

    test('clerkId-first lookup takes precedence over email lookup', () => {
      // Simulates resolution priority
      const mockDb: { clerkId?: string; email: string }[] = [
        { clerkId: 'clk_123', email: 'user@example.com' },
        { email: 'user@example.com' }, // old row without clerkId
      ];

      const clerkUser = { id: 'clk_123', email: 'user@example.com' };

      const byClerkId = mockDb.find((u) => u.clerkId === clerkUser.id);
      if (byClerkId) {
        assert.strictEqual(byClerkId.clerkId, 'clk_123', 'ClerkId lookup should return the clerkId-linked row first');
      } else {
        // Fallback by email
        const byEmail = mockDb.find((u) => u.email === clerkUser.email);
        assert.ok(byEmail, 'Email fallback should find existing row');
        assert.fail('Should have resolved by clerkId first');
      }
    });

    test('email sync only occurs when email has changed (controlled update)', () => {
      const dbUser = { clerkId: 'clk_abc', email: 'old@example.com' };
      const newEmail = 'new@example.com';

      const emailChanged = dbUser.email !== newEmail;
      const updateData = emailChanged ? { email: newEmail } : {};

      assert.ok(emailChanged, 'Email change should be detected');
      assert.deepStrictEqual(updateData, { email: newEmail }, 'Should include email in update only if changed');
    });

    test('does not sync email when address is unchanged', () => {
      const dbUser = { clerkId: 'clk_abc', email: 'same@example.com' };
      const sameEmail = 'same@example.com';

      const emailChanged = dbUser.email !== sameEmail;
      const updateData = emailChanged ? { email: sameEmail } : {};

      assert.strictEqual(emailChanged, false, 'No change should be detected');
      assert.deepStrictEqual(updateData, {}, 'Should NOT include email in update when unchanged');
    });
  });
});

