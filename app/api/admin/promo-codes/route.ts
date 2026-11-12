import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOnly, handleApiError, badRequestResponse } from '@/lib/auth-policy';
import { PromoCodeCreateSchema } from '@/lib/validation-schemas';

export async function GET() {
  try {
    await requireAdminOnly();

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ promoCodes: [] });
    }

    const promoCodes = await prisma.promoCode.findMany({
      include: {
        _count: {
          select: { usage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ promoCodes });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await requireAdminOnly();
    const adminUsername = authContext.isDatabaseAdmin ? authContext.admin?.username || 'ADMIN' : authContext.user?.name || 'ADMIN';

    const body = await req.json().catch(() => null);
    if (!body) {
      return badRequestResponse('Invalid JSON payload');
    }

    const parsed = PromoCodeCreateSchema.parse(body);

    const expiryDate = parsed.expiresAt.includes('T')
      ? new Date(parsed.expiresAt)
      : new Date(`${parsed.expiresAt}T23:59:59.999Z`);

    if (expiryDate < new Date()) {
      return badRequestResponse('Expiry date must be in the future');
    }

    if (process.env.DATABASE_URL) {
      const existing = await prisma.promoCode.findUnique({
        where: { code: parsed.code },
      });

      if (existing) {
        return badRequestResponse('Promo code already exists');
      }

      const discountVal = parsed.discountValue ?? parsed.discountAmount ?? parsed.discount ?? 0;
      const promoCode = await prisma.promoCode.create({
        data: {
          code: parsed.code,
          discount: parsed.discount ?? (parsed.discountType === 'PERCENTAGE' ? discountVal : 0),
          discountType: parsed.discountType === 'FIXED_AMOUNT' ? 'FIXED' : parsed.discountType || 'PERCENTAGE',
          discountValue: discountVal,
          discountAmount: parsed.discountAmount || (parsed.discountType !== 'PERCENTAGE' ? discountVal : null),
          minOrderAmount: parsed.minOrderAmount || null,
          maxDiscountAmount: parsed.maxDiscountAmount || null,
          minimumOrder: parsed.minOrderAmount || null,
          maxDiscount: parsed.maxDiscountAmount || null,
          applicableCourses: parsed.applicableCourses || [],
          startsAt: parsed.startsAt ? new Date(parsed.startsAt) : new Date(),
          expiresAt: expiryDate,
          maxUses: parsed.maxUses || null,
          maxPerUser: parsed.maxPerUser || 1,
          description: parsed.description,
          createdBy: adminUsername,
          ...(parsed.applicableCourses && parsed.applicableCourses.length > 0
            ? {
                targetedCourses: {
                  create: parsed.applicableCourses.map((cId) => ({ courseId: cId })),
                },
              }
            : {}),
        },
      });

      return NextResponse.json({ promoCode, message: 'Promo code created successfully' }, { status: 201 });
    }

    return NextResponse.json({ promoCode: parsed, message: 'Promo code created (mock mode)' }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}
