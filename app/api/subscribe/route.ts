import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkPublicApiRateLimit } from '@/lib/rate-limit';
import { captureException } from '@/lib/telemetry';
import { inngest } from '@/lib/inngest/client';

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
    const rateLimit = await checkPublicApiRateLimit(`subscribe:${ip}`);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body.email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const email = body.email.trim().toLowerCase();

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Check if subscriber exists in Prisma database
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (!existing.active) {
        await prisma.newsletterSubscriber.update({
          where: { email },
          data: { active: true },
        });

        return NextResponse.json({
          success: true,
          message: 'Welcome back! Your subscription has been reactivated.',
          isExisting: true,
          reactivated: true,
          emailDelivery: { queued: false, mode: 'None' },
        });
      }

      return NextResponse.json({
        success: true,
        message: "You're already subscribed! Stay tuned for our upcoming developer dispatch.",
        isExisting: true,
        reactivated: false,
        emailDelivery: { queued: false, mode: 'None' },
      });
    }

    // Create new subscriber record in database
    await prisma.newsletterSubscriber.create({
      data: { email, active: true },
    });

    // Offload welcome email dispatch to Inngest background queue (first subscription only)
    await inngest.send({
      name: 'email/send',
      data: {
        type: 'welcome',
        to: email,
        idempotencyKey: `welcome/${email}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "You're subscribed! Check your inbox for your free starter kit.",
      emailDelivery: { queued: true, mode: 'Inngest' },
    });


  } catch (error: unknown) {
    captureException(error, { endpoint: 'POST /api/subscribe' });
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
