/**
 * Database Export & Backup Utility
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/backup-db.ts
 *
 * Exports JSON snapshots of core database entities to scratch/backups/
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function backupDatabase() {
  console.log('📦 Starting database backup export...\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'scratch', 'backups', `backup-${timestamp}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const [courses, users, enrollments, admins, promoCodes] = await Promise.all([
    prisma.course.findMany({ include: { curriculum: { include: { lessons: true } } } }),
    prisma.user.findMany(),
    prisma.enrollment.findMany(),
    prisma.admin.findMany({ select: { id: true, username: true, email: true, role: true, isActive: true, createdAt: true } }),
    prisma.promoCode.findMany(),
  ]);

  fs.writeFileSync(path.join(backupDir, 'courses.json'), JSON.stringify(courses, null, 2));
  fs.writeFileSync(path.join(backupDir, 'users.json'), JSON.stringify(users, null, 2));
  fs.writeFileSync(path.join(backupDir, 'enrollments.json'), JSON.stringify(enrollments, null, 2));
  fs.writeFileSync(path.join(backupDir, 'admins.json'), JSON.stringify(admins, null, 2));
  fs.writeFileSync(path.join(backupDir, 'promoCodes.json'), JSON.stringify(promoCodes, null, 2));

  console.log(`✅ Backup successfully created at: ${backupDir}`);
  console.log(`   - Courses     : ${courses.length}`);
  console.log(`   - Users       : ${users.length}`);
  console.log(`   - Enrollments : ${enrollments.length}`);
  console.log(`   - Admins      : ${admins.length}`);
  console.log(`   - Promo Codes : ${promoCodes.length}\n`);
}

backupDatabase()
  .catch((e) => {
    console.error('❌ Backup failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
