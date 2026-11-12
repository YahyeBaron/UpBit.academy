/**
 * ════════════════════════════════════════════════════════════════
 * Email Template Engine & Security Utilities
 * ════════════════════════════════════════════════════════════════
 * Provides HTML escaping against injection vulnerabilities,
 * accessible and dark-themed branded layouts, and plain-text alternatives.
 */

/**
 * Escapes HTML characters to prevent XSS and HTML injection in emails.
 */
export function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  const matchHtmlRegExp = /["'&<>]/;
  const match = matchHtmlRegExp.exec(str);
  if (!match) return str;

  let escape: string;
  let html = '';
  let index: number;
  let lastIndex = 0;

  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34: // "
        escape = '&quot;';
        break;
      case 38: // &
        escape = '&amp;';
        break;
      case 39: // '
        escape = '&#39;';
        break;
      case 60: // <
        escape = '&lt;';
        break;
      case 62: // >
        escape = '&gt;';
        break;
      default:
        continue;
    }

    if (lastIndex !== index) {
      html += str.substring(lastIndex, index);
    }

    lastIndex = index + 1;
    html += escape;
  }

  return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
}

/**
 * Derives the canonical base URL from runtime environment without hardcoded hosts.
 */
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }
  return 'http://localhost:3000';
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Base email layout wrapper with modern dark-mode aesthetics
 */
function wrapEmailLayout({
  preheader,
  badgeText,
  badgeColor = '#60a5fa',
  badgeBg = 'rgba(37, 99, 235, 0.15)',
  badgeBorder = 'rgba(59, 130, 246, 0.3)',
  title,
  contentHtml,
  footerUnsubscribeUrl,
}: {
  preheader: string;
  badgeText?: string;
  badgeColor?: string;
  badgeBg?: string;
  badgeBorder?: string;
  title: string;
  contentHtml: string;
  footerUnsubscribeUrl?: string;
}): string {
  const appUrl = getAppUrl();
  const escapedPreheader = escapeHtml(preheader);
  const escapedTitle = escapeHtml(title);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapedTitle}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #040711; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #ffffff;">
  <!-- Preheader text for inbox preview -->
  <div style="display: none; font-size: 1px; color: #040711; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${escapedPreheader}
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #040711; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #070B16; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; overflow: hidden;">
          <!-- Header Branding -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <a href="${appUrl}" style="text-decoration: none; display: inline-block;">
                <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff;">
                  <span style="color: #3b82f6;">ERAYSAME</span> TECH ACADEMY
                </span>
              </a>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 32px; font-size: 15px; line-height: 1.6; color: #d1d5db;">
              ${badgeText ? `
              <div style="margin-bottom: 20px; text-align: center;">
                <span style="display: inline-block; padding: 4px 14px; background-color: ${badgeBg}; border: 1px solid ${badgeBorder}; border-radius: 9999px; color: ${badgeColor}; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">
                  ${escapeHtml(badgeText)}
                </span>
              </div>
              ` : ''}

              <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 20px 0; text-align: center; line-height: 1.3;">
                ${escapedTitle}
              </h1>

              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #050813; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center; font-size: 12px; color: #6b7280; line-height: 1.5;">
              <p style="margin: 0 0 8px 0;">
                Eraysame Tech Academy &bull; Building Next-Gen Full-Stack & Systems Engineers
              </p>
              <p style="margin: 0 0 8px 0;">
                <a href="${appUrl}/dashboard" style="color: #9ca3af; text-decoration: underline; margin: 0 8px;">Dashboard</a>
                <a href="${appUrl}/courses" style="color: #9ca3af; text-decoration: underline; margin: 0 8px;">Courses</a>
                <a href="${appUrl}/roadmap" style="color: #9ca3af; text-decoration: underline; margin: 0 8px;">Roadmap</a>
              </p>
              ${footerUnsubscribeUrl ? `
              <p style="margin: 12px 0 0 0; font-size: 11px;">
                You received this email because you subscribed to updates. 
                <a href="${escapeHtml(footerUnsubscribeUrl)}" style="color: #60a5fa; text-decoration: underline;">Unsubscribe or manage preferences</a>
              </p>
              ` : `
              <p style="margin: 12px 0 0 0; font-size: 11px; color: #4b5563;">
                This is an official transactional notification regarding your account or course access.
              </p>
              `}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Welcome & Starter Kit Template
 */
export function renderWelcomeEmail(params: {
  recipientEmail: string;
  unsubscribeUrl?: string;
}): RenderedEmail {
  const appUrl = getAppUrl();
  const subject = 'Welcome to Eraysame Tech Academy — Your Starter Kit & Developer Dispatch';
  const preheader = 'Your starter kit is ready. Explore Next.js 15, Three.js shaders, and SaaS architecture.';

  const contentHtml = `
    <p style="color: #9ca3af; margin-bottom: 20px;">
      Thank you for subscribing! You are now subscribed to our developer dispatch with technical deep-dives into modern full-stack architectures, interactive 3D computing, and cloud systems.
    </p>

    <div style="background-color: rgba(255, 255, 255, 0.03); border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #3b82f6; margin: 0 0 10px 0; font-size: 16px; font-weight: 700;">
        Included in Your Academy Access:
      </h3>
      <ul style="color: #d1d5db; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li>Interactive Learning Roadmaps & Progress Tracking</li>
        <li>Real-World Architectural Codebases & Capstone Projects</li>
        <li>Direct Mentorship & Verified Certificates of Completion</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="${appUrl}/courses" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 700; text-decoration: none; padding: 12px 32px; border-radius: 9999px; font-size: 14px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);">
        Explore Learning Tracks &rarr;
      </a>
    </div>
  `;

  const text = `Welcome to Eraysame Tech Academy!

Your starter kit is ready. You are now subscribed to our developer dispatch with technical deep-dives into modern full-stack architectures, interactive 3D computing, and cloud systems.

Included in your academy access:
- Interactive Learning Roadmaps & Progress Tracking
- Real-World Architectural Codebases & Capstone Projects
- Direct Mentorship & Verified Certificates of Completion

Explore courses: ${appUrl}/courses
Dashboard: ${appUrl}/dashboard

${params.unsubscribeUrl ? `Unsubscribe: ${params.unsubscribeUrl}` : ''}
`;

  const html = wrapEmailLayout({
    preheader,
    badgeText: 'Developer Dispatch',
    badgeColor: '#60a5fa',
    badgeBg: 'rgba(37, 99, 235, 0.15)',
    badgeBorder: 'rgba(59, 130, 246, 0.3)',
    title: 'Welcome to the Academy',
    contentHtml,
    footerUnsubscribeUrl: params.unsubscribeUrl,
  });

  return { subject, html, text };
}

/**
 * 2. Payment Receipt & Enrollment Confirmation Template
 */
export function renderEnrollmentReceiptEmail(params: {
  recipientEmail: string;
  courseTitle: string;
  amountPaid: number;
  transactionRef: string;
  provider: string;
  courseUrl?: string;
}): RenderedEmail {
  const appUrl = getAppUrl();
  const safeTitle = escapeHtml(params.courseTitle);
  const safeRef = escapeHtml(params.transactionRef);
  const safeProvider = escapeHtml(params.provider);
  const safeAmount = Number(params.amountPaid).toFixed(2);
  const courseTargetUrl = params.courseUrl || `${appUrl}/dashboard`;

  const subject = `Payment Confirmed: Access Unlocked for ${params.courseTitle}`;
  const preheader = `Your payment of $${safeAmount} via ${params.provider} is confirmed. You now have full course access.`;

  const contentHtml = `
    <p style="color: #9ca3af; margin-bottom: 20px;">
      Your payment has been successfully confirmed. You have unlocked full lifetime access to <strong>${safeTitle}</strong>.
    </p>

    <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; margin: 24px 0;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="6" style="color: #d1d5db; font-size: 14px;">
        <tr>
          <td style="color: #9ca3af;">Course</td>
          <td style="text-align: right; font-weight: 600; color: #ffffff;">${safeTitle}</td>
        </tr>
        <tr>
          <td style="color: #9ca3af;">Transaction Reference</td>
          <td style="text-align: right; font-family: monospace; font-size: 13px; color: #93c5fd;">${safeRef}</td>
        </tr>
        <tr>
          <td style="color: #9ca3af;">Payment Method</td>
          <td style="text-align: right; color: #ffffff;">${safeProvider}</td>
        </tr>
        <tr style="border-top: 1px solid rgba(255, 255, 255, 0.1);">
          <td style="color: #ffffff; font-weight: 700; padding-top: 12px;">Total Paid</td>
          <td style="text-align: right; color: #34d399; font-weight: 800; font-size: 16px; padding-top: 12px;">$${safeAmount} USD</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="${courseTargetUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; font-weight: 700; text-decoration: none; padding: 12px 32px; border-radius: 9999px; font-size: 14px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);">
        Start Learning Now &rarr;
      </a>
    </div>
  `;

  const text = `Payment Confirmed: Access Unlocked for ${params.courseTitle}

Your payment has been successfully confirmed. You have unlocked full lifetime access to ${params.courseTitle}.

Transaction Details:
- Course: ${params.courseTitle}
- Transaction Reference: ${params.transactionRef}
- Payment Method: ${params.provider}
- Total Paid: $${safeAmount} USD

Access your course: ${courseTargetUrl}
Dashboard: ${appUrl}/dashboard
`;

  const html = wrapEmailLayout({
    preheader,
    badgeText: 'Payment Successful',
    badgeColor: '#34d399',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeBorder: 'rgba(16, 185, 129, 0.3)',
    title: 'Your Enrollment is Confirmed',
    contentHtml,
  });

  return { subject, html, text };
}

/**
 * 3. Learner Certificate Issued Template
 */
export function renderCertificateIssuedEmail(params: {
  recipientEmail: string;
  courseTitle: string;
  studentName?: string;
  verificationCode: string;
  certificateId: string;
}): RenderedEmail {
  const appUrl = getAppUrl();
  const safeTitle = escapeHtml(params.courseTitle);
  const safeName = escapeHtml(params.studentName || 'Student');
  const safeCode = escapeHtml(params.verificationCode);
  const certificateUrl = `${appUrl}/certificates/${params.certificateId}`;

  const subject = `Congratulations! Certificate Issued for ${params.courseTitle}`;
  const preheader = `Great achievement, ${safeName}! Your verified certificate for ${params.courseTitle} is now available.`;

  const contentHtml = `
    <p style="color: #9ca3af; margin-bottom: 20px;">
      Congratulations <strong>${safeName}</strong>! You have successfully fulfilled all coursework, exercises, and milestones for <strong>${safeTitle}</strong>.
    </p>

    <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="color: #fbbf24; font-weight: 700; font-size: 14px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.05em;">
        Official Verification Code
      </p>
      <div style="font-family: monospace; font-size: 16px; color: #ffffff; background-color: rgba(0, 0, 0, 0.3); padding: 8px 16px; border-radius: 6px; display: inline-block; margin-bottom: 12px;">
        ${safeCode}
      </div>
      <p style="color: #9ca3af; font-size: 13px; margin: 0;">
        This cryptographic verification code is permanently verifiable by employers and peers on our public registry.
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="${certificateUrl}" style="display: inline-block; background-color: #f59e0b; color: #000000; font-weight: 700; text-decoration: none; padding: 12px 32px; border-radius: 9999px; font-size: 14px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);">
        View & Share Certificate &rarr;
      </a>
    </div>
  `;

  const text = `Congratulations! Certificate Issued for ${params.courseTitle}

Congratulations ${safeName}! You have successfully completed all coursework, exercises, and milestones for ${params.courseTitle}.

Official Verification Code: ${params.verificationCode}
Public Verification URL: ${certificateUrl}

View your certificate: ${certificateUrl}
`;

  const html = wrapEmailLayout({
    preheader,
    badgeText: 'Certificate of Completion',
    badgeColor: '#fbbf24',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeBorder: 'rgba(245, 158, 11, 0.3)',
    title: 'Course Completed',
    contentHtml,
  });

  return { subject, html, text };
}

/**
 * 4. System Operational Alert Template (internal admin notifications)
 */
export function renderOperationalAlertEmail(params: {
  subject: string;
  message: string;
  details?: string;
}): RenderedEmail {
  const safeSubject = escapeHtml(params.subject);
  const safeMessage = escapeHtml(params.message);
  const safeDetails = params.details ? escapeHtml(params.details) : '';

  const subject = `[System Alert] ${params.subject}`;
  const preheader = `Operational Alert: ${safeSubject}`;

  const contentHtml = `
    <div style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <p style="color: #fca5a5; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">
        System Operational Notification
      </p>
      <p style="color: #f3f4f6; margin: 0; font-size: 14px;">
        ${safeMessage}
      </p>
    </div>

    ${safeDetails ? `
    <div style="margin-top: 16px;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0 0 6px 0; font-weight: 600; text-transform: uppercase;">Details / Payload</p>
      <pre style="background-color: #09090b; border: 1px solid rgba(255, 255, 255, 0.1); padding: 12px; border-radius: 6px; color: #a1a1aa; font-size: 12px; overflow-x: auto; font-family: monospace;">${safeDetails}</pre>
    </div>
    ` : ''}
  `;

  const text = `[System Alert] ${params.subject}

${params.message}

${params.details ? `Details:\n${params.details}` : ''}
`;

  const html = wrapEmailLayout({
    preheader,
    badgeText: 'Operational Alert',
    badgeColor: '#ef4444',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    badgeBorder: 'rgba(239, 68, 68, 0.3)',
    title: safeSubject,
    contentHtml,
  });

  return { subject, html, text };
}
