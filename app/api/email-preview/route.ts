import { NextRequest, NextResponse } from 'next/server';
import {
  renderWelcomeEmail,
  renderEnrollmentReceiptEmail,
  renderCertificateIssuedEmail,
  renderOperationalAlertEmail,
} from '@/lib/email-templates';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const template = searchParams.get('template') || 'welcome';
  const format = searchParams.get('format') || 'html';

  let rendered: { subject: string; html: string; text: string };

  switch (template) {
    case 'receipt':
      rendered = renderEnrollmentReceiptEmail({
        recipientEmail: 'yahyebaron@gmail.com',
        courseTitle: 'Full-Stack Next.js 15, Three.js Shaders & Cloud Architecture',
        amountPaid: 49.0,
        transactionRef: 'EST-884920',
        provider: 'ZAAD Pay',
        courseUrl: '/courses/full-stack-nextjs',
      });
      break;

    case 'certificate':
      rendered = renderCertificateIssuedEmail({
        recipientEmail: 'yahyebaron@gmail.com',
        courseTitle: 'Full-Stack Next.js 15, Three.js Shaders & Cloud Architecture',
        studentName: 'Yahye Baron',
        verificationCode: 'ETA-CERT-2026-YB99',
        certificateId: 'cert_sample_yahye',
      });
      break;

    case 'alert':
      rendered = renderOperationalAlertEmail({
        subject: 'Real-Time Telemetry: Pipeline Verified',
        message: 'Resend email automation gateway has passed all transactional and idempotency verification checks.',
        details: JSON.stringify(
          {
            gateway: 'Resend REST v1',
            status: 'HEALTHY',
            recipient: 'yahyebaron@gmail.com',
            timestamp: new Date().toISOString(),
          },
          null,
          2
        ),
      });
      break;

    case 'welcome':
    default:
      rendered = renderWelcomeEmail({
        recipientEmail: 'yahyebaron@gmail.com',
        unsubscribeUrl: 'http://localhost:3000/api/unsubscribe?email=yahyebaron@gmail.com&token=sample_token',
      });
      break;
  }

  if (format === 'text') {
    return new NextResponse(rendered.text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // Inject a small preview banner at the top of the HTML to switch templates
  const previewNav = `
    <div style="background: #111827; border-bottom: 1px solid #374151; padding: 10px 20px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; display: flex; justify-content: space-between; align-items: center; color: #9ca3af; position: sticky; top: 0; z-index: 1000;">
      <div>
        <strong style="color: #60a5fa;">Email Previewer</strong>: <span style="color: #f3f4f6;">${rendered.subject}</span>
      </div>
      <div style="display: flex; gap: 12px;">
        <a href="?template=welcome" style="color: ${template === 'welcome' ? '#60a5fa' : '#9ca3af'}; text-decoration: none; font-weight: ${template === 'welcome' ? 'bold' : 'normal'};">1. Welcome</a>
        <a href="?template=receipt" style="color: ${template === 'receipt' ? '#60a5fa' : '#9ca3af'}; text-decoration: none; font-weight: ${template === 'receipt' ? 'bold' : 'normal'};">2. Receipt</a>
        <a href="?template=certificate" style="color: ${template === 'certificate' ? '#60a5fa' : '#9ca3af'}; text-decoration: none; font-weight: ${template === 'certificate' ? 'bold' : 'normal'};">3. Certificate</a>
        <a href="?template=alert" style="color: ${template === 'alert' ? '#60a5fa' : '#9ca3af'}; text-decoration: none; font-weight: ${template === 'alert' ? 'bold' : 'normal'};">4. Alert</a>
        <span style="color: #4b5563;">|</span>
        <a href="?template=${template}&format=text" style="color: #9ca3af; text-decoration: none;">View Plain Text</a>
      </div>
    </div>
  `;

  const finalHtml = rendered.html.replace('<body ', `<body `).replace(/<body[^>]*>/i, (match) => `${match}\n${previewNav}`);

  return new NextResponse(finalHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
