import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculatePromoDiscount } from '@/lib/payments/domain';
import { COURSES } from '@/lib/data';
import { requireAuthUser, AuthError } from '@/lib/auth-policy';
import { checkPromoRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const dbUser = await requireAuthUser();

    const body = await req.json().catch(() => ({}));
    const { code, courseSlug } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ isValid: false, error: 'Promo code is required' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
    const promoCheck = await checkPromoRateLimit(ip, dbUser.id, cleanCode);
    if (!promoCheck.allowed) {
      return NextResponse.json({ isValid: false, error: 'Too many promo code validation attempts. Please wait.' }, { status: 429 });
    }

    // Determine course base price
    let basePrice = 0;
    if (courseSlug && process.env.DATABASE_URL) {
      const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
      if (course) {
        basePrice = Number(course.price);
      }
    }
    if (!basePrice && courseSlug) {
      const staticCourse = COURSES.find((c: any) => c.slug === courseSlug);
      if (staticCourse) {
        basePrice = staticCourse.price;
      }
    }

    let promoRecord = null;
    if (process.env.DATABASE_URL) {
      promoRecord = await prisma.promoCode.findUnique({
        where: { code: cleanCode },
        include: {
          usage: true,
          targetedCourses: true,
        },
      });
    }

    const result = calculatePromoDiscount({
      code: cleanCode,
      userId: dbUser.id,
      userEmail: dbUser.email,
      courseSlug: courseSlug || '',
      basePrice,
      promoRecord: promoRecord as any,
    });

    if (!result.isValid) {
      return NextResponse.json({
        isValid: false,
        error: result.error || 'Invalid or expired coupon code.',
      }, { status: 400 });
    }

    return NextResponse.json({
      isValid: true,
      code: result.code,
      discountType: result.discountType,
      discountValue: result.discountValue,
      calculatedDiscount: result.calculatedDiscount,
      finalPrice: result.finalPrice,
      isZeroValue: result.isZeroValue,
    });
  } catch (error: any) {
    if (error instanceof AuthError || error?.name === 'AuthError') {
      return NextResponse.json({ isValid: false, error: error.message }, { status: error.statusCode || 401 });
    }
    console.error('Error validating promo code:', error);
    return NextResponse.json({ isValid: false, error: 'Failed to validate promo code' }, { status: 500 });
  }
}

