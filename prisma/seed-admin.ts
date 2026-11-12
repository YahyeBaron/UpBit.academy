import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plainPassword = process.env.ADMIN_PASSWORD || 'YahyeBaron-123';
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { username: 'yahyebaron' },
    update: {
      passwordHash,
      isActive: true,
    },
    create: {
      username: 'yahyebaron',
      email: 'yahyebaron@bitacademy.edu',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`✅ Admin user "${admin.username}" seeded successfully.`);
}

main()
  .catch((e) => {
    console.error('❌ Admin seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
