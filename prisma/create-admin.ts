/**
 * create-admin.ts
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/create-admin.ts
 *
 * Creates or resets the Admin record used for the /admin portal login.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ADMIN_USERNAME = 'yahyebaron';
const ADMIN_EMAIL = 'admin@bitacademy.edu';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'EstAdmin2026!';

async function main() {
  console.log('🔐 Creating/resetting Super Admin account...\n');

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await prisma.admin.upsert({
    where: { username: ADMIN_USERNAME },
    update: {
      passwordHash,
      isActive: true,
      email: ADMIN_EMAIL,
    },
    create: {
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Admin account ready:\n');
  console.log(`   Username : ${ADMIN_USERNAME}`);
  console.log(`   Email    : ${ADMIN_EMAIL}`);
  console.log(`   Password : ${ADMIN_PASSWORD}`);
  console.log(`   ID       : ${admin.id}`);
  console.log(`\n🔗 Login at: http://localhost:3000/admin/login`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
