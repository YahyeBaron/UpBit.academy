/**
 * scripts/sync-search-index.ts
 *
 * One-shot script: Seeds the Meilisearch courses index from Neon/Prisma.
 * Run after deploying or when the search index is stale.
 *
 * Usage:
 *   pnpm tsx scripts/sync-search-index.ts
 *
 * Prerequisites:
 *   - MEILISEARCH_URL and MEILISEARCH_MASTER_KEY set in .env
 *   - DATABASE_URL set in .env
 */

import 'dotenv/config';
import { syncAllCourses } from '../lib/search/indexer';

async function main() {
  console.log('🔍 Meilisearch course index sync starting...');
  console.log(`   Host: ${process.env.MEILISEARCH_URL || 'http://localhost:7700'}`);

  const result = await syncAllCourses();

  if (result.success) {
    console.log(`✅ Sync complete — ${result.syncedCount} courses indexed.`);
    if (result.task) {
      console.log(`   Task UID: ${(result.task as any).taskUid ?? 'n/a'}`);
    }
  } else {
    console.error('❌ Sync failed:', result.error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error during search index sync:', err);
  process.exit(1);
});
