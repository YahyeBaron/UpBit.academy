import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUnsubscribeToken } from '@/lib/email-delivery';
import { captureAlert } from '@/lib/telemetry';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email')?.trim().toLowerCase();
  const token = searchParams.get('token')?.trim();

  if (!email || !token) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="en">
        <head><title>Invalid Unsubscribe Link</title></head>
        <body style="font-family: sans-serif; background: #040711; color: #fff; text-align: center; padding: 60px 20px;">
          <h1 style="color: #ef4444;">Invalid or Missing Unsubscribe Token</h1>
          <p style="color: #9ca3af;">The link you followed is incomplete or invalid.</p>
        </body>
      </html>`,
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  const isValid = verifyUnsubscribeToken(email, token);
  if (!isValid) {
    captureAlert('Unsubscribe Token Forgery Attempt', `Invalid token received for ${email}`);
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="en">
        <head><title>Invalid Token</title></head>
        <body style="font-family: sans-serif; background: #040711; color: #fff; text-align: center; padding: 60px 20px;">
          <h1 style="color: #ef4444;">Security Verification Failed</h1>
          <p style="color: #9ca3af;">This unsubscribe link could not be verified.</p>
        </body>
      </html>`,
      { status: 403, headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    await prisma.newsletterSubscriber.updateMany({
      where: { email },
      data: { active: false },
    });

    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="en">
        <head>
          <title>Unsubscribed Successfully</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #040711; color: #fff; margin: 0; padding: 60px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: #070B16; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 40px; text-align: center;">
            <div style="font-size: 36px; margin-bottom: 16px;">✉️</div>
            <h1 style="font-size: 22px; font-weight: 800; margin-bottom: 12px; color: #fff;">
              You're Unsubscribed
            </h1>
            <p style="color: #9ca3af; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
              You have been successfully removed from Eraysame Tech Academy marketing dispatches and newsletter updates. You will still receive essential transactional emails regarding your active courses and certificates.
            </p>
            <a href="/" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: bold; padding: 10px 24px; border-radius: 9999px; font-size: 14px;">
              Return to Homepage
            </a>
          </div>
        </body>
      </html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (err) {
    console.error('Failed to unsubscribe:', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = body?.email?.trim().toLowerCase();
    const token = body?.token?.trim();

    if (!email || !token) {
      return NextResponse.json({ success: false, error: 'Email and token required.' }, { status: 400 });
    }

    if (!verifyUnsubscribeToken(email, token)) {
      return NextResponse.json({ success: false, error: 'Invalid unsubscribe token.' }, { status: 403 });
    }

    await prisma.newsletterSubscriber.updateMany({
      where: { email },
      data: { active: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed successfully from marketing dispatches.',
      email,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
