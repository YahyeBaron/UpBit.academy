import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillPhase3() {
  console.log('🔄 Starting Phase 3 Conservative Data Backfill...');

  let enrollmentsProcessed = 0;
  let ordersCreated = 0;
  let promoUsagesUpdated = 0;
  const unmappableRecords: Array<{ id: string; type: string; reason: string }> = [];

  // 1. Backfill Enrollments to CheckoutOrder
  const enrollments = await prisma.enrollment.findMany({
    include: { user: true, course: true },
  });

  for (const enrollment of enrollments) {
    enrollmentsProcessed++;
    const providerRef = enrollment.transactionRef || `LEGACY-ENROLL-${enrollment.id}`;

    let order = await prisma.checkoutOrder.findFirst({
      where: {
        OR: [
          { providerRef },
          { id: enrollment.orderId || undefined },
          { userId: enrollment.userId, courseId: enrollment.courseId, finalAmount: enrollment.amountPaid },
        ],
      },
    });

    if (!order) {
      const origPrice = enrollment.originalPrice ?? enrollment.amountPaid;
      const discount = enrollment.discountPaid ?? 0;

      order = await prisma.checkoutOrder.create({
        data: {
          userId: enrollment.userId,
          courseId: enrollment.courseId,
          provider: enrollment.provider || 'HISTORICAL_MIGRATED',
          providerRef,
          originalAmount: origPrice,
          discountAmount: discount,
          finalAmount: enrollment.amountPaid,
          currency: 'USD',
          promoCodeId: enrollment.promoCodeId,
          status: enrollment.paymentStatus || 'COMPLETED',
          createdAt: enrollment.enrolledAt,
          completedAt: enrollment.paymentStatus === 'COMPLETED' ? enrollment.enrolledAt : null,
          failedAt: enrollment.paymentStatus === 'FAILED' ? enrollment.updatedAt : null,
          reversedAt: enrollment.paymentStatus === 'REVERSED' || enrollment.paymentStatus === 'REFUNDED' ? enrollment.updatedAt : null,
        },
      });
      ordersCreated++;
    }

    // Link Enrollment.orderId if not set
    if (enrollment.orderId !== order.id) {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { orderId: order.id },
      });
    }
  }

  // 2. Backfill PromoCodeUsage linkages
  const promoUsages = await prisma.promoCodeUsage.findMany();

  for (const usage of promoUsages) {
    if (!usage.orderId) {
      // Find matching order
      const matchingOrder = await prisma.checkoutOrder.findFirst({
        where: {
          userId: usage.userId,
          courseId: usage.courseId,
          promoCodeId: usage.promoCodeId,
        },
      });

      if (matchingOrder) {
        await prisma.promoCodeUsage.update({
          where: { id: usage.id },
          data: {
            orderId: matchingOrder.id,
            originalAmount: usage.originalAmount ?? matchingOrder.originalAmount,
            finalAmount: usage.finalAmount ?? matchingOrder.finalAmount,
            discountApplied: usage.discountApplied || matchingOrder.discountAmount,
            redeemedAt: usage.status === 'REDEEMED' ? usage.usedAt : null,
            reversedAt: usage.status === 'REVERSED' ? usage.usedAt : null,
          },
        });
        promoUsagesUpdated++;
      } else {
        unmappableRecords.push({
          id: usage.id,
          type: 'PromoCodeUsage',
          reason: `No matching CheckoutOrder found for user=${usage.userId}, course=${usage.courseId}, promo=${usage.promoCodeId}`,
        });
      }
    }
  }

  console.log('\n📊 ── Phase 3 Backfill Summary ──');
  console.log(`- Enrollments Processed: ${enrollmentsProcessed}`);
  console.log(`- CheckoutOrders Created: ${ordersCreated}`);
  console.log(`- PromoCodeUsages Linked/Updated: ${promoUsagesUpdated}`);
  console.log(`- Unmappable Records Logged: ${unmappableRecords.length}`);

  if (unmappableRecords.length > 0) {
    console.log('\n⚠️ Unmappable Records List:');
    unmappableRecords.forEach((rec) => {
      console.log(`  - [${rec.type}] ID: ${rec.id} | Reason: ${rec.reason}`);
    });
  }

  console.log('\n✅ Phase 3 Backfill completed successfully!\n');
}

backfillPhase3()
  .catch((e) => {
    console.error('❌ Backfill failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
