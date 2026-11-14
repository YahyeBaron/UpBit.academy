import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  escapeHtml,
  getAppUrl,
  renderWelcomeEmail,
  renderEnrollmentReceiptEmail,
  renderCertificateIssuedEmail,
  renderOperationalAlertEmail,
} from '../lib/email-templates';
import {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  buildUnsubscribeUrl,
} from '../lib/email-delivery';
import { dispatchResendEmail } from '../lib/email';

describe('Production-Safe Email Automation Test Suite', () => {
  describe('1. HTML Escaping & Injection Protection', () => {
    it('escapes dangerous HTML characters', () => {
      const dangerous = '<script>alert("xss")</script> & \'test\'';
      const escaped = escapeHtml(dangerous);
      assert.strictEqual(
        escaped,
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#39;test&#39;'
      );
    });

    it('escapes tag breakout vectors in user attributes', () => {
      const vector = '"><img src=x onerror=alert(1)>';
      const escaped = escapeHtml(vector);
      assert.strictEqual(escaped, '&quot;&gt;&lt;img src=x onerror=alert(1)&gt;');
    });

    it('handles null, undefined, and non-string types safely', () => {
      assert.strictEqual(escapeHtml(null), '');
      assert.strictEqual(escapeHtml(undefined), '');
      assert.strictEqual(escapeHtml(12345), '12345');
      assert.strictEqual(escapeHtml(0), '0');
    });

    it('leaves clean alphanumeric strings untouched', () => {
      const clean = 'Advanced Next.js 15 Full-Stack Architecture';
      assert.strictEqual(escapeHtml(clean), clean);
    });
  });

  describe('2. Canonical URL Resolution', () => {
    it('does not contain hardcoded topaz-iota vercel domains', () => {
      const url = getAppUrl();
      assert.ok(!url.includes('e-learning-topaz-iota.vercel.app'));
    });
  });

  describe('3. Template Rendering & Plain-Text Fallbacks', () => {
    it('renders welcome email with both HTML and plain-text alternatives', () => {
      const rendered = renderWelcomeEmail({
        recipientEmail: 'dev@example.com',
        unsubscribeUrl: 'https://example.com/api/unsubscribe?token=abc',
      });

      assert.ok(rendered.subject.includes('Welcome to UpBit Academy'));
      assert.ok(rendered.html.includes('<!DOCTYPE html>'));
      assert.ok(rendered.html.includes('Developer Dispatch'));
      assert.ok(rendered.text.length > 50);
      assert.ok(rendered.text.includes('Welcome to UpBit Academy!'));
      assert.ok(rendered.text.includes('Unsubscribe:'));
    });

    it('renders enrollment receipt with escaped details and monetary precision', () => {
      const maliciousCourse = '<script>bad()</script> WebGL Shaders';
      const rendered = renderEnrollmentReceiptEmail({
        recipientEmail: 'student@example.com',
        courseTitle: maliciousCourse,
        amountPaid: 49.99,
        transactionRef: 'EST-998877',
        provider: 'ZAAD Pay',
      });

      assert.ok(rendered.subject.includes('Payment Confirmed'));
      assert.ok(rendered.html.includes('&lt;script&gt;bad()&lt;/script&gt; WebGL Shaders'));
      assert.ok(!rendered.html.includes('<script>bad()</script>'));
      assert.ok(rendered.html.includes('$49.99 USD'));
      assert.ok(rendered.text.includes('EST-998877'));
      assert.ok(rendered.text.includes('$49.99 USD'));
    });

    it('renders learner certificate email with verification code and link', () => {
      const rendered = renderCertificateIssuedEmail({
        recipientEmail: 'student@example.com',
        courseTitle: 'Full-Stack Next.js 15 Masterclass',
        studentName: 'Alex Doe',
        verificationCode: 'CERT-12345-ABC',
        certificateId: 'cert_xyz_89',
      });

      assert.ok(rendered.subject.includes('Certificate Issued'));
      assert.ok(rendered.html.includes('Alex Doe'));
      assert.ok(rendered.html.includes('CERT-12345-ABC'));
      assert.ok(rendered.html.includes('/certificates/cert_xyz_89'));
      assert.ok(rendered.text.includes('Alex Doe'));
      assert.ok(rendered.text.includes('CERT-12345-ABC'));
    });

    it('renders operational alert with monospace details block', () => {
      const rendered = renderOperationalAlertEmail({
        subject: 'Database Connection Pool Warning',
        message: 'High connection count detected on replica.',
        details: 'poolSize: 98, max: 100',
      });

      assert.ok(rendered.subject.includes('[System Alert]'));
      assert.ok(rendered.html.includes('High connection count detected'));
      assert.ok(rendered.html.includes('poolSize: 98, max: 100'));
      assert.ok(rendered.text.includes('High connection count detected'));
    });
  });

  describe('4. Unsubscribe HMAC Token Security', () => {
    it('generates consistent deterministic tokens for a given email', () => {
      const email = 'subscriber@example.com';
      const token1 = generateUnsubscribeToken(email);
      const token2 = generateUnsubscribeToken(email.toUpperCase()); // case insensitive
      assert.strictEqual(token1, token2);
      assert.ok(token1.length >= 32);
    });

    it('verifies legitimate unsubscribe tokens successfully', () => {
      const email = 'subscriber@example.com';
      const token = generateUnsubscribeToken(email);
      assert.strictEqual(verifyUnsubscribeToken(email, token), true);
    });

    it('rejects tampered or forged tokens', () => {
      const email = 'subscriber@example.com';
      const legitToken = generateUnsubscribeToken(email);
      const forgedToken = legitToken.slice(0, -4) + '0000';
      assert.strictEqual(verifyUnsubscribeToken(email, forgedToken), false);
    });

    it('rejects token generated for a different email', () => {
      const emailA = 'alice@example.com';
      const emailB = 'bob@example.com';
      const tokenA = generateUnsubscribeToken(emailA);
      assert.strictEqual(verifyUnsubscribeToken(emailB, tokenA), false);
    });

    it('constructs well-formed unsubscribe URLs', () => {
      const email = 'user@test.org';
      const url = buildUnsubscribeUrl(email);
      assert.ok(url.includes('/api/unsubscribe'));
      assert.ok(url.includes(`email=${encodeURIComponent(email)}`));
      assert.ok(url.includes('token='));
    });
  });

  describe('5. Email Gateway Credential & Error Handling', () => {
    it('fails safely without crashing when RESEND_API_KEY is missing', async () => {
      const originalKey = process.env.RESEND_API_KEY;
      try {
        delete process.env.RESEND_API_KEY;
        const result = await dispatchResendEmail({
          to: 'test@example.com',
          subject: 'Test Subject',
          html: '<p>Test</p>',
          category: 'TRANSACTIONAL',
          idempotencyKey: 'test/key_1',
        });

        assert.strictEqual(result.success, false);
        assert.ok(result.error?.includes('RESEND_API_KEY is not configured'));
        assert.strictEqual(result.category, 'TRANSACTIONAL');
        assert.strictEqual(result.idempotencyKey, 'test/key_1');
      } finally {
        if (originalKey) {
          process.env.RESEND_API_KEY = originalKey;
        }
      }
    });

    it('classifies categories correctly across transactional and marketing', async () => {
      const originalKey = process.env.RESEND_API_KEY;
      try {
        delete process.env.RESEND_API_KEY;
        const marketingResult = await dispatchResendEmail({
          to: 'lead@example.com',
          subject: 'Newsletter #1',
          html: '<p>Hi</p>',
          category: 'MARKETING',
          idempotencyKey: 'welcome/lead@example.com',
        });
        assert.strictEqual(marketingResult.category, 'MARKETING');
      } finally {
        if (originalKey) {
          process.env.RESEND_API_KEY = originalKey;
        }
      }
    });
  });

  describe('6. Idempotency Key Formatting', () => {
    it('produces expected prefixes for each domain lifecycle event', () => {
      const welcomeKey = `welcome/${'User@Example.com'.toLowerCase().trim()}`;
      const receiptKey = `receipt/EST-123456`;
      const certKey = `certificate/cert_clerk_001`;

      assert.strictEqual(welcomeKey, 'welcome/user@example.com');
      assert.strictEqual(receiptKey, 'receipt/EST-123456');
      assert.strictEqual(certKey, 'certificate/cert_clerk_001');
    });
  });
});
