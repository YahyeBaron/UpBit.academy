/**
 * tests/mux-signing.test.ts
 *
 * Comprehensive test suite for Mux RS256 token signing, key parsing,
 * token payload validation, and playback configuration.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'crypto';
import {
  parsePrivateKey,
  signMuxToken,
  verifyMuxToken,
  getMuxPlaybackConfig,
  resolveAuthorizedLessonPlayback,
} from '../lib/mux-server';

describe('Mux Signed URLs & Token Cryptography', () => {
  // Generate a test RSA 2048-bit keypair for test assertions
  const { publicKey: testPublicKey, privateKey: testPrivateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const testKeyId = 'k01test_key_id_999';
  const testPlaybackId = 'q02abc123xyzPlaybackId';

  describe('1. Private Key Parsing', () => {
    it('parses raw PEM strings with standard newlines', () => {
      const parsed = parsePrivateKey(testPrivateKey);
      assert.match(parsed, /-----BEGIN PRIVATE KEY-----/);
      assert.match(parsed, /-----END PRIVATE KEY-----/);
    });

    it('parses raw PEM strings with escaped \\n characters', () => {
      const escaped = testPrivateKey.replace(/\n/g, '\\n');
      const parsed = parsePrivateKey(escaped);
      assert.match(parsed, /-----BEGIN PRIVATE KEY-----/);
      assert.ok(parsed.includes('\n'), 'Should replace literal \\n with actual newlines');
    });

    it('parses Base64-encoded PEM strings', () => {
      const b64 = Buffer.from(testPrivateKey, 'utf-8').toString('base64');
      const parsed = parsePrivateKey(b64);
      assert.match(parsed, /-----BEGIN PRIVATE KEY-----/);
      assert.match(parsed, /-----END PRIVATE KEY-----/);
    });
  });

  describe('2. RS256 JWT Token Generation & Verification', () => {
    it('generates a valid RS256 video playback token', async () => {
      const token = await signMuxToken(testPlaybackId, testKeyId, testPrivateKey, 'v', 3600);
      assert.ok(token);
      assert.equal(token.split('.').length, 3, 'JWT must contain header, payload, and signature');

      // Cryptographic signature verification using public key
      const verification = verifyMuxToken(token, testPublicKey);
      assert.equal(verification.valid, true, `Verification failed: ${verification.error}`);
      assert.equal(verification.payload?.sub, testPlaybackId);
      assert.equal(verification.payload?.aud, 'v');
      assert.ok(verification.payload?.exp > Math.floor(Date.now() / 1000));
      assert.ok(verification.payload?.iat <= Math.floor(Date.now() / 1000));
    });

    it('generates a valid thumbnail token with aud: "t"', async () => {
      const token = await signMuxToken(testPlaybackId, testKeyId, testPrivateKey, 't', 1800);
      const verification = verifyMuxToken(token, testPublicKey);
      assert.equal(verification.valid, true);
      assert.equal(verification.payload?.aud, 't');
      assert.equal(verification.payload?.sub, testPlaybackId);
    });

    it('generates a valid storyboard token with aud: "s"', async () => {
      const token = await signMuxToken(testPlaybackId, testKeyId, testPrivateKey, 's', 1800);
      const verification = verifyMuxToken(token, testPublicKey);
      assert.equal(verification.valid, true);
      assert.equal(verification.payload?.aud, 's');
      assert.equal(verification.payload?.sub, testPlaybackId);
    });

    it('embeds kid in JWT header', async () => {
      const token = await signMuxToken(testPlaybackId, testKeyId, testPrivateKey, 'v');
      const [headerB64] = token.split('.');
      const header = JSON.parse(Buffer.from(headerB64, 'base64').toString('utf-8'));
      assert.equal(header.alg, 'RS256');
      assert.equal(header.kid, testKeyId);
      assert.equal(header.typ, 'JWT');
    });

    it('rejects tampered tokens', async () => {
      const token = await signMuxToken(testPlaybackId, testKeyId, testPrivateKey, 'v');
      const [h, _p, s] = token.split('.');
      // Tamper payload
      const tamperedPayload = Buffer.from(JSON.stringify({ sub: 'forged_id', aud: 'v' })).toString('base64');
      const forgedToken = `${h}.${tamperedPayload}.${s}`;

      const verification = verifyMuxToken(forgedToken, testPublicKey);
      assert.equal(verification.valid, false);
      assert.match(verification.error || '', /Signature verification failed/);
    });
  });

  describe('3. Playback Configuration & Multi-Token Signing', () => {
    it('falls back to unsigned playback when env vars are missing', async () => {
      const origKeyId = process.env.MUX_SIGNING_KEY_ID;
      const origPrivKey = process.env.MUX_SIGNING_PRIVATE_KEY;

      delete process.env.MUX_SIGNING_KEY_ID;
      delete process.env.MUX_SIGNING_PRIVATE_KEY;

      try {
        const config = await getMuxPlaybackConfig('unsigned_playback_123', false);
        assert.equal(config.playbackId, 'unsigned_playback_123');
        assert.equal(config.token, undefined);
        assert.equal(config.tokens, undefined);
        assert.equal(config.isPublicPreview, false);
      } finally {
        if (origKeyId) process.env.MUX_SIGNING_KEY_ID = origKeyId;
        if (origPrivKey) process.env.MUX_SIGNING_PRIVATE_KEY = origPrivKey;
      }
    });

    it('generates multi-tokens dictionary when signing keys are configured', async () => {
      process.env.MUX_SIGNING_KEY_ID = testKeyId;
      process.env.MUX_SIGNING_PRIVATE_KEY = Buffer.from(testPrivateKey).toString('base64');

      try {
        const config = await getMuxPlaybackConfig(testPlaybackId, false);
        assert.equal(config.playbackId, testPlaybackId);
        assert.ok(config.token, 'Should have root token for backward compatibility');
        assert.ok(config.tokens?.playback, 'Should have tokens.playback');
        assert.ok(config.tokens?.thumbnail, 'Should have tokens.thumbnail');
        assert.ok(config.tokens?.storyboard, 'Should have tokens.storyboard');

        // Verify all 3 tokens cryptographically
        const vVerify = verifyMuxToken(config.tokens.playback!, testPublicKey);
        const tVerify = verifyMuxToken(config.tokens.thumbnail!, testPublicKey);
        const sVerify = verifyMuxToken(config.tokens.storyboard!, testPublicKey);

        assert.equal(vVerify.valid, true);
        assert.equal(vVerify.payload?.aud, 'v');
        assert.equal(tVerify.valid, true);
        assert.equal(tVerify.payload?.aud, 't');
        assert.equal(sVerify.valid, true);
        assert.equal(sVerify.payload?.aud, 's');
      } finally {
        delete process.env.MUX_SIGNING_KEY_ID;
        delete process.env.MUX_SIGNING_PRIVATE_KEY;
      }
    });
  });

  describe('4. Lesson Playback Authorization Resolution', () => {
    it('allows public preview lessons without authentication', async () => {
      process.env.MUX_SIGNING_KEY_ID = testKeyId;
      process.env.MUX_SIGNING_PRIVATE_KEY = Buffer.from(testPrivateKey).toString('base64');

      try {
        // Ultimate Next.js Guide l1 is a preview lesson with muxPlaybackId
        const res = await resolveAuthorizedLessonPlayback('ultimate-nextjs-guide', 'l1');
        assert.ok(res.config, 'Should resolve preview lesson');
        assert.ok(res.config.playbackId);
        assert.equal(res.config.isPublicPreview, true);
        assert.ok(res.config.tokens?.playback, 'Should provide signed playback token for preview');
      } finally {
        delete process.env.MUX_SIGNING_KEY_ID;
        delete process.env.MUX_SIGNING_PRIVATE_KEY;
      }
    });

    it('rejects unauthorized requests for non-preview lessons without user auth', async () => {
      // l2 is locked / non-preview
      const res = await resolveAuthorizedLessonPlayback('ultimate-nextjs-guide', 'l2');
      assert.equal(res.config, null);
      assert.match(res.reason || '', /Authentication required/);
    });

    it('rejects non-existent lesson IDs', async () => {
      const res = await resolveAuthorizedLessonPlayback('ultimate-nextjs-guide', 'non-existent-lesson-id');
      assert.equal(res.config, null);
      assert.match(res.reason || '', /Lesson not found/);
    });
  });
});
