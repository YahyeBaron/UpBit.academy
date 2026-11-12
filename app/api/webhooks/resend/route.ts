import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { prisma } from '@/lib/prisma';
import { updateDeliveryStatusFromWebhook } from '@/lib/email-delivery';
import { captureAlert, captureException } from '@/lib/telemetry';

/**
 * Verified Resend Delivery Feedback Webhook.
 * Uses Svix to cryptographically verify signatures, deduplicates via WebhookEvent,
 * and tracks sent, delivered, bounced, and complained states.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!webhookSecret) {
    captureAlert('Resend Webhook Configuration Missing', 'RESEND_WEBHOOK_SECRET is not configured in environment.');
    return NextResponse.json(
      { error: 'Webhook processing unavailable' },
      { status: 500 }
    );
  }

  // Extract Svix headers
  const svix_id = req.headers.get('svix-id');
  const svix_timestamp = req.headers.get('svix-timestamp');
  const svix_signature = req.headers.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing required Svix signature headers' },
      { status: 400 }
    );
  }

  const rawBody = await req.text();

  let payload: any;
  try {
    const wh = new Webhook(webhookSecret);
    payload = wh.verify(rawBody, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    captureAlert('Resend Webhook Verification Failed', 'Invalid Svix signature on incoming webhook', {
      svix_id,
    });
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 401 }
    );
  }

  const eventType = payload?.type; // e.g. "email.sent", "email.delivered", "email.bounced", "email.complained"
  const eventData = payload?.data;
  const emailId = eventData?.email_id || eventData?.id;
  const recipient = Array.isArray(eventData?.to) ? eventData.to[0] : eventData?.to;

  if (!emailId || !eventType) {
    return NextResponse.json({ error: 'Incomplete webhook payload' }, { status: 400 });
  }

  // Idempotency: Deduplicate webhook events in WebhookEvent
  const eventRef = `${svix_id}_${eventType}`;
  try {
    const existing = await prisma.webhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider: 'RESEND',
          eventId: eventRef,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ received: true, action: 'already_processed' });
    }

    await prisma.webhookEvent.create({
      data: {
        provider: 'RESEND',
        eventId: eventRef,
        eventType,
        payload: {
          emailId,
          recipient,
          type: eventType,
          createdAt: eventData?.created_at,
        },
      },
    });
  } catch (dbErr) {
    console.warn('[Resend Webhook Event Duplicate/Warn]', dbErr);
  }

  // Process delivery status reconciliation
  try {
    if (eventType === 'email.delivered') {
      await updateDeliveryStatusFromWebhook({
        providerMessageId: emailId,
        status: 'DELIVERED',
        recipient,
        details: eventData,
      });
    } else if (eventType === 'email.bounced') {
      await updateDeliveryStatusFromWebhook({
        providerMessageId: emailId,
        status: 'BOUNCED',
        recipient,
        details: eventData,
      });
    } else if (eventType === 'email.complained') {
      await updateDeliveryStatusFromWebhook({
        providerMessageId: emailId,
        status: 'COMPLAINED',
        recipient,
        details: eventData,
      });
    }

    return NextResponse.json({
      received: true,
      emailId,
      eventType,
    });
  } catch (err) {
    captureException(err, { endpoint: 'POST /api/webhooks/resend', emailId, eventType });
    return NextResponse.json({ received: true, error: 'Internal processing error' }, { status: 500 });
  }
}
