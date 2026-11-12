import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser, AuthError } from '@/lib/auth-policy';
import { checkCheckoutRateLimit, checkPromoRateLimit } from '@/lib/rate-limit';
import { getSifaloAuthHeaders } from '@/lib/sifalo-config';
import { inngest } from '@/lib/inngest/client';
import { captureException } from '@/lib/telemetry';
import { trackServerEvent, ANALYTICS_EVENTS } from '@/lib/posthog';
import { PAYMENT_STATUS } from '@/lib/payments/domain';
import {
  createCheckoutQuoteAndOrder,
  finalizeSuccessfulPayment,
  handlePaymentFailure,
  PaymentError,
} from '@/lib/payments/service';

// ─── Sifalo Pay Endpoints ────────────────────────────────────────────────────
const SIFALO_GATEWAY_URL = 'https://api.sifalopay.com/gateway/';
const SIFALO_VERIFY_URL  = 'https://api.sifalopay.com/gateway/verify.php';

function mapChannelToGateway(channel: string): 'waafi' | 'edahab' | 'pbwallet' {
  const c = (channel || '').toUpperCase();
  if (c === 'EDAHAB') return 'edahab';
  if (c === 'PBWALLET') return 'pbwallet';
  return 'waafi';
}

function formatSifaloAccount(account: string): string {
  let clean = (account || '').replace(/[^\d]/g, '');
  if (clean.startsWith('252')) {
    clean = clean.slice(3);
  }
  if (clean.startsWith('0')) {
    clean = clean.slice(1);
  }
  return clean;
}

// ─── GET: Verify transaction by sid or order_id ───────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const dbUser = await requireAuthUser();

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
    const rateLimit = await checkCheckoutRateLimit(ip, dbUser.id);
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const sid        = searchParams.get('sid');
    const orderId    = searchParams.get('order_id') || searchParams.get('orderId');

    if (!sid && !orderId) {
      return NextResponse.json({ success: false, error: 'Missing sid or order_id.' }, { status: 400 });
    }

    if (process.env.DATABASE_URL && (sid || orderId)) {
      try {
        const existingOrder = await prisma.checkoutOrder.findFirst({
          where: {
            userId: dbUser.id,
            OR: [
              sid ? { providerRef: sid } : {},
              orderId ? { providerRef: orderId } : {},
              orderId ? { id: orderId } : {},
            ],
            status: PAYMENT_STATUS.COMPLETED,
          },
        });
        if (existingOrder) {
          return NextResponse.json({
            success: true,
            status: 'success',
            code: 601,
            sid: existingOrder.providerRef || existingOrder.id,
            orderId: existingOrder.id,
          });
        }
      } catch (err) {
        captureException(err, { endpoint: 'GET /api/checkout/sifalo' });
      }
    }

    try {
      const verifyBody: Record<string, string> = {};
      if (sid) verifyBody.sid = sid;
      if (orderId) verifyBody.order_id = orderId;

      const res = await fetch(SIFALO_VERIFY_URL, {
        method: 'POST',
        headers: getSifaloAuthHeaders(),
        body: JSON.stringify(verifyBody),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        const codeStr = String(data?.code || '');
        const isSuccess = data?.status === 'success' || codeStr === '601' || data?.code === 601;

        const refToUse = data?.sid || sid || orderId || `EST-${Date.now()}`;

        if (isSuccess && process.env.DATABASE_URL) {
          await finalizeSuccessfulPayment({
            orderIdOrRef: orderId || refToUse,
            provider: data?.payment_type || 'SIFALO_PAY',
            providerRef: refToUse,
            providerPayload: data,
          }).catch(console.warn);
        } else if (!isSuccess && (data?.status === 'failed' || (codeStr && codeStr !== '601'))) {
          // Explicit failure returned by gateway — mark order failed and clean up state
          if (process.env.DATABASE_URL && (orderId || sid)) {
            await handlePaymentFailure({
              orderIdOrRef: orderId || sid!,
              provider: 'SIFALO_PAY',
              reason: data?.response || 'Payment rejected by gateway',
              providerPayload: data,
            }).catch(console.warn);
          }
        }

        return NextResponse.json({
          success: isSuccess,
          status: data?.status || (isSuccess ? 'success' : 'failed'),
          code: data?.code || (isSuccess ? 601 : 0),
          sid: data?.sid || sid,
          amount: data?.amount,
          paymentType: data?.payment_type,
          error: !isSuccess ? (data?.response || 'Payment unconfirmed') : undefined,
        });
      }
    } catch (err) {
      captureException(err, { endpoint: 'GET /api/checkout/sifalo verify call' });
    }

    return NextResponse.json({ success: false, status: 'pending' });

  } catch (authErr: any) {
    if (authErr instanceof AuthError || authErr?.name === 'AuthError') {
      return NextResponse.json({ success: false, error: authErr.message }, { status: authErr.statusCode || 401 });
    }
    return NextResponse.json({ success: false, error: 'Unauthorized access.' }, { status: 401 });
  }
}

// ─── POST: DIRECT_PAY, HOSTED_CHECKOUT, or VERIFY ────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const dbUser = await requireAuthUser();

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
    const rateLimit = await checkCheckoutRateLimit(ip, dbUser.id);
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, error: 'Too many checkout attempts. Please wait.' }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: 'Request body is required.' }, { status: 400 });
    }

    const {
      accountNumber,
      channel = 'ZAAD',
      promoCode,
      quantity = 1,
      action = 'DIRECT_PAY',
      sid,
      orderId: passedOrderId,
      order_id: passedOrderIdSnake,
      idempotencyKey,
    } = body;

    const courseSlug = body.courseSlug || body.course;
    const effectiveOrderId = passedOrderId || passedOrderIdSnake;

    // ── Action: VERIFY (Never create new orders during verification!) ─────────
    if (action === 'VERIFY') {
      const orderRef = effectiveOrderId || sid;
      if (!orderRef && !courseSlug) {
        return NextResponse.json({ success: false, error: 'orderId or courseSlug required for verification.' }, { status: 400 });
      }

      // 1. Find existing CheckoutOrder in database
      let existingOrder: any = null;
      if (process.env.DATABASE_URL) {
        existingOrder = await prisma.checkoutOrder.findFirst({
          where: {
            userId: dbUser.id,
            OR: [
              ...(orderRef ? [{ id: orderRef }, { providerRef: orderRef }] : []),
              ...(courseSlug ? [{ courseId: courseSlug }] : []),
            ],
          },
          orderBy: { createdAt: 'desc' },
          include: { course: true },
        });
      }

      // Idempotency: If already completed in DB, return success immediately
      if (existingOrder && existingOrder.status === PAYMENT_STATUS.COMPLETED) {
        return NextResponse.json({
          success: true,
          status: PAYMENT_STATUS.COMPLETED,
          sid: existingOrder.providerRef || existingOrder.id,
          orderId: existingOrder.id,
          amount: existingOrder.finalAmount,
          channel: existingOrder.provider,
          courseTitle: existingOrder.course?.title || '',
          courseSlug: existingOrder.courseId,
          message: 'Payment previously verified and completed!',
        });
      }

      // If already explicitly marked FAILED
      if (existingOrder && existingOrder.status === PAYMENT_STATUS.FAILED) {
        return NextResponse.json({
          success: false,
          status: PAYMENT_STATUS.FAILED,
          error: 'This payment attempt has failed. Please start a new checkout.',
        }, { status: 400 });
      }

      // 2. Gateway verification call to Sifalo
      const gatewayOrderId = existingOrder?.providerRef || existingOrder?.id || orderRef;
      const verifyBody: Record<string, string> = {};
      if (sid) verifyBody.sid = sid;
      if (gatewayOrderId) verifyBody.order_id = gatewayOrderId;

      let verifiedData: any = null;
      let isVerified = false;

      try {
        const verifyRes = await fetch(SIFALO_VERIFY_URL, {
          method: 'POST',
          headers: getSifaloAuthHeaders(),
          body: JSON.stringify(verifyBody),
        });

        if (verifyRes.ok) {
          verifiedData = await verifyRes.json().catch(() => null);
          const codeStr = String(verifiedData?.code || '');
          isVerified = verifiedData?.status === 'success' || codeStr === '601' || verifiedData?.code === 601;

          // Gateway Amount & Currency Verification
          if (isVerified && existingOrder && verifiedData?.amount !== undefined && verifiedData?.amount !== null) {
            const returnedAmount = Math.round((Number(verifiedData.amount) + Number.EPSILON) * 100) / 100;
            const expectedAmount = Math.round((Number(existingOrder.finalAmount) + Number.EPSILON) * 100) / 100;
            if (returnedAmount !== expectedAmount) {
              isVerified = false;
            }
          }
          if (isVerified && verifiedData?.currency && String(verifiedData.currency).toUpperCase() !== 'USD') {
            isVerified = false;
          }
        }
      } catch (err) {
        captureException(err, { endpoint: 'POST /api/checkout/sifalo VERIFY action' });
      }

      const refToUse = verifiedData?.sid || sid || gatewayOrderId;

      if (isVerified) {
        const targetOrderId = existingOrder?.id || gatewayOrderId;
        const finalizeResult = await finalizeSuccessfulPayment({
          orderIdOrRef: targetOrderId,
          provider: verifiedData?.payment_type || channel || 'SIFALO_PAY',
          providerRef: refToUse,
          providerPayload: verifiedData,
          authoritativeAmount: existingOrder ? Number(existingOrder.finalAmount) : Number(verifiedData?.amount || 0),
        });

        if (!finalizeResult.idempotent && dbUser.email) {
          inngest.send({
            name: 'email/send',
            data: {
              type: 'receipt',
              to: dbUser.email,
              data: {
                courseTitle: existingOrder?.course?.title || courseSlug,
                amountPaid: existingOrder ? Number(existingOrder.finalAmount) : Number(verifiedData?.amount || 0),
                transactionRef: refToUse,
                provider: verifiedData?.payment_type || channel || 'Sifalo Pay',
              },
              idempotencyKey: `receipt/${refToUse}`,
            },
          }).catch(() => null);
        }

        return NextResponse.json({
          success: true,
          status: PAYMENT_STATUS.COMPLETED,
          sid: refToUse,
          orderId: targetOrderId,
          amount: existingOrder ? existingOrder.finalAmount : verifiedData?.amount,
          channel: verifiedData?.payment_type || channel || 'Sifalo Pay',
          courseTitle: existingOrder?.course?.title || '',
          courseSlug: existingOrder?.courseId || courseSlug,
          message: 'Payment verified successfully!',
        });
      }

      // Explicit failure detection — clean up state and release promo reservations
      const isExplicitFailure = verifiedData && (
        verifiedData.status === 'failed' ||
        verifiedData.status === 'error' ||
        verifiedData.status === 'cancelled' ||
        (verifiedData.code && String(verifiedData.code) !== '601')
      );

      if (isExplicitFailure) {
        if (existingOrder) {
          await handlePaymentFailure({
            orderIdOrRef: existingOrder.id,
            provider: 'SIFALO',
            reason: verifiedData?.response || verifiedData?.status || 'Payment verification failed',
            providerPayload: verifiedData,
          }).catch(console.warn);
        }

        return NextResponse.json({
          success: false,
          status: PAYMENT_STATUS.FAILED,
          error: verifiedData?.response || 'Payment was rejected or cancelled. Please try again.',
        }, { status: 400 });
      }

      return NextResponse.json({
        success: false,
        status: verifiedData?.status || 'pending',
        error: 'Payment verification pending or unconfirmed.',
      });
    }

    // ── Pre-gateway actions (DIRECT_PAY, HOSTED_CHECKOUT) require courseSlug ──
    if (!courseSlug) {
      return NextResponse.json({ success: false, error: 'Course slug is required.' }, { status: 400 });
    }

    if (promoCode) {
      const promoCheck = await checkPromoRateLimit(ip, dbUser.id, promoCode);
      if (!promoCheck.allowed) {
        return NextResponse.json({ success: false, error: 'Too many promo code attempts.' }, { status: 429 });
      }
    }

    // ── Phase 4: Server-authoritative quote & immutable CheckoutOrder creation ─
    let quote;
    try {
      quote = await createCheckoutQuoteAndOrder({
        userId: dbUser.id,
        userEmail: dbUser.email,
        courseSlug,
        promoCode,
        quantity,
        provider: channel,
        idempotencyKey: idempotencyKey || effectiveOrderId,
      });
    } catch (err: any) {
      if (err instanceof PaymentError || err?.name === 'PaymentError') {
        return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode || 400 });
      }
      throw err;
    }

    const orderId = quote.orderId;

    // ── Phase 4: Support Zero-Value Orders Explicitly ─────────────────────────
    if (quote.isZeroValue) {
      await finalizeSuccessfulPayment({
        orderIdOrRef: orderId,
        provider: 'PROMO_FREE',
        providerRef: orderId,
      });

      if (dbUser.email) {
        inngest.send({
          name: 'email/send',
          data: {
            type: 'receipt',
            to: dbUser.email,
            data: {
              courseTitle: quote.courseTitle,
              amountPaid: 0,
              transactionRef: orderId,
              provider: 'Free Promo Code',
            },
            idempotencyKey: `receipt/${orderId}`,
          },
        }).catch(() => null);
      }

      await trackServerEvent(
        ANALYTICS_EVENTS.PAYMENT_COMPLETED,
        dbUser.id,
        { courseSlug, transactionRef: orderId, provider: 'PROMO_FREE', amountPaid: 0, isZeroValue: true }
      );

      const redirectUrl = `/checkout/verify?order_id=${encodeURIComponent(orderId)}&course=${encodeURIComponent(courseSlug)}&courseSlug=${encodeURIComponent(courseSlug)}`;

      return NextResponse.json({
        success: true,
        status: PAYMENT_STATUS.COMPLETED,
        isZeroValue: true,
        redirectUrl,
        sid: orderId,
        orderId,
        amount: 0,
        courseTitle: quote.courseTitle,
        courseSlug,
        message: 'Free enrollment redeemed successfully!',
      });
    }

    // ── Action: HOSTED_CHECKOUT ───────────────────────────────────────────────
    if (action === 'HOSTED_CHECKOUT') {
      const origin = req.headers.get('origin') || 'http://localhost:3000';
      const cancelUrl = `${origin}/checkout?course=${encodeURIComponent(courseSlug)}&cancelled=true&order_id=${encodeURIComponent(orderId)}`;
      const returnUrl = `${origin}/checkout/verify?order_id=${encodeURIComponent(orderId)}&course=${encodeURIComponent(courseSlug)}&courseSlug=${encodeURIComponent(courseSlug)}`;

      const checkoutPayload = {
        amount: String(quote.finalAmount),
        gateway: 'checkout',
        currency: 'USD',
        order_id: orderId,
        return_url: returnUrl,
        cancel_url: cancelUrl,
        callback_url: `${origin}/api/webhooks/sifalo`,
      };

      try {
        const apiRes = await fetch(SIFALO_GATEWAY_URL, {
          method: 'POST',
          headers: getSifaloAuthHeaders(),
          body: JSON.stringify(checkoutPayload),
        });

        if (apiRes.ok) {
          const data = await apiRes.json().catch(() => null);
          if (data?.key && data?.token) {
            const redirectUrl = `https://pay.sifalo.com/checkout/?key=${encodeURIComponent(data.key)}&token=${encodeURIComponent(data.token)}`;

            return NextResponse.json({
              success: true,
              redirectUrl,
              key: data.key,
              token: data.token,
              orderId,
              amount: quote.finalAmount,
            });
          }
        }
      } catch (err) {
        captureException(err, { endpoint: 'POST /api/checkout/sifalo HOSTED_CHECKOUT action' });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to generate Sifalo Hosted Checkout session.',
      }, { status: 500 });
    }

    // ── Action: DIRECT_PAY ───────────────────────────────────────────────────
    const gateway = mapChannelToGateway(channel);
    const cleanAccount = formatSifaloAccount(accountNumber);

    const directPayload = {
      account: cleanAccount || '630000000',
      gateway: gateway,
      amount: String(quote.finalAmount),
      currency: 'USD',
      order_id: orderId,
    };

    let sifaloResponseData: any = null;
    let isDirectSuccess = false;

    try {
      const apiRes = await fetch(SIFALO_GATEWAY_URL, {
        method: 'POST',
        headers: getSifaloAuthHeaders(),
        body: JSON.stringify(directPayload),
      });

      if (apiRes.ok) {
        sifaloResponseData = await apiRes.json().catch(() => null);
        const codeStr = String(sifaloResponseData?.code || '');
        isDirectSuccess = codeStr === '601' || sifaloResponseData?.code === 601;
      }
    } catch (apiErr) {
      captureException(apiErr, { endpoint: 'POST /api/checkout/sifalo DIRECT_PAY fetch' });
      return NextResponse.json({
        success: false,
        error: 'Unable to reach Sifalo Pay server. Please try again.',
      }, { status: 502 });
    }

    if (!sifaloResponseData) {
      return NextResponse.json({
        success: false,
        error: 'Empty response received from Sifalo Pay gateway.',
      }, { status: 502 });
    }

    if (!isDirectSuccess) {
      const errorMsg = sifaloResponseData?.response || `Payment request rejected (Code: ${sifaloResponseData?.code || 'Unknown'}).`;

      // Clean up state immediately: mark order FAILED and release promo reservations
      await handlePaymentFailure({
        orderIdOrRef: orderId,
        provider: `${channel} (${gateway})`,
        reason: errorMsg,
        providerPayload: sifaloResponseData,
      }).catch(console.warn);

      return NextResponse.json({
        success: false,
        code: sifaloResponseData?.code,
        error: errorMsg,
      }, { status: 400 });
    }

    // Amount & Currency Validation for DIRECT_PAY
    if (sifaloResponseData?.amount !== undefined && sifaloResponseData?.amount !== null) {
      const returnedAmount = Math.round((Number(sifaloResponseData.amount) + Number.EPSILON) * 100) / 100;
      const expectedAmount = Math.round((Number(quote.finalAmount) + Number.EPSILON) * 100) / 100;
      if (returnedAmount !== expectedAmount) {
        await handlePaymentFailure({
          orderIdOrRef: orderId,
          provider: `${channel} (${gateway})`,
          reason: 'Amount mismatch with gateway',
          providerPayload: sifaloResponseData,
        }).catch(console.warn);

        return NextResponse.json({
          success: false,
          error: 'Payment gateway amount mismatch.',
        }, { status: 400 });
      }
    }
    if (sifaloResponseData?.currency && String(sifaloResponseData.currency).toUpperCase() !== 'USD') {
      await handlePaymentFailure({
        orderIdOrRef: orderId,
        provider: `${channel} (${gateway})`,
        reason: 'Currency mismatch with gateway',
        providerPayload: sifaloResponseData,
      }).catch(console.warn);

      return NextResponse.json({
        success: false,
        error: 'Payment gateway currency mismatch.',
      }, { status: 400 });
    }

    const sidResult = sifaloResponseData?.sid || orderId;

    // Phase 5: Atomic single-transaction payment completion
    const finalizeResult = await finalizeSuccessfulPayment({
      orderIdOrRef: orderId,
      provider: `${channel} (${gateway})`,
      providerRef: sidResult,
      providerPayload: sifaloResponseData,
    });

    if (!finalizeResult.idempotent && dbUser.email) {
      inngest.send({
        name: 'email/send',
        data: {
          type: 'receipt',
          to: dbUser.email,
          data: {
            courseTitle: quote.courseTitle,
            amountPaid: quote.finalAmount,
            transactionRef: sidResult,
            provider: `${channel} (${gateway})`,
          },
          idempotencyKey: `receipt/${sidResult}`,
        },
      }).catch(() => null);
    }

    return NextResponse.json({
      success: true,
      status: PAYMENT_STATUS.COMPLETED,
      code: 601,
      sid: sidResult,
      orderId,
      amount: quote.finalAmount,
      channel,
      message: sifaloResponseData?.response || 'Your Transaction has been Processed!',
    });

  } catch (error: any) {
    if (error instanceof AuthError || error?.name === 'AuthError') {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 401 });
    }
    captureException(error, { endpoint: 'POST /api/checkout/sifalo' });
    return NextResponse.json(
      { success: false, error: 'Payment processing failed. Please try again.' },
      { status: 500 }
    );
  }
}
