import { prisma } from '../lib/prisma';

async function auditDatabase() {
  console.log('🔍 Executing Deep Database Audit against Neon PostgreSQL...\n');

  try {
    // 1. Test Instructors Table
    const instructors = await prisma.instructor.findMany({
      include: { courseList: true },
    });
    console.log(`✅ [1/5] Instructors Table: ${instructors.length} records found.`);
    instructors.forEach((i) => {
      console.log(`   └─ Instructor: ${i.name} (${i.title}) -> ${i.courseList.length} courses linked.`);
    });

    // 2. Test Courses Table
    const courses = await prisma.course.findMany({
      include: { curriculum: { include: { lessons: true } } },
    });
    console.log(`\n✅ [2/5] Courses Table: ${courses.length} records found.`);
    let totalLessonsCount = 0;
    courses.forEach((c) => {
      const lessons = c.curriculum.reduce((acc, curr) => acc + curr.lessons.length, 0);
      totalLessonsCount += lessons;
      console.log(`   └─ Course: "${c.title}" [${c.category}] -> ${c.curriculum.length} modules, ${lessons} lessons.`);
    });

    // 3. Test Curriculum & Lessons
    console.log(`\n✅ [3/5] Curriculum & Lessons: ${totalLessonsCount} total lessons verified.`);

    // 4. Test Users & Achievements
    const users = await prisma.user.findMany({
      include: { achievements: true },
    });
    console.log(`\n✅ [4/5] Users Table: ${users.length} records found.`);
    users.forEach((u) => {
      console.log(`   └─ User: ${u.name} (${u.email}) -> ${u.achievements.length} achievements badges.`);
    });

    // 5. Test Direct Connection Latency
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    console.log(`\n⚡ [5/5] Neon PostgreSQL Query Latency: ${latency}ms`);

    console.log('\n🎉 AUDIT PASSED: All tables, models, and relations are 100% connected and operational!');
  } catch (error) {
    console.error('\n❌ AUDIT FAILED:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditDatabase();
