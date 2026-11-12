import { prisma } from '../lib/prisma';

/**
 * Database Maintenance & Invariant Cleanup Script
 *
 * Runs scheduled pruning of:
 * 1. Expired IdempotencyKey records
 * 2. Expired AdminSession records
 * 3. Stale RESERVED PromoCodeUsage records (older than 30 minutes without redemption)
 * 4. Stale PENDING CheckoutOrder records (older than 24 hours)
 */
export async function runDatabaseCleanup(): Promise<{
  deletedIdempotencyKeys: number;
  deletedAdminSessions: number;
  releasedPromoReservations: number;
  expiredPendingOrders: number;
}> {
  const now = new Date();
  console.log(`[db-cleanup] Starting database maintenance at ${now.toISOString()}...`);

  // 1. Delete expired Idempotency Keys
  const idempotencyResult = await prisma.idempotencyKey.deleteMany({
    where: {
      expiresAt: { lt: now },
    },
  });
  console.log(`[db-cleanup] Pruned ${idempotencyResult.count} expired idempotency keys.`);

  // 2. Delete expired Admin Sessions
  const sessionResult = await prisma.adminSession.deleteMany({
    where: {
      expiresAt: { lt: now },
    },
  });
  console.log(`[db-cleanup] Pruned ${sessionResult.count} expired admin sessions.`);

  // 3. Release stale RESERVED PromoCodeUsage records (>30 minutes old)
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const promoReservationsResult = await prisma.promoCodeUsage.deleteMany({
    where: {
      status: 'RESERVED',
      reservedAt: { lt: thirtyMinutesAgo },
    },
  });
  console.log(`[db-cleanup] Released ${promoReservationsResult.count} stale promo code reservations.`);

  // 4. Mark stale PENDING Checkout Orders as EXPIRED (>24 hours old)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const expiredOrdersResult = await prisma.checkoutOrder.updateMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: twentyFourHoursAgo },
    },
    data: {
      status: 'EXPIRED',
    },
  });
  console.log(`[db-cleanup] Marked ${expiredOrdersResult.count} stale pending checkout orders as EXPIRED.`);

  console.log('[db-cleanup] Database maintenance completed successfully.');

  return {
    deletedIdempotencyKeys: idempotencyResult.count,
    deletedAdminSessions: sessionResult.count,
    releasedPromoReservations: promoReservationsResult.count,
    expiredPendingOrders: expiredOrdersResult.count,
  };
}

// Allow direct execution: tsx scripts/db-cleanup.ts
if (require.main === module) {
  runDatabaseCleanup()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[db-cleanup] Maintenance script failed:', err);
      process.exit(1);
    });
}
