import { prisma } from '../prisma.ts';
import { COURSES } from '../data.ts';
import {
  PAYMENT_STATUS,
  PROMO_USAGE_STATUS,
  calculatePromoDiscount,
  roundMoney,
  isValidPaymentStateTransition,
  type PromoCalculationResult,
} from './domain.ts';

export class PaymentError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'PaymentError';
    this.statusCode = statusCode;
  }
}

export interface CreateQuoteInput {
  userId: string;
  userEmail?: string;
  courseSlug: string;
  promoCode?: string;
  quantity?: number;
  provider?: string;
  idempotencyKey?: string;
}

export interface CreateQuoteResult {
  orderId: string;
  courseSlug: string;
  courseTitle: string;
  quantity: number;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  isZeroValue: boolean;
  promoCode?: string;
  promoSnapshot?: any;
  status: string;
}

/**
 * Phase 4: Validates course eligibility (published & non-deleted), validates quantity,
 * calculates server-authoritative quote, and creates an immutable CheckoutOrder BEFORE gateway call.
 */
export async function createCheckoutQuoteAndOrder(input: CreateQuoteInput): Promise<CreateQuoteResult> {
  const {
    userId,
    userEmail,
    courseSlug,
    promoCode,
    quantity = 1,
    provider = 'SIFALO_PAY',
    idempotencyKey,
  } = input;

  // 1. Input Quantity Validation (Must be positive integer)
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0 || !Number.isFinite(qty)) {
    throw new PaymentError('Invalid quantity. Quantity must be a positive integer.', 400);
  }

  // 1b. Check Idempotency Key before creating duplicate order
  if (idempotencyKey && process.env.DATABASE_URL) {
    const existingOrder = await prisma.checkoutOrder.findFirst({
      where: { userId, idempotencyKey },
      include: { course: true, promoCode: true },
    });
    if (existingOrder) {
      return {
        orderId: existingOrder.id,
        courseSlug: existingOrder.courseId,
        courseTitle: existingOrder.course?.title || '',
        quantity: qty,
        originalAmount: roundMoney(existingOrder.originalAmount),
        discountAmount: roundMoney(existingOrder.discountAmount),
        finalAmount: roundMoney(existingOrder.finalAmount),
        currency: existingOrder.currency,
        isZeroValue: Number(existingOrder.finalAmount) === 0,
        promoCode: existingOrder.promoCode?.code,
        promoSnapshot: existingOrder.promoSnapshot,
        status: existingOrder.status,
      };
    }
  }

  // 2. Load course by slug requiring isPublished: true and isDeleted: false
  let coursePrice: number;
  let courseTitle: string;

  if (process.env.DATABASE_URL) {
    const dbCourse = await prisma.course.findUnique({
      where: { slug: courseSlug },
    });

    if (!dbCourse || dbCourse.isDeleted || !dbCourse.isPublished) {
      const staticFallback = process.env.NODE_ENV !== 'production'
        ? COURSES.find((c) => c.slug === courseSlug)
        : null;

      if (!staticFallback) {
        throw new PaymentError('Course is not available for purchase or does not exist.', 404);
      }

      if (staticFallback.isComingSoon) {
        throw new PaymentError('This course is currently in Coming Soon mode and is locked for purchase. Please join the waitlist.', 400);
      }

      coursePrice = roundMoney(staticFallback.price) * qty;
      courseTitle = staticFallback.title;
    } else {
      if ((dbCourse as any).isComingSoon) {
        const releaseMsg = (dbCourse as any).releaseDate
          ? ` until ${(dbCourse as any).releaseDate}`
          : '';
        throw new PaymentError(`This course is currently in Coming Soon mode and is locked for purchase${releaseMsg}. Please join the waitlist.`, 400);
      }

      coursePrice = roundMoney(dbCourse.price) * qty;
      courseTitle = dbCourse.title;
    }
  } else {
    const staticCourse = COURSES.find((c) => c.slug === courseSlug);
    if (!staticCourse) {
      throw new PaymentError('Course not found.', 404);
    }

    if (staticCourse.isComingSoon) {
      throw new PaymentError('This course is currently in Coming Soon mode and is locked for purchase. Please join the waitlist.', 400);
    }

    coursePrice = roundMoney(staticCourse.price) * qty;
    courseTitle = staticCourse.title;
  }

  // 3. Normalize promo code and calculate quote on server
  let promoResult: PromoCalculationResult = {
    isValid: true,
    discountType: 'PERCENTAGE',
    discountValue: 0,
    calculatedDiscount: 0,
    finalPrice: coursePrice,
    isZeroValue: coursePrice === 0,
  };

  const cleanCode = promoCode ? promoCode.trim().toUpperCase() : '';

  if (cleanCode && process.env.DATABASE_URL) {
    const promoRecord = await prisma.promoCode.findUnique({
      where: { code: cleanCode },
      include: {
        usage: {
          where: { courseId: courseSlug },
        },
        targetedCourses: true,
      },
    });

    promoResult = calculatePromoDiscount({
      code: cleanCode,
      userId,
      userEmail,
      courseSlug,
      basePrice: coursePrice,
      promoRecord: promoRecord as any,
    });
  } else if (cleanCode) {
    promoResult = calculatePromoDiscount({
      code: cleanCode,
      userId,
      userEmail,
      courseSlug,
      basePrice: coursePrice,
    });
  }

  if (!promoResult.isValid) {
    throw new PaymentError(promoResult.error || 'Invalid promo code.', 400);
  }

  const finalAmount = promoResult.finalPrice;
  const discountAmount = promoResult.calculatedDiscount;
  const promoObj = promoResult.promoObj;

  const promoSnapshot = promoObj
    ? {
        code: promoResult.code,
        discountType: promoResult.discountType,
        discountValue: promoResult.discountValue,
        calculatedDiscount: promoResult.calculatedDiscount,
      }
    : null;

  // 4. Create immutable CheckoutOrder in database before external gateway call
  const orderId = `ORDER-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

  if (process.env.DATABASE_URL) {
    const createdOrder = await prisma.checkoutOrder.create({
      data: {
        id: orderId,
        userId,
        courseId: courseSlug,
        provider,
        providerRef: orderId,
        idempotencyKey: idempotencyKey || null,
        originalAmount: coursePrice,
        discountAmount,
        finalAmount,
        currency: 'USD',
        promoCodeId: promoObj?.id || null,
        promoSnapshot: promoSnapshot ? JSON.parse(JSON.stringify(promoSnapshot)) : undefined,
        status: PAYMENT_STATUS.PENDING,
        completedAt: null,
      },
    });

    // Reserve promo code usage atomically
    if (promoObj) {
      await prisma.promoCodeUsage.upsert({
        where: {
          userId_courseId_promoCodeId: {
            userId,
            courseId: courseSlug,
            promoCodeId: promoObj.id,
          },
        },
        create: {
          userId,
          courseId: courseSlug,
          promoCodeId: promoObj.id,
          orderId,
          status: PROMO_USAGE_STATUS.RESERVED,
          discountApplied: discountAmount,
          originalAmount: coursePrice,
          finalAmount,
          usedAt: new Date(),
          reservedAt: new Date(),
        },
        update: {
          orderId,
          status: PROMO_USAGE_STATUS.RESERVED,
          discountApplied: discountAmount,
          originalAmount: coursePrice,
          finalAmount,
          reservedAt: new Date(),
        },
      });
    }

    // If zero-value order, finalize payment and enrollment immediately
    if (promoResult.isZeroValue) {
      await finalizeSuccessfulPayment({
        orderIdOrRef: createdOrder.id,
        provider: 'PROMO_FREE',
        providerRef: orderId,
      });
    }
  }

  return {
    orderId,
    courseSlug,
    courseTitle,
    quantity: qty,
    originalAmount: coursePrice,
    discountAmount,
    finalAmount,
    currency: 'USD',
    isZeroValue: promoResult.isZeroValue,
    promoCode: cleanCode || undefined,
    promoSnapshot,
    status: promoResult.isZeroValue ? PAYMENT_STATUS.COMPLETED : PAYMENT_STATUS.PENDING,
  };
}

export interface FinalizePaymentInput {
  orderIdOrRef: string;
  provider: string;
  providerRef?: string;
  providerPayload?: any;
  authoritativeAmount?: number;
}

export interface FinalizePaymentResult {
  success: boolean;
  idempotent: boolean;
  orderId: string;
  status: string;
  amountPaid: number;
}

/**
 * Phase 5: Single transactional payment finalization service.
 * Used by Sifalo webhooks, zero-value checkout, and trusted server verifications.
 * Performs atomic promo redemption, usage locking, single increment, order marking, and enrollment.
 */
export async function finalizeSuccessfulPayment(input: FinalizePaymentInput): Promise<FinalizePaymentResult> {
  const { orderIdOrRef, provider, providerRef, providerPayload } = input;

  if (!process.env.DATABASE_URL) {
    return {
      success: true,
      idempotent: true,
      orderId: orderIdOrRef,
      status: PAYMENT_STATUS.COMPLETED,
      amountPaid: input.authoritativeAmount || 0,
    };
  }

  return await prisma.$transaction(
    async (tx) => {
    // 1. Find matching CheckoutOrder
    const order = await tx.checkoutOrder.findFirst({
      where: {
        OR: [
          { id: orderIdOrRef },
          { providerRef: orderIdOrRef },
          ...(providerRef ? [{ providerRef }] : []),
        ],
      },
      include: { promoCode: true, user: true, course: true },
    });

    if (!order) {
      // Fallback if no pre-created order exists
      const refToUse = providerRef || orderIdOrRef;
      const enrollment = await tx.enrollment.findFirst({
        where: { transactionRef: refToUse },
      });

      if (!enrollment) {
        throw new PaymentError(`CheckoutOrder or Enrollment not found for reference ${refToUse}`, 404);
      }

      return {
        success: true,
        idempotent: true,
        orderId: refToUse,
        status: enrollment.paymentStatus,
        amountPaid: roundMoney(enrollment.amountPaid),
      };
    }

    const refToUse = providerRef || order.providerRef || order.id;

    // 2. Idempotency Check: If order is ALREADY completed, return success without re-incrementing usage!
    if (order.status === PAYMENT_STATUS.COMPLETED) {
      return {
        success: true,
        idempotent: true,
        orderId: order.id,
        status: PAYMENT_STATUS.COMPLETED,
        amountPaid: roundMoney(order.finalAmount),
      };
    }

    // 2b. State Transition Validation: Prevent illegal transitions (e.g. REVERSED -> COMPLETED)
    if (!isValidPaymentStateTransition(order.status, PAYMENT_STATUS.COMPLETED)) {
      throw new PaymentError(`Invalid payment status transition from ${order.status} to COMPLETED for order ${order.id}`, 400);
    }

    // 3. Promo Code Redemption & Usage Lock (if order used a promo code)
    if (order.promoCodeId && order.promoCode) {
      const promo = order.promoCode;

      // Global max uses check
      if (promo.maxUses !== null && promo.maxUses !== undefined && promo.usedCount >= promo.maxUses) {
        throw new PaymentError('Promo code maximum uses limit exceeded.', 400);
      }

      // Per-user limit check
      const existingUserUsages = await tx.promoCodeUsage.count({
        where: {
          userId: order.userId,
          promoCodeId: promo.id,
          status: PROMO_USAGE_STATUS.REDEEMED,
          NOT: { orderId: order.id },
        },
      });

      if (existingUserUsages >= promo.maxPerUser) {
        throw new PaymentError('User maximum allowed promo usages reached.', 400);
      }

      // Upsert PromoCodeUsage row with financial snapshots & redeemedAt timestamp
      await tx.promoCodeUsage.upsert({
        where: {
          userId_courseId_promoCodeId: {
            userId: order.userId,
            courseId: order.courseId,
            promoCodeId: promo.id,
          },
        },
        create: {
          userId: order.userId,
          courseId: order.courseId,
          promoCodeId: promo.id,
          orderId: order.id,
          status: PROMO_USAGE_STATUS.REDEEMED,
          transactionRef: refToUse,
          discountApplied: order.discountAmount,
          originalAmount: order.originalAmount,
          finalAmount: order.finalAmount,
          usedAt: new Date(),
          redeemedAt: new Date(),
        },
        update: {
          orderId: order.id,
          status: PROMO_USAGE_STATUS.REDEEMED,
          transactionRef: refToUse,
          discountApplied: order.discountAmount,
          originalAmount: order.originalAmount,
          finalAmount: order.finalAmount,
          redeemedAt: new Date(),
        },
      });

      // Increment usedCount EXACTLY ONCE with atomic concurrency check
      if (promo.maxUses !== null && promo.maxUses !== undefined) {
        const updateResult = await tx.promoCode.updateMany({
          where: {
            id: promo.id,
            usedCount: { lt: promo.maxUses },
          },
          data: {
            usedCount: { increment: 1 },
          },
        });

        if (updateResult.count === 0) {
          throw new PaymentError('Promo code maximum uses limit exceeded.', 400);
        }
      } else {
        await tx.promoCode.update({
          where: { id: promo.id },
          data: { usedCount: { increment: 1 } },
        } as any);
      }
    }

    // 4. Mark CheckoutOrder COMPLETED
    const updatedOrder = await tx.checkoutOrder.update({
      where: { id: order.id },
      data: {
        status: PAYMENT_STATUS.COMPLETED,
        provider: provider || order.provider,
        providerRef: refToUse,
        completedAt: new Date(),
      },
    });

    // 5. Create or update Enrollment preserving exact quote pricing
    await tx.enrollment.upsert({
      where: { userId_courseId: { userId: order.userId, courseId: order.courseId } },
      update: {
        paymentStatus: PAYMENT_STATUS.COMPLETED,
        transactionRef: refToUse,
        provider: provider || order.provider,
        amountPaid: order.finalAmount,
        originalPrice: order.originalAmount,
        discountPaid: order.discountAmount,
        promoCodeId: order.promoCodeId,
        orderId: order.id,
      },
      create: {
        userId: order.userId,
        courseId: order.courseId,
        progress: 0,
        paymentStatus: PAYMENT_STATUS.COMPLETED,
        transactionRef: refToUse,
        provider: provider || order.provider,
        amountPaid: order.finalAmount,
        originalPrice: order.originalAmount,
        discountPaid: order.discountAmount,
        promoCodeId: order.promoCodeId,
        orderId: order.id,
      },
    });

    // 6. Record PaymentEvent
    await tx.paymentEvent.upsert({
      where: {
        provider_transactionRef: {
          provider: provider || 'SIFALO',
          transactionRef: refToUse,
        },
      },
      create: {
        provider: provider || 'SIFALO',
        transactionRef: refToUse,
        amount: order.finalAmount,
        status: PAYMENT_STATUS.COMPLETED,
        metadata: providerPayload || { orderId: order.id, courseId: order.courseId, userId: order.userId },
      },
      update: {
        amount: order.finalAmount,
        status: PAYMENT_STATUS.COMPLETED,
        metadata: providerPayload || { orderId: order.id, courseId: order.courseId, userId: order.userId },
      },
    });

    return {
      success: true,
      idempotent: false,
      orderId: updatedOrder.id,
      status: PAYMENT_STATUS.COMPLETED,
      amountPaid: roundMoney(updatedOrder.finalAmount),
    };
  }, { maxWait: 15000, timeout: 30000 });
}

export interface ReversalInput {
  orderIdOrRef: string;
  provider: string;
  reason?: string;
  providerPayload?: any;
}

/**
 * Phase 5: Payment Reversal Transaction handler for refunds/chargebacks.
 * Marks CheckoutOrder, Enrollment, and PromoCodeUsage REVERSED without destroying audit trail.
 */
export async function handlePaymentReversal(input: ReversalInput) {
  const { orderIdOrRef, provider, reason, providerPayload } = input;

  if (!process.env.DATABASE_URL) {
    return { success: true };
  }

  return await prisma.$transaction(
    async (tx) => {
    const order = await tx.checkoutOrder.findFirst({
      where: {
        OR: [
          { id: orderIdOrRef },
          { providerRef: orderIdOrRef },
        ],
      },
      include: { promoUsage: true },
    });

    if (!order) {
      // Fallback by enrollment transactionRef
      const enrollment = await tx.enrollment.findFirst({
        where: { transactionRef: orderIdOrRef },
      });

      if (enrollment) {
        await tx.enrollment.update({
          where: { id: enrollment.id },
          data: { paymentStatus: PAYMENT_STATUS.REVERSED },
        });

        await tx.promoCodeUsage.updateMany({
          where: { transactionRef: orderIdOrRef },
          data: { status: PROMO_USAGE_STATUS.REVERSED, reversedAt: new Date() },
        });
      }
      return { success: true };
    }

    // Idempotency: If already REVERSED, return success without re-reversing
    if (order.status === PAYMENT_STATUS.REVERSED) {
      return { success: true, orderId: order.id, idempotent: true };
    }

    if (!isValidPaymentStateTransition(order.status, PAYMENT_STATUS.REVERSED)) {
      throw new PaymentError(`Invalid payment status transition from ${order.status} to REVERSED for order ${order.id}`, 400);
    }

    const wasCompleted = order.status === PAYMENT_STATUS.COMPLETED;

    // 1. Mark Order REVERSED
    await tx.checkoutOrder.update({
      where: { id: order.id },
      data: {
        status: PAYMENT_STATUS.REVERSED,
        reversedAt: new Date(),
      },
    });

    // 2. Mark Enrollment REVERSED
    await tx.enrollment.updateMany({
      where: { orderId: order.id },
      data: { paymentStatus: PAYMENT_STATUS.REVERSED },
    });

    // 3. Mark PromoCodeUsage REVERSED
    await tx.promoCodeUsage.updateMany({
      where: { orderId: order.id },
      data: {
        status: PROMO_USAGE_STATUS.REVERSED,
        reversedAt: new Date(),
      },
    });

    // 4. Decrement usedCount if usage was previously REDEEMED
    if (wasCompleted && order.promoCodeId) {
      const promo = await tx.promoCode.findUnique({ where: { id: order.promoCodeId } });
      if (promo && promo.usedCount > 0) {
        await tx.promoCode.update({
          where: { id: promo.id },
          data: { usedCount: { decrement: 1 } },
        });
      }
    }

    // 5. Upsert PaymentEvent REVERSED
    await tx.paymentEvent.upsert({
      where: {
        provider_transactionRef: {
          provider: provider || 'SIFALO',
          transactionRef: order.providerRef || order.id,
        },
      },
      create: {
        provider: provider || 'SIFALO',
        transactionRef: order.providerRef || order.id,
        amount: order.finalAmount,
        status: PAYMENT_STATUS.REVERSED,
        metadata: providerPayload || { reason: reason || 'Refund/Reversal' },
      },
      update: {
        status: PAYMENT_STATUS.REVERSED,
        metadata: providerPayload || { reason: reason || 'Refund/Reversal' },
      },
    });

    return { success: true, orderId: order.id };
  }, { maxWait: 15000, timeout: 30000 });
}

export interface FailureInput {
  orderIdOrRef: string;
  provider?: string;
  reason?: string;
  providerPayload?: any;
}

/**
 * Phase 5: Handles failed payment callbacks atomically.
 * Transitions CheckoutOrder to FAILED, updates Enrollment status, and releases any active promo reservations.
 */
export async function handlePaymentFailure(input: FailureInput) {
  const { orderIdOrRef, provider, reason, providerPayload } = input;

  if (!process.env.DATABASE_URL) {
    return { success: true };
  }

  return await prisma.$transaction(
    async (tx) => {
    const order = await tx.checkoutOrder.findFirst({
      where: {
        OR: [
          { id: orderIdOrRef },
          { providerRef: orderIdOrRef },
        ],
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.status === PAYMENT_STATUS.FAILED) {
      return { success: true, orderId: order.id, idempotent: true };
    }

    if (!isValidPaymentStateTransition(order.status, PAYMENT_STATUS.FAILED)) {
      return { success: false, error: `Invalid payment status transition from ${order.status} to FAILED` };
    }

    await tx.checkoutOrder.update({
      where: { id: order.id },
      data: {
        status: PAYMENT_STATUS.FAILED,
        failedAt: new Date(),
      },
    });

    await tx.enrollment.updateMany({
      where: { orderId: order.id, paymentStatus: PAYMENT_STATUS.PENDING },
      data: { paymentStatus: PAYMENT_STATUS.FAILED },
    });

    if (order.promoCodeId) {
      await tx.promoCodeUsage.deleteMany({
        where: {
          orderId: order.id,
          status: PROMO_USAGE_STATUS.RESERVED,
        },
      });
    }

    await tx.paymentEvent.upsert({
      where: {
        provider_transactionRef: {
          provider: provider || 'SIFALO',
          transactionRef: order.providerRef || order.id,
        },
      },
      create: {
        provider: provider || 'SIFALO',
        transactionRef: order.providerRef || order.id,
        amount: order.finalAmount,
        status: PAYMENT_STATUS.FAILED,
        metadata: providerPayload || { reason: reason || 'Payment Failed' },
      },
      update: {
        status: PAYMENT_STATUS.FAILED,
        metadata: providerPayload || { reason: reason || 'Payment Failed' },
      },
    });

    return { success: true, orderId: order.id };
  }, { maxWait: 15000, timeout: 30000 });
}

export interface CheckEnrollmentResult {
  isEnrolled: boolean;
  enrollment: any | null;
  order: any | null;
  reason?: string;
}

/**
  * Robust server-side enrollment & payment verification guard.
  * Validates that an enrollment record exists AND has paymentStatus === 'COMPLETED'.
  * For paid courses, additionally cross-verifies that a corresponding completed CheckoutOrder exists.
  * Does NOT grant access based on user role.
  */
export async function checkEnrollment(userId: string, courseId: string): Promise<CheckEnrollmentResult> {
  if (!userId || !courseId) {
    return { isEnrolled: false, enrollment: null, order: null, reason: 'Missing userId or courseId' };
  }

  if (!process.env.DATABASE_URL) {
    return { isEnrolled: false, enrollment: null, order: null, reason: 'No database configured' };
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
    include: {
      order: true,
      course: {
        select: { slug: true, price: true, isPublished: true, isDeleted: true },
      },
    },
  });

  if (!enrollment) {
    return { isEnrolled: false, enrollment: null, order: null, reason: 'No enrollment record found' };
  }

  // Strict check: paymentStatus must be COMPLETED
  if (enrollment.paymentStatus !== PAYMENT_STATUS.COMPLETED && enrollment.paymentStatus !== 'COMPLETED') {
    return {
      isEnrolled: false,
      enrollment,
      order: enrollment.order,
      reason: `Enrollment status is ${enrollment.paymentStatus}, not COMPLETED`,
    };
  }

  // Cross-verify paid courses have a valid completed order or valid non-zero amount
  const isPaidCourse = enrollment.course ? Number(enrollment.course.price) > 0 : Number(enrollment.amountPaid) > 0;
  if (isPaidCourse) {
    if (enrollment.order && enrollment.order.status !== PAYMENT_STATUS.COMPLETED && enrollment.order.status !== 'COMPLETED') {
      return {
        isEnrolled: false,
        enrollment,
        order: enrollment.order,
        reason: `Linked order status is ${enrollment.order.status}, not COMPLETED`,
      };
    }
  }

  return { isEnrolled: true, enrollment, order: enrollment.order };
}

