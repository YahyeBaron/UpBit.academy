import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { captureException, captureAlert } from '@/lib/telemetry';
import { logger } from '@/lib/logger';

const PLACEHOLDER_SECRET = 'whsec_placeholder_clerk_webhook_secret';
const MAX_PAYLOAD_SIZE_BYTES = 65536; // 64 KB

/**
 * POST /api/webhooks/clerk
 *
 * Cryptographically verified Clerk user lifecycle webhook.
 * Events handled: user.created, user.updated, user.deleted
 *
 * Security:
 *  - Svix HMAC-SHA256 signature verification (via Clerk SDK)
 *  - WebhookEvent table deduplication by svix-id (idempotent)
 *  - Placeholder secret detection → 503 + Retry-After (never 500)
 *  - Soft-delete on user.deleted (preserves enrollment + certificate data)
 *  - No internal error details exposed in response body
 */
export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET;

  // ── Guard: placeholder or missing secret → 503 (retriable) ─────────────────
  const isPlaceholder = !WEBHOOK_SECRET || WEBHOOK_SECRET === PLACEHOLDER_SECRET;
  if (isPlaceholder) {
    captureAlert(
      'Clerk Webhook Secret Unconfigured',
      'CLERK_WEBHOOK_SECRET is missing or is a placeholder. User sync is disabled.',
    );
    return NextResponse.json(
      { error: 'Webhook processing temporarily unavailable.' },
      { status: 503, headers: { 'Retry-After': '60' } }
    );
  }

  // ── Payload size guard ──────────────────────────────────────────────────────
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  // ── Extract Svix signature headers ─────────────────────────────────────────
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing required Svix signature headers' },
      { status: 400 }
    );
  }

  // ── Read raw body ───────────────────────────────────────────────────────────
  const rawBody = await req.text();
  if (rawBody.length > MAX_PAYLOAD_SIZE_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  // ── Verify Svix HMAC signature ──────────────────────────────────────────────
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;
  try {
    evt = wh.verify(rawBody, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    captureAlert('Clerk Webhook Signature Invalid', 'Svix HMAC verification failed', { svix_id });
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  const eventType = evt.type;

  // ── Idempotency: skip already-processed events ──────────────────────────────
  try {
    const { prisma } = await import('@/lib/prisma');
    const existing = await prisma.webhookEvent.findUnique({
      where: { provider_eventId: { provider: 'CLERK', eventId: svix_id } },
    });
    if (existing) {
      return NextResponse.json({ received: true, idempotent: true });
    }

    // ── Route to event handlers ────────────────────────────────────────────────

    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name, username, image_url, created_at } = evt.data;

      const primaryEmail =
        email_addresses?.find((e) => e.id === evt.data.primary_email_address_id)?.email_address ||
        email_addresses?.[0]?.email_address;

      if (!primaryEmail) {
        logger.warn('Clerk webhook: user event has no primary email', { clerkId: id, eventType });
        return NextResponse.json({ message: 'Skipped: no primary email on user' }, { status: 200 });
      }

      const fullName = `${first_name || ''} ${last_name || ''}`.trim() || username || 'Student';
      const avatar = image_url || '/assets/w-rc.jpg';
      const joinedDate = created_at
        ? new Date(created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      await prisma.user.upsert({
        where: { email: primaryEmail },
        update: {
          clerkId: id,
          name: fullName,
          avatar,
        },
        create: {
          clerkId: id,
          email: primaryEmail,
          name: fullName,
          avatar,
          role: 'student',
          joinedDate,
        },
      });

      logger.info('Clerk user synced', { clerkId: id, eventType, email: primaryEmail });

    } else if (eventType === 'user.deleted') {
      const { id } = evt.data;

      if (id) {
        // Soft-delete: preserves enrollment history, certificates, and purchase records
        // for compliance and dispute resolution. Hard deletes would orphan critical data.
        await prisma.user.updateMany({
          where: { clerkId: id },
          data: {
            role: 'deleted',
            clerkId: null, // Release clerkId so the slot can be reused
          },
        });

        logger.info('Clerk user soft-deleted', { clerkId: id });
      }
    }

    // ── Record processed event for deduplication ───────────────────────────────
    await prisma.webhookEvent.upsert({
      where: { provider_eventId: { provider: 'CLERK', eventId: svix_id } },
      create: {
        provider: 'CLERK',
        eventId: svix_id,
        eventType,
        payload: evt.data as any,
      },
      update: { eventType },
    }).catch((dedupeErr) => {
      // Non-fatal: event was processed successfully, deduplication record failed
      logger.warn('Non-fatal: Failed to persist Clerk WebhookEvent', { svix_id, dedupeErr });
    });

    return NextResponse.json({
      received: true,
      eventType,
      processed: true,
    });

  } catch (err: unknown) {
    captureException(err, { endpoint: 'POST /api/webhooks/clerk', eventType });
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }
}
