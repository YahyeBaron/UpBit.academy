import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOnly, handleApiError, badRequestResponse } from '@/lib/auth-policy';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOnly();

    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) {
      return badRequestResponse('Invalid JSON payload');
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ message: 'Updated (mock mode)' });
    }

    const dataToUpdate: any = {};
    if (body.isActive !== undefined) dataToUpdate.isActive = Boolean(body.isActive);
    if (body.description !== undefined) dataToUpdate.description = body.description;
    if (body.maxUses !== undefined) dataToUpdate.maxUses = body.maxUses ? Number(body.maxUses) : null;
    if (body.maxPerUser !== undefined) dataToUpdate.maxPerUser = Number(body.maxPerUser);
    if (body.startsAt !== undefined) dataToUpdate.startsAt = body.startsAt ? new Date(body.startsAt) : null;
    if (body.expiresAt !== undefined) dataToUpdate.expiresAt = new Date(body.expiresAt);
    if (body.minOrderAmount !== undefined) {
      dataToUpdate.minOrderAmount = body.minOrderAmount ? Number(body.minOrderAmount) : null;
      dataToUpdate.minimumOrder = dataToUpdate.minOrderAmount;
    }
    if (body.maxDiscountAmount !== undefined) {
      dataToUpdate.maxDiscountAmount = body.maxDiscountAmount ? Number(body.maxDiscountAmount) : null;
      dataToUpdate.maxDiscount = dataToUpdate.maxDiscountAmount;
    }
    if (body.discountType !== undefined) {
      dataToUpdate.discountType = body.discountType === 'FIXED_AMOUNT' ? 'FIXED' : body.discountType;
    }
    if (body.discountValue !== undefined) {
      dataToUpdate.discountValue = Number(body.discountValue);
      dataToUpdate.discount = Number(body.discountValue);
    }

    const updated = await prisma.promoCode.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ promoCode: updated, message: 'Promo code updated successfully' });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOnly();
    const { id } = await params;

    if (process.env.DATABASE_URL) {
      await prisma.promoCode.delete({ where: { id } });
    }

    return NextResponse.json({ success: true, message: 'Promo code deleted' });
  } catch (error: any) {
    return handleApiError(error);
  }
}
