import { captureException, captureAlert } from '@/lib/telemetry';
import {
  renderWelcomeEmail,
  renderEnrollmentReceiptEmail,
  renderCertificateIssuedEmail,
  renderOperationalAlertEmail,
} from '@/lib/email-templates';

export type EmailCategory = 'TRANSACTIONAL' | 'LIFECYCLE' | 'MARKETING';

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
  category: EmailCategory;
  idempotencyKey?: string;
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  category: EmailCategory;
  idempotencyKey?: string;
  replyTo?: string;
}

/**
 * Validates and retrieves the configured Resend API credentials from the environment.
 * Strict: Never falls back to hardcoded secrets.
 */
function getResendConfig(): { apiKey: string; fromEmail: string; replyToEmail: string } {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured in the environment.');
  }

  const fromEmail = (process.env.RESEND_FROM_EMAIL || 'UpBit Academy <onboarding@resend.dev>').trim();
  const replyToEmail = (process.env.SENDER_EMAIL || 'support@upbit.academy').trim();

  // Safety warning: If running in production with default Resend test onboarding domain
  if (process.env.NODE_ENV === 'production' && fromEmail.includes('onboarding@resend.dev')) {
    console.warn(
      '[Email Security Warning] Using default Resend sandbox sender (onboarding@resend.dev) in production. Configure RESEND_FROM_EMAIL with a verified domain.'
    );
  }

  return { apiKey, fromEmail, replyToEmail };
}

/**
 * Core server-side dispatch function via Resend REST API.
 * Supports idempotency headers and dual HTML + plain text bodies.
 */
export async function dispatchResendEmail(payload: SendEmailPayload): Promise<EmailDispatchResult> {
  const { to, subject, html, text, category, idempotencyKey, replyTo } = payload;

  let config: { apiKey: string; fromEmail: string; replyToEmail: string };
  try {
    config = getResendConfig();
  } catch (configErr) {
    const errorMsg = configErr instanceof Error ? configErr.message : String(configErr);
    captureAlert('Email Gateway Misconfigured', errorMsg, {
      recipient: to,
      subject,
      category,
      idempotencyKey,
    });
    return {
      success: false,
      error: errorMsg,
      category,
      idempotencyKey,
    };
  }

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    };

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const requestBody: Record<string, unknown> = {
      from: config.fromEmail,
      reply_to: replyTo || config.replyToEmail,
      to: [to],
      subject,
      html,
    };

    if (text) {
      requestBody.text = text;
    }

    if (idempotencyKey) {
      requestBody.headers = {
        'X-Entity-Ref-ID': idempotencyKey,
      };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const detail = data?.message || data?.error || (data ? JSON.stringify(data) : `HTTP ${response.status}`);
      captureAlert('Resend API Dispatch Error', detail, {
        recipient: to,
        subject,
        status: response.status,
        category,
        idempotencyKey,
      });
      return {
        success: false,
        error: detail,
        category,
        idempotencyKey,
      };
    }

    const messageId = data?.id;
    console.log(`[Resend Email Dispatched] ID: ${messageId} -> ${to} [Category: ${category}]`);

    return {
      success: true,
      messageId,
      category,
      idempotencyKey,
    };
  } catch (err: unknown) {
    captureException(err, {
      endpoint: 'dispatchResendEmail',
      recipient: to,
      subject,
      category,
      idempotencyKey,
    });
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      category,
      idempotencyKey,
    };
  }
}

/**
 * Dispatch Welcome & Starter Kit email to new subscriber (Marketing / Lifecycle).
 */
export async function sendWelcomeEmail(
  recipientEmail: string,
  options?: { idempotencyKey?: string; unsubscribeUrl?: string }
): Promise<EmailDispatchResult> {
  const rendered = renderWelcomeEmail({
    recipientEmail,
    unsubscribeUrl: options?.unsubscribeUrl,
  });

  return dispatchResendEmail({
    to: recipientEmail,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    category: 'MARKETING',
    idempotencyKey: options?.idempotencyKey || `welcome/${recipientEmail.toLowerCase()}`,
  });
}

/**
 * Dispatch Official Payment Receipt & Course Access Email (Transactional).
 */
export async function sendEnrollmentReceiptEmail(
  data: {
    recipientEmail: string;
    courseTitle: string;
    amountPaid: number;
    transactionRef: string;
    provider: string;
    courseUrl?: string;
  },
  options?: { idempotencyKey?: string }
): Promise<EmailDispatchResult> {
  const rendered = renderEnrollmentReceiptEmail({
    recipientEmail: data.recipientEmail,
    courseTitle: data.courseTitle,
    amountPaid: data.amountPaid,
    transactionRef: data.transactionRef,
    provider: data.provider,
    courseUrl: data.courseUrl,
  });

  return dispatchResendEmail({
    to: data.recipientEmail,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    category: 'TRANSACTIONAL',
    idempotencyKey: options?.idempotencyKey || `receipt/${data.transactionRef}`,
  });
}

/**
 * Dispatch Official Certificate of Completion Email to Learner (Transactional).
 */
export async function sendCertificateIssuedEmail(
  data: {
    recipientEmail: string;
    courseTitle: string;
    studentName?: string;
    verificationCode: string;
    certificateId: string;
  },
  options?: { idempotencyKey?: string }
): Promise<EmailDispatchResult> {
  const rendered = renderCertificateIssuedEmail({
    recipientEmail: data.recipientEmail,
    courseTitle: data.courseTitle,
    studentName: data.studentName,
    verificationCode: data.verificationCode,
    certificateId: data.certificateId,
  });

  return dispatchResendEmail({
    to: data.recipientEmail,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    category: 'TRANSACTIONAL',
    idempotencyKey: options?.idempotencyKey || `certificate/${data.certificateId}`,
  });
}

/**
 * Dispatch System Operational Alert to Admin (Transactional).
 */
export async function sendOperationalAlertEmail(
  data: {
    subject: string;
    message: string;
    details?: string;
  },
  options?: { idempotencyKey?: string }
): Promise<EmailDispatchResult> {
  const rendered = renderOperationalAlertEmail({
    subject: data.subject,
    message: data.message,
    details: data.details,
  });

  const adminRecipient = process.env.SENDER_EMAIL || 'support@upbit.academy';

  return dispatchResendEmail({
    to: adminRecipient,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    category: 'TRANSACTIONAL',
    idempotencyKey: options?.idempotencyKey,
  });
}
