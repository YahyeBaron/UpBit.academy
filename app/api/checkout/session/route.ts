import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser, AuthError } from '@/lib/auth-policy';
import { createCheckoutQuoteAndOrder, PaymentError } from '@/lib/payments/service';

export async function POST(req: NextRequest) {
  try {
    const dbUser = await requireAuthUser();

    const body = await req.json().catch(() => null);
    if (!body || !body.courseSlug) {
      return NextResponse.json({ success: false, error: 'Course slug is required.' }, { status: 400 });
    }

    const { courseSlug, promoCode, quantity = 1 } = body;

    const quote = await createCheckoutQuoteAndOrder({
      userId: dbUser.id,
      userEmail: dbUser.email,
      courseSlug,
      promoCode,
      quantity,
      provider: 'STRIPE_DEPRECATED',
    });

    return NextResponse.json(
      {
        message: 'Stripe checkout route is deprecated. Please use Sifalo Pay checkout at /api/checkout/sifalo',
        redirect: '/api/checkout/sifalo',
        orderId: quote.orderId,
        courseSlug: quote.courseSlug,
        originalAmount: quote.originalAmount,
        discountAmount: quote.discountAmount,
        finalAmount: quote.finalAmount,
        currency: quote.currency,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error instanceof AuthError || error?.name === 'AuthError') {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 401 });
    }
    if (error instanceof PaymentError || error?.name === 'PaymentError') {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 400 });
    }
    return NextResponse.json({ success: false, error: 'Failed to process checkout session request.' }, { status: 500 });
  }
}
