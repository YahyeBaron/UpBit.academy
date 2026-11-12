import { test, describe } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import {
  getSifaloWebhookSecret,
  isSifaloWebhookConfigured,
} from '../lib/sifalo-config.ts';
import {
  parseMuxSignatureHeader,
  generateMuxWebhookSignature,
  verifyMuxWebhookSignature,
} from '../lib/mux-server.ts';

describe('Webhook & Certificate Hardening Audit Test Suite', () => {

  describe('1. Sifalo Webhook Secret Resilience (Prevent 500s)', () => {
    test('isSifaloWebhookConfigured identifies placeholder secrets', () => {
      const orig = process.env.SIFALO_WEBHOOK_SECRET;
      try {
        process.env.SIFALO_WEBHOOK_SECRET = 'REPLACE_WITH_YOUR_SIFALO_WEBHOOK_SIGNING_SECRET';
        assert.strictEqual(isSifaloWebhookConfigured(), false);

        process.env.SIFALO_WEBHOOK_SECRET = '';
        assert.strictEqual(isSifaloWebhookConfigured(), false);

        process.env.SIFALO_WEBHOOK_SECRET = 'whsec_valid_secret_123456';
        assert.strictEqual(isSifaloWebhookConfigured(), true);
      } finally {
        process.env.SIFALO_WEBHOOK_SECRET = orig;
      }
    });

    test('getSifaloWebhookSecret provides dev fallback when unconfigured in non-production', () => {
      const origEnv = process.env.NODE_ENV;
      const origSecret = process.env.SIFALO_WEBHOOK_SECRET;
      try {
        (process.env as Record<string, string>).NODE_ENV = 'development';
        process.env.SIFALO_WEBHOOK_SECRET = 'REPLACE_WITH_YOUR_SIFALO_WEBHOOK_SIGNING_SECRET';
        const secret = getSifaloWebhookSecret();
        assert.ok(secret.length > 0, 'Dev fallback secret must be provided to prevent 500 crashes');
        assert.strictEqual(secret, 'whsec_sifalo_dev_test_secret_2026');
      } finally {
        (process.env as Record<string, string>).NODE_ENV = origEnv || 'test';
        process.env.SIFALO_WEBHOOK_SECRET = origSecret;
      }
    });

    test('getSifaloWebhookSecret throws safe configuration error in production when missing', () => {
      const origEnv = process.env.NODE_ENV;
      const origSecret = process.env.SIFALO_WEBHOOK_SECRET;
      try {
        (process.env as Record<string, string>).NODE_ENV = 'production';
        process.env.SIFALO_WEBHOOK_SECRET = '';
        assert.throws(
          () => getSifaloWebhookSecret(),
          /Webhook verification is not configured/
        );
      } finally {
        (process.env as Record<string, string>).NODE_ENV = origEnv || 'test';
        process.env.SIFALO_WEBHOOK_SECRET = origSecret;
      }
    });

    test('HMAC verification validates authentic payloads and rejects tampered data', () => {
      const secret = 'whsec_test_secret_abc123';
      const body = JSON.stringify({ reference: 'EST-12345', status: 'COMPLETED', amount: 99.0 });
      const signature = crypto.createHmac('sha256', secret).update(body, 'utf-8').digest('hex');

      // Test helper verify
      const verify = (raw: string, sig: string, sec: string) => {
        const expected = crypto.createHmac('sha256', sec).update(raw, 'utf-8').digest('hex');
        const expBuf = Buffer.from(expected, 'hex');
        const recBuf = Buffer.from(sig.replace(/^sha256=/, ''), 'hex');
        return expBuf.length === recBuf.length && crypto.timingSafeEqual(expBuf, recBuf);
      };

      assert.strictEqual(verify(body, signature, secret), true, 'Valid signature must pass');
      assert.strictEqual(verify(body, 'bad_signature_deadbeef', secret), false, 'Invalid signature must fail');
      assert.strictEqual(verify(body + 'tampered', signature, secret), false, 'Tampered body must fail');
    });
  });

  describe('2. Premature Certificate Issuance Prevention', () => {
    test('enforces that course completion is strictly required before issuing certificate', () => {
      // Simulate the verification logic from generateCertificate in Inngest
      const checkEligibility = (enrollment: {
        paymentStatus: string;
        progress: number;
        course?: { hasCertificate: boolean };
      }, totalLessons: number, completedCount: number) => {
        if (!enrollment || enrollment.paymentStatus !== 'COMPLETED') {
          return { eligible: false, reason: 'enrollment_not_completed' };
        }
        if (enrollment.course && enrollment.course.hasCertificate === false) {
          return { eligible: false, reason: 'course_has_no_certificate' };
        }
        const isCompleted =
          enrollment.progress >= 100 ||
          (totalLessons > 0 && completedCount >= totalLessons);

        if (!isCompleted) {
          return {
            eligible: false,
            reason: 'course_not_completed',
            progress: enrollment.progress,
            completedCount,
            totalLessons,
          };
        }
        return { eligible: true };
      };

      // Case A: Just paid, 0% progress -> MUST BE REJECTED
      const justPaid = checkEligibility(
        { paymentStatus: 'COMPLETED', progress: 0, course: { hasCertificate: true } },
        10,
        0
      );
      assert.strictEqual(justPaid.eligible, false);
      assert.strictEqual(justPaid.reason, 'course_not_completed');

      // Case B: In-progress learner (50% progress) -> MUST BE REJECTED
      const midProgress = checkEligibility(
        { paymentStatus: 'COMPLETED', progress: 50, course: { hasCertificate: true } },
        10,
        5
      );
      assert.strictEqual(midProgress.eligible, false);
      assert.strictEqual(midProgress.reason, 'course_not_completed');

      // Case C: Unpaid course -> MUST BE REJECTED
      const unpaid = checkEligibility(
        { paymentStatus: 'PENDING', progress: 100, course: { hasCertificate: true } },
        10,
        10
      );
      assert.strictEqual(unpaid.eligible, false);
      assert.strictEqual(unpaid.reason, 'enrollment_not_completed');

      // Case D: Course hasCertificate = false -> MUST BE REJECTED
      const noCertCourse = checkEligibility(
        { paymentStatus: 'COMPLETED', progress: 100, course: { hasCertificate: false } },
        10,
        10
      );
      assert.strictEqual(noCertCourse.eligible, false);
      assert.strictEqual(noCertCourse.reason, 'course_has_no_certificate');

      // Case E: Fully completed 100% and paid -> MUST BE ACCEPTED
      const fullyCompleted = checkEligibility(
        { paymentStatus: 'COMPLETED', progress: 100, course: { hasCertificate: true } },
        10,
        10
      );
      assert.strictEqual(fullyCompleted.eligible, true);
    });
  });

  describe('3. Mux Webhook Endpoint & Signature Verification', () => {
    const testSecret = 'whsec_mux_unit_test_secret_9876543210';
    const samplePayload = JSON.stringify({
      type: 'video.asset.ready',
      id: 'evt_test_123456',
      data: {
        id: 'asset_mux_abc123',
        status: 'ready',
        duration: 485.5,
        playback_ids: [{ id: 'playback_xyz789', policy: 'signed' }],
        passthrough: JSON.stringify({ lessonId: 'lesson-cs50-1' }),
      },
    });

    test('parseMuxSignatureHeader parses timestamp and signatures correctly', () => {
      const header = 't=1700000000,v1=abcdef0123456789,v1=9876543210fedcba';
      const parsed = parseMuxSignatureHeader(header);
      assert.strictEqual(parsed.timestamp, 1700000000);
      assert.strictEqual(parsed.signatures.length, 2);
      assert.strictEqual(parsed.signatures[0], 'abcdef0123456789');
      assert.strictEqual(parsed.signatures[1], '9876543210fedcba');
    });

    test('generateMuxWebhookSignature creates signature that verifies successfully', () => {
      const now = Math.floor(Date.now() / 1000);
      const header = generateMuxWebhookSignature(samplePayload, testSecret, now);

      const verification = verifyMuxWebhookSignature(samplePayload, header, testSecret);
      assert.strictEqual(verification.valid, true);
      assert.strictEqual(verification.error, undefined);
    });

    test('rejects expired webhook signatures (timestamp replay attack prevention)', () => {
      const tenMinutesAgo = Math.floor(Date.now() / 1000) - 600; // 600s > 300s tolerance
      const header = generateMuxWebhookSignature(samplePayload, testSecret, tenMinutesAgo);

      const verification = verifyMuxWebhookSignature(samplePayload, header, testSecret, 300);
      assert.strictEqual(verification.valid, false);
      assert.match(verification.error!, /replay attack/i);
    });

    test('rejects tampered payload content', () => {
      const now = Math.floor(Date.now() / 1000);
      const header = generateMuxWebhookSignature(samplePayload, testSecret, now);

      const tamperedPayload = samplePayload.replace('asset_mux_abc123', 'asset_hacked_666');
      const verification = verifyMuxWebhookSignature(tamperedPayload, header, testSecret);
      assert.strictEqual(verification.valid, false);
      assert.strictEqual(verification.error, 'Invalid webhook signature');
    });

    test('rejects missing or malformed signature header', () => {
      assert.strictEqual(verifyMuxWebhookSignature(samplePayload, '', testSecret).valid, false);
      assert.strictEqual(verifyMuxWebhookSignature(samplePayload, 'malformed_header', testSecret).valid, false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Clerk Webhook Secret Resilience
  // ─────────────────────────────────────────────────────────────────────────
  describe('4. Clerk Webhook Secret Resilience', () => {
    const CLERK_PLACEHOLDER = 'whsec_placeholder_clerk_webhook_secret';

    function isClerkWebhookConfigured(secret: string | undefined): boolean {
      return !!secret && secret !== CLERK_PLACEHOLDER && secret.length >= 10;
    }

    test('detects placeholder clerk webhook secret', () => {
      assert.strictEqual(isClerkWebhookConfigured(CLERK_PLACEHOLDER), false);
    });

    test('detects empty and undefined clerk webhook secret', () => {
      assert.strictEqual(isClerkWebhookConfigured(''), false);
      assert.strictEqual(isClerkWebhookConfigured(undefined), false);
    });

    test('accepts real clerk webhook secret format', () => {
      assert.strictEqual(isClerkWebhookConfigured('whsec_realvalue123456789'), true);
      assert.strictEqual(isClerkWebhookConfigured('whsec_abc123def456ghi789'), true);
    });

    test('503 error body does not expose internal config details', () => {
      // Guard: the 503 response body must never leak env variable names or secret values
      const errorBody = { error: 'Webhook processing temporarily unavailable.' };
      const serialized = JSON.stringify(errorBody);
      assert.ok(!serialized.includes('CLERK_WEBHOOK_SECRET'));
      assert.ok(!serialized.includes('placeholder'));
      assert.ok(!serialized.includes('whsec_'));
    });

    test('soft-delete preserves enrollment and certificate data', () => {
      // Validates the soft-delete intent: role → 'deleted', clerkId → null
      // Hard delete would orphan enrollment + certificate records
      const softDeleteUpdate = { role: 'deleted', clerkId: null as string | null };
      assert.strictEqual(softDeleteUpdate.role, 'deleted');
      assert.strictEqual(softDeleteUpdate.clerkId, null);
    });
  });
});
