/**
 * ════════════════════════════════════════════════════════════════
 * Email Delivery Persistence & Unsubscribe Security Layer
 * ════════════════════════════════════════════════════════════════
 * Provides durable delivery tracking, defensive table handling
 * (safely degrading if migrations are deferred), and signed tokens.
 */
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { captureAlert, captureException } from '@/lib/telemetry';
import { getAppUrl } from '@/lib/email-templates';

const TOKEN_SECRET =
  process.env.RESEND_API_KEY ||
  process.env.CLERK_SECRET_KEY ||
  process.env.SIFALO_WEBHOOK_SECRET ||
  'bit-academy-default-secure-email-salt-2026';

/**
 * Generates an opaque, cryptographic HMAC token for one-click unsubscribe links.
 */
export function generateUnsubscribeToken(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  return crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`unsubscribe:${normalizedEmail}`)
    .digest('hex');
}

/**
 * Cryptographically verifies an unsubscribe token using timing-safe comparison.
 */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  try {
    const expected = generateUnsubscribeToken(email);
    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(token, 'hex');

    if (expectedBuf.length !== receivedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

/**
 * Generates the full canonical unsubscribe URL for an email recipient.
 */
export function buildUnsubscribeUrl(email: string): string {
  const appUrl = getAppUrl();
  const token = generateUnsubscribeToken(email);
  return `${appUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

export interface EmailDeliveryRecord {
  eventKey: string;
  recipient: string;
  category: 'TRANSACTIONAL' | 'LIFECYCLE' | 'MARKETING';
  template: string;
  entityType?: string;
  entityId?: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'BOUNCED' | 'COMPLAINED' | 'FAILED';
  providerMessageId?: string;
  lastError?: string;
}

/**
 * Defensively records email delivery status.
 * If the EmailDelivery table is not yet migrated in PostgreSQL, it gracefully
 * records to WebhookEvent or logs telemetry without failing the main transaction.
 */
export async function recordEmailDelivery(record: EmailDeliveryRecord): Promise<void> {
  const client = prisma as any;

  // Try writing to the official EmailDelivery model if available
  if (typeof client?.emailDelivery?.upsert === 'function') {
    try {
      await client.emailDelivery.upsert({
        where: { eventKey: record.eventKey },
        create: {
          eventKey: record.eventKey,
          recipient: record.recipient.toLowerCase(),
          category: record.category,
          template: record.template,
          entityType: record.entityType || null,
          entityId: record.entityId || null,
          status: record.status,
          provider: 'RESEND',
          providerMessageId: record.providerMessageId || null,
          lastError: record.lastError || null,
          sentAt: new Date(),
        },
        update: {
          status: record.status,
          providerMessageId: record.providerMessageId || null,
          lastError: record.lastError || null,
          attempts: { increment: 1 },
        },
      });
      return;
    } catch (dbErr: any) {
      // P2021: Table does not exist yet (migration deferred)
      const isMissingTable =
        dbErr?.code === 'P2021' ||
        String(dbErr?.message || '').includes('does not exist') ||
        String(dbErr?.message || '').includes('EmailDelivery');

      if (!isMissingTable) {
        captureException(dbErr, { context: 'recordEmailDelivery.upsert' });
      }
    }
  }

  // Fallback to WebhookEvent (which already exists in the live PostgreSQL schema)
  try {
    await prisma.webhookEvent.upsert({
      where: {
        provider_eventId: {
          provider: 'EMAIL_DELIVERY',
          eventId: record.eventKey,
        },
      },
      create: {
        provider: 'EMAIL_DELIVERY',
        eventId: record.eventKey,
        eventType: `${record.template}.${record.status.toLowerCase()}`,
        payload: {
          recipient: record.recipient.toLowerCase(),
          category: record.category,
          template: record.template,
          providerMessageId: record.providerMessageId,
          lastError: record.lastError,
          recordedAt: new Date().toISOString(),
        },
      },
      update: {
        eventType: `${record.template}.${record.status.toLowerCase()}`,
        payload: {
          recipient: record.recipient.toLowerCase(),
          category: record.category,
          template: record.template,
          providerMessageId: record.providerMessageId,
          lastError: record.lastError,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  } catch (fallbackErr) {
    console.warn('[Email Delivery Fallback Warn]', fallbackErr);
  }
}

/**
 * Reconciles provider delivery webhooks with existing delivery records.
 */
export async function updateDeliveryStatusFromWebhook(params: {
  providerMessageId: string;
  status: 'DELIVERED' | 'BOUNCED' | 'COMPLAINED';
  recipient?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const { providerMessageId, status, recipient, details } = params;
  const client = prisma as any;

  if (typeof client?.emailDelivery?.updateMany === 'function') {
    try {
      await client.emailDelivery.updateMany({
        where: { providerMessageId },
        data: {
          status,
          deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
          lastError: status === 'BOUNCED' || status === 'COMPLAINED' ? JSON.stringify(details) : undefined,
        },
      });
    } catch {
      // Gracefully ignore missing table
    }
  }

  // Deactivate marketing subscriber on hard bounce or complaint
  if ((status === 'BOUNCED' || status === 'COMPLAINED') && recipient) {
    try {
      await prisma.newsletterSubscriber.updateMany({
        where: { email: recipient.toLowerCase() },
        data: { active: false },
      });
      captureAlert(
        `Email Suppression Triggered: ${status}`,
        `Subscriber ${recipient} marked inactive due to Resend ${status}.`,
        { recipient, providerMessageId }
      );
    } catch (err) {
      console.warn('[Subscriber Suppression Warn]', err);
    }
  }
}
