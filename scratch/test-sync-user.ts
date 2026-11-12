import { prisma } from '../lib/prisma';

async function checkUsersInDb() {
  console.log('🔍 Checking Users Table in Neon PostgreSQL...\n');
  try {
    const users = await prisma.user.findMany({
      include: { achievements: true, enrollments: true },
    });
    console.log(`✅ Total Users in Database: ${users.length}`);
    users.forEach((u, idx) => {
      console.log(`   [${idx + 1}] ID: ${u.id} | Name: "${u.name}" | Email: "${u.email}" | ClerkID: ${u.clerkId || 'None'}`);
    });
  } catch (err) {
    console.error('❌ Error checking users table:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsersInDb();
