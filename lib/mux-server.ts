/**
 * lib/mux-server.ts
 * Server-only Mux utilities for playback configuration, RS256 token signing,
 * media availability validation, and telemetry.
 * Never import this file directly on the client.
 */
import { createSign, createVerify, createHmac, timingSafeEqual } from 'crypto';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireCourseAccess } from '@/lib/auth-policy';

export type MuxAudience = 'v' | 't' | 's' | 'd'; // v: video/playback, t: thumbnail, s: storyboard, d: drm

export interface MuxSignedTokens {
  playback?: string;
  thumbnail?: string;
  storyboard?: string;
  drm?: string;
}

export interface MuxPlaybackConfig {
  playbackId: string;
  token?: string; // Short-lived RS256 JWT when signing keys are set (backwards-compatible with single token)
  tokens?: MuxSignedTokens; // Multi-token dictionary compatible with MuxPlayer `tokens` prop
  isPublicPreview?: boolean;
}

function base64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Parses a private key from either:
 * 1. Base64-encoded PEM string
 * 2. Raw PEM string with \n or escaped \\n characters
 */
export function parsePrivateKey(rawKey: string): string {
  const trimmed = rawKey.trim();
  if (trimmed.includes('-----BEGIN')) {
    return trimmed.replace(/\\n/g, '\n');
  }

  try {
    const decoded = Buffer.from(trimmed, 'base64').toString('utf-8');
    if (decoded.includes('-----BEGIN')) {
      return decoded.replace(/\\n/g, '\n');
    }
  } catch {
    // fallback if not base64
  }

  return trimmed.replace(/\\n/g, '\n');
}

/**
 * Signs an RS256 JWT for Mux signed playback.
 * The private key stays strictly server-side.
 *
 * @param playbackId The Mux playback ID to sign for
 * @param keyId The Mux signing key ID (from Mux dashboard / API)
 * @param privateKeyPem RSA private key PEM (PKCS#1 or PKCS#8)
 * @param aud Audience: 'v' (video playback), 't' (thumbnail), 's' (storyboard), 'd' (DRM)
 * @param expirationSeconds Lifetime in seconds (defaults to 6 hours = 21600s)
 * @param customClaims Optional additional JWT claims
 */
export async function signMuxToken(
  playbackId: string,
  keyId: string,
  privateKeyPem: string,
  aud: MuxAudience = 'v',
  expirationSeconds = 21600,
  customClaims?: Record<string, any>
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', kid: keyId, typ: 'JWT' };
  const payload = {
    sub: playbackId,
    aud,
    exp: now + expirationSeconds,
    iat: now,
    ...customClaims,
  };

  const encodedHeader = base64url(Buffer.from(JSON.stringify(header)));
  const encodedPayload = base64url(Buffer.from(JSON.stringify(payload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const sign = createSign('RSA-SHA256');
  sign.update(signingInput);
  sign.end();
  const signature = sign.sign({ key: privateKeyPem, padding: undefined });

  return `${signingInput}.${base64url(signature)}`;
}

/**
 * Verifies an RS256 Mux token using a public key PEM.
 * Useful for automated tests and webhooks.
 */
export function verifyMuxToken(
  token: string,
  publicKeyPem: string
): { valid: boolean; payload?: Record<string, any>; error?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Malformed JWT structure' };
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const signingInput = `${headerB64}.${payloadB64}`;

    // Base64URL decode
    const sigBase64 = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    const signature = Buffer.from(sigBase64, 'base64');

    const verify = createVerify('RSA-SHA256');
    verify.update(signingInput);
    verify.end();

    const isValid = verify.verify(publicKeyPem, signature);
    if (!isValid) {
      return { valid: false, error: 'Signature verification failed' };
    }

    const payloadJson = Buffer.from(
      payloadB64.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    ).toString('utf-8');
    const payload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, payload, error: 'Token has expired' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Verification exception' };
  }
}

/**
 * Parses the Mux Webhook `mux-signature` header.
 * Header format: `t=1612543200,v1=6297d2644ff7fb64f7b24cfd80e1a8ef...`
 */
export function parseMuxSignatureHeader(header: string): { timestamp: number; signatures: string[] } {
  const parts = header.split(',');
  let timestamp = 0;
  const signatures: string[] = [];
  for (const part of parts) {
    const [key, val] = part.split('=').map((s) => s?.trim());
    if (key === 't') {
      timestamp = parseInt(val, 10);
    } else if (key === 'v1' && val) {
      signatures.push(val);
    }
  }
  return { timestamp, signatures };
}

/**
 * Generates a valid Mux webhook signature header for testing and mock webhooks.
 */
export function generateMuxWebhookSignature(
  rawBody: string,
  secret: string,
  timestamp: number = Math.floor(Date.now() / 1000)
): string {
  const payloadToSign = `${timestamp}.${rawBody}`;
  const sig = createHmac('sha256', secret).update(payloadToSign, 'utf8').digest('hex');
  return `t=${timestamp},v1=${sig}`;
}

/**
 * Cryptographically verifies a Mux webhook HMAC-SHA256 signature against replay attacks.
 *
 * @param rawBody The unparsed text body received in the HTTP request
 * @param header The raw `mux-signature` header string
 * @param secret The webhook signing secret configured in Mux dashboard
 * @param toleranceSeconds Max age in seconds before timestamp is rejected (default 300 = 5 min)
 */
export function verifyMuxWebhookSignature(
  rawBody: string,
  header: string,
  secret: string,
  toleranceSeconds = 300
): { valid: boolean; error?: string } {
  if (!header) {
    return { valid: false, error: 'Missing mux-signature header' };
  }
  if (!secret) {
    return { valid: false, error: 'MUX_WEBHOOK_SECRET is not configured' };
  }

  const { timestamp, signatures } = parseMuxSignatureHeader(header);
  if (!timestamp || signatures.length === 0) {
    return { valid: false, error: 'Malformed mux-signature header' };
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return { valid: false, error: 'Webhook timestamp outside allowed tolerance (replay attack check)' };
  }

  const payloadToSign = `${timestamp}.${rawBody}`;
  const expectedSig = createHmac('sha256', secret).update(payloadToSign, 'utf8').digest('hex');
  const expectedBuf = Buffer.from(expectedSig, 'hex');

  let match = false;
  for (const sig of signatures) {
    try {
      const sigBuf = Buffer.from(sig, 'hex');
      if (sigBuf.length === expectedBuf.length && timingSafeEqual(expectedBuf, sigBuf)) {
        match = true;
        break;
      }
    } catch {
      // ignore parsing failure for invalid hex
    }
  }

  if (!match) {
    return { valid: false, error: 'Invalid webhook signature' };
  }

  return { valid: true };
}

/**
 * Returns signed or unsigned playback configuration for a Mux asset.
 * Generates video, thumbnail, and storyboard tokens when signing keys are configured.
 */
export async function getMuxPlaybackConfig(playbackId: string, isPreview = false): Promise<MuxPlaybackConfig> {
  const signingKeyId = process.env.MUX_SIGNING_KEY_ID;
  const signingKeyPrivateRaw = process.env.MUX_SIGNING_PRIVATE_KEY;

  // No signing credentials configured — return standard unsigned playback ID
  if (!signingKeyId || !signingKeyPrivateRaw) {
    return { playbackId, isPublicPreview: isPreview };
  }

  try {
    const privateKeyPem = parsePrivateKey(signingKeyPrivateRaw);
    const expSeconds = parseInt(process.env.MUX_TOKEN_EXPIRATION_SECONDS || '21600', 10);

    const [playbackToken, thumbnailToken, storyboardToken] = await Promise.all([
      signMuxToken(playbackId, signingKeyId, privateKeyPem, 'v', expSeconds),
      signMuxToken(playbackId, signingKeyId, privateKeyPem, 't', expSeconds),
      signMuxToken(playbackId, signingKeyId, privateKeyPem, 's', expSeconds),
    ]);

    return {
      playbackId,
      token: playbackToken,
      tokens: {
        playback: playbackToken,
        thumbnail: thumbnailToken,
        storyboard: storyboardToken,
      },
      isPublicPreview: isPreview,
    };
  } catch (err) {
    logger.error('Failed to sign Mux playback token — using unsigned playback', err, { playbackId });
    return { playbackId, isPublicPreview: isPreview };
  }
}

/**
 * Resolves lesson playback configuration after validating course relationship,
 * public preview status, and enrollment permissions.
 */
export async function resolveAuthorizedLessonPlayback(
  courseSlug: string,
  lessonId: string,
  userId?: string,
  userRole?: string
): Promise<{ config: MuxPlaybackConfig | null; reason?: string }> {
  let lesson: { id: string; preview: boolean; muxPlaybackId: string | null } | null = null;

  if (process.env.DATABASE_URL) {
    try {
      const dbLesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          section: { select: { courseId: true } },
        },
      });

      if (dbLesson) {
        if (dbLesson.section.courseId !== courseSlug) {
          return { config: null, reason: 'Lesson does not belong to course' };
        }
        lesson = {
          id: dbLesson.id,
          preview: dbLesson.preview,
          muxPlaybackId: dbLesson.muxPlaybackId,
        };
      }
    } catch {
      // Database query failed, fallback to static curriculum check
    }
  }

  // Fallback to static catalog (for dev/preview/mock data)
  if (!lesson) {
    const { getCourse } = await import('@/lib/data');
    const staticCourse = getCourse(courseSlug);
    if (staticCourse) {
      const staticLesson = staticCourse.curriculum
        .flatMap((s) => s.lessons)
        .find((l) => l.id === lessonId);
      if (staticLesson) {
        lesson = {
          id: staticLesson.id,
          preview: !!staticLesson.preview,
          muxPlaybackId: staticLesson.muxPlaybackId || null,
        };
      }
    }
  }

  if (!lesson) {
    return { config: null, reason: 'Lesson not found' };
  }

  if (!lesson.muxPlaybackId || lesson.muxPlaybackId.trim() === '') {
    return { config: null, reason: 'Video unavailable — no media uploaded' };
  }

  // Public Preview Lesson access bypass (generates signed preview token if keys exist)
  if (lesson.preview) {
    const config = await getMuxPlaybackConfig(lesson.muxPlaybackId, true);
    return { config };
  }

  // Enrolled or Privileged user check for non-preview lessons
  if (!userId || !userRole) {
    return { config: null, reason: 'Authentication required for non-preview lessons' };
  }

  await requireCourseAccess(userId, userRole, courseSlug);

  const config = await getMuxPlaybackConfig(lesson.muxPlaybackId, false);
  return { config };
}

/**
 * Validates media availability prior to publishing/authoring.
 */
export function validateMuxMedia(muxPlaybackId?: string | null): { valid: boolean; reason?: string } {
  if (!muxPlaybackId || muxPlaybackId.trim() === '') {
    return { valid: false, reason: 'Video media missing. Please upload a video before publishing.' };
  }
  return { valid: true };
}

/**
 * Media error telemetry logger (sanitizes secrets, URLs, tokens).
 */
export function logMediaError(playbackId: string, error: any, context?: Record<string, any>) {
  logger.error('Mux media playback error encountered', error, {
    playbackId,
    ...(context ? { lessonId: context.lessonId, courseId: context.courseId } : {}),
  });
}
