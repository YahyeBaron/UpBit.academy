import { PrismaClient } from '@prisma/client';
import { INSTRUCTORS, COURSES, MOCK_STUDENT } from '../lib/data';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting BIT Academy database seed...');

  // 1. Seed Instructors
  for (const instructor of INSTRUCTORS) {
    await prisma.instructor.upsert({
      where: { id: instructor.id },
      update: {},
      create: {
        id: instructor.id,
        name: instructor.name,
        title: instructor.title,
        bio: instructor.bio,
        avatar: instructor.avatar,
        cover: instructor.cover,
        rating: instructor.rating,
        reviews: instructor.reviews,
        students: instructor.students,
        courses: instructor.courses,
        expertise: instructor.expertise,
        github: instructor.social.github,
        twitter: instructor.social.twitter,
        linkedin: instructor.social.linkedin,
      },
    });
  }
  console.log('✅ Instructors seeded');

  // 2. Seed Courses with Curriculum & Lessons (Mux & non-Mux lessons)
  for (const course of COURSES) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      update: {},
      create: {
        slug: course.slug,
        title: course.title,
        tagline: course.tagline,
        category: course.category,
        image: course.image,
        description: course.description,
        longDescription: course.longDescription,
        instructorId: course.instructorId,
        instructors: course.instructors,
        rating: course.rating,
        reviews: course.reviews,
        students: course.students,
        duration: course.duration,
        totalLessons: course.totalLessons,
        level: course.level,
        price: course.price,
        originalPrice: course.originalPrice,
        tags: course.tags,
        lastUpdated: course.lastUpdated,
        includes: course.includes,
        whatYouLearn: course.whatYouLearn,
        hasCertificate: course.hasCertificate ?? true,
        totalHours: course.totalHours ?? 0,
        completionCriteria: course.completionCriteria ?? 'Complete all lessons and knowledge checks to earn your certificate.',
        curriculum: {
          create: course.curriculum.map((section, sIdx) => ({
            title: section.title,
            order: sIdx,
            lessons: {
              create: section.lessons.map((lesson, lIdx) => ({
                id: lesson.id,
                title: lesson.title,
                duration: lesson.duration,
                type: lesson.type,
                preview: lesson.preview ?? false,
                order: lIdx,
                muxPlaybackId: lesson.muxPlaybackId,
              })),
            },
          })),
        },
      },
    });
  }
  console.log('✅ Courses & Curriculum seeded');

  // 3. Seed Mock Student User
  const studentUser = await prisma.user.upsert({
    where: { email: MOCK_STUDENT.email },
    update: {},
    create: {
      name: MOCK_STUDENT.name,
      email: MOCK_STUDENT.email,
      avatar: MOCK_STUDENT.avatar,
      role: 'student',
      joinedDate: MOCK_STUDENT.joinedDate,
    },
  });

  // 4. Seed YahyeBaron Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'yahyebaron@bitacademy.edu' },
    update: { role: 'ADMIN' },
    create: {
      name: 'YahyeBaron-123',
      email: 'yahyebaron@bitacademy.edu',
      avatar: '/assets/w-rc.jpg',
      role: 'ADMIN',
      joinedDate: 'January 2026',
    },
  });
  console.log('✅ Users & Admin seeded');

  // 5. Seed Paid Enrollment for Mock Student
  const firstCourseSlug = COURSES[0].slug;
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: studentUser.id, courseId: firstCourseSlug } },
    update: { paymentStatus: 'COMPLETED' },
    create: {
      userId: studentUser.id,
      courseId: firstCourseSlug,
      progress: 25,
      paymentStatus: 'COMPLETED',
      amountPaid: COURSES[0].price,
    },
  });
  console.log('✅ Enrollment seeded');

  // 6. Seed Sample Lesson Progress (with position & completion audit)
  const firstLessonId = COURSES[0].curriculum[0]?.lessons[0]?.id;
  if (firstLessonId) {
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: studentUser.id, lessonId: firstLessonId } },
      update: {},
      create: {
        userId: studentUser.id,
        lessonId: firstLessonId,
        courseId: firstCourseSlug,
        completed: true,
        watchedPct: 100,
        lastPositionSeconds: 300,
        durationSeconds: 300,
        completedAt: new Date(),
      },
    });

    // 7. Seed Sample Timestamped Note
    await prisma.note.create({
      data: {
        userId: studentUser.id,
        courseId: firstCourseSlug,
        lessonId: firstLessonId,
        content: 'Remember to practice setting up the App Router layout file.',
        videoTime: 120,
      },
    }).catch(() => {});

    // 8. Seed Sample Resource File
    await prisma.uploadedFile.create({
      data: {
        userId: adminUser.id,
        uploadedBy: adminUser.id,
        courseId: firstCourseSlug,
        lessonId: firstLessonId,
        key: `starter-code-${firstCourseSlug}.zip`,
        url: 'https://utfs.io/f/sample-starter-code.zip',
        name: 'Lesson-1-Starter-Code.zip',
        size: 1024 * 500,
        type: 'application/zip',
      },
    }).catch(() => {});

    // 9. Seed Sample Discussion Thread and Reply
    const thread = await prisma.discussionThread.create({
      data: {
        courseId: firstCourseSlug,
        lessonId: firstLessonId,
        userId: studentUser.id,
        title: 'How does layout streaming work under the hood in Next.js 15?',
        content: 'I noticed loading.tsx wraps the page automatically in a React Suspense boundary.',
      },
    }).catch(() => null);

    if (thread) {
      await prisma.discussionReply.create({
        data: {
          threadId: thread.id,
          userId: adminUser.id,
          content: 'That is correct! loading.tsx automatically wraps page.tsx in Suspense.',
        },
      }).catch(() => {});
    }
    console.log('✅ Notes, Resources, & Discussions seeded');
  }

  console.log('🎉 BIT Academy database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
