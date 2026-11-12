import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { inngest } from '@/lib/inngest/client';
import { logger } from '@/lib/logger';
import { captureAlert, captureException } from '@/lib/telemetry';
import { verifyMuxWebhookSignature } from '@/lib/mux-server';
import { checkRateLimitAsync } from '@/lib/rate-limit';

const MAX_PAYLOAD_SIZE_BYTES = 131072; // 128 KB

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
    const rateLimit = await checkRateLimitAsync(`mux_webhook:${ip}`, { limit: 120, windowMs: 60 * 1000 });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const rawBody = await req.text();
    if (rawBody.length > MAX_PAYLOAD_SIZE_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const signatureHeader = req.headers.get('mux-signature');
    let webhookSecret = process.env.MUX_WEBHOOK_SECRET?.trim();

    if (!webhookSecret) {
      if (process.env.NODE_ENV !== 'production') {
        webhookSecret = 'whsec_mux_dev_test_secret_2026';
      } else {
        captureAlert('Mux Webhook Configuration Missing', 'MUX_WEBHOOK_SECRET is not configured in environment.');
        return NextResponse.json(
          { error: 'Webhook processing temporarily unavailable.' },
          { status: 503, headers: { 'Retry-After': '60' } }
        );
      }
    }

    if (!signatureHeader) {
      captureAlert('Missing Mux Signature Header', 'Incoming Mux webhook missing mux-signature', { ip });
      return NextResponse.json({ error: 'Missing mux-signature header' }, { status: 400 });
    }

    const verification = verifyMuxWebhookSignature(rawBody, signatureHeader, webhookSecret);
    if (!verification.valid) {
      captureAlert('Invalid Mux Webhook Signature', verification.error || 'HMAC verification failed', {
        ip,
        error: verification.error,
      });
      return NextResponse.json({ error: verification.error || 'Unauthorized' }, { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const eventId = payload.id;
    const eventType = payload.type as string;
    const data = payload.data || {};
    const assetId = data.id as string | undefined;

    if (!eventId || !eventType) {
      return NextResponse.json({ error: 'Missing required event fields (id, type)' }, { status: 400 });
    }

    // ── Idempotency Check via WebhookEvent Table ─────────────────────────────
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { provider_eventId: { provider: 'MUX', eventId } },
    });

    if (existingEvent) {
      return NextResponse.json({ received: true, idempotent: true });
    }

    // ── Resolve Lesson ID from metadata or passthrough ───────────────────────
    let lessonId: string | null = null;
    const passthrough = data.passthrough;

    if (typeof passthrough === 'string') {
      try {
        const parsed = JSON.parse(passthrough);
        if (parsed && typeof parsed.lessonId === 'string') {
          lessonId = parsed.lessonId;
        }
      } catch {
        lessonId = passthrough.trim();
      }
    }

    // If not in passthrough, check if data has metadata or direct lessonId
    if (!lessonId && typeof data.metadata?.lessonId === 'string') {
      lessonId = data.metadata.lessonId;
    }

    // ── Event Handlers ───────────────────────────────────────────────────────
    if (eventType === 'video.asset.ready') {
      const playbackIds: Array<{ id: string; policy: string }> = data.playback_ids || [];
      const signedPlayback =
        playbackIds.find((p) => p.policy === 'signed')?.id ||
        playbackIds.find((p) => p.policy === 'public')?.id ||
        playbackIds[0]?.id;

      const durationSec = typeof data.duration === 'number' ? Math.round(data.duration) : null;
      const formattedDuration = durationSec
        ? `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, '0')}`
        : undefined;

      // Update Database Lesson Record if lessonId matches
      if (lessonId && signedPlayback) {
        await prisma.lesson.update({
          where: { id: lessonId },
          data: {
            muxPlaybackId: signedPlayback,
            ...(formattedDuration ? { duration: formattedDuration } : {}),
          },
        }).catch((dbErr) => {
          logger.warn('Non-fatal: Unable to link muxPlaybackId to lesson in DB', { lessonId, dbErr });
        });
      }

      // Dispatch to Inngest Reconciliation Pipeline
      if (lessonId && assetId) {
        await inngest.send({
          name: 'mux/video.state',
          data: {
            lessonId,
            muxAssetId: assetId,
            muxPlaybackId: signedPlayback,
            status: 'ready',
          },
        }).catch((err) => {
          logger.warn('Non-fatal: Inngest mux/video.state dispatch failed', err);
        });
      }

      logger.info('Mux video asset ready', { assetId, lessonId, playbackId: signedPlayback });
    } else if (eventType === 'video.asset.errored') {
      captureAlert('Mux Video Transcoding Errored', `Asset ${assetId} failed processing`, {
        assetId,
        lessonId,
        errors: data.errors,
      });

      if (lessonId && assetId) {
        await inngest.send({
          name: 'mux/video.state',
          data: {
            lessonId,
            muxAssetId: assetId,
            status: 'errored',
          },
        }).catch(() => {});
      }
    }

    // ── Record processed webhook event for idempotency ───────────────────────
    await prisma.webhookEvent.upsert({
      where: { provider_eventId: { provider: 'MUX', eventId } },
      create: {
        provider: 'MUX',
        eventId,
        eventType,
        payload: payload as any,
      },
      update: {
        eventType,
        payload: payload as any,
      },
    }).catch((err) => {
      logger.warn('Non-fatal: Failed to persist Mux WebhookEvent', { eventId, err });
    });

    return NextResponse.json({
      received: true,
      id: eventId,
      type: eventType,
      status: 'processed',
    });

  } catch (err: unknown) {
    captureException(err, { endpoint: 'POST /api/webhooks/mux' });
    logger.error('Mux webhook unhandled error', { error: String(err) });
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }
}
