import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { auth } from '@clerk/nextjs/server';
import { getCurrentDbUserAsync } from '@/lib/db-data';
import { prisma } from '@/lib/prisma';

const f = createUploadthing();

// ─────────────────────────────────────────────
// BIT Academy UploadThing File Router
// ─────────────────────────────────────────────
export const ourFileRouter = {
  // Profile avatar uploader — any authenticated user
  avatarUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new Error('Unauthorized');
      const dbUser = await getCurrentDbUserAsync();
      if (!dbUser) throw new Error('User record not found');
      return { dbUserId: dbUser.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Update user avatar in Neon DB
      await prisma.user.update({
        where: { id: metadata.dbUserId },
        data: { avatar: file.ufsUrl ?? file.url },
      });

      // Store the upload record
      await prisma.uploadedFile.create({
        data: {
          userId: metadata.dbUserId,
          uploadedBy: metadata.dbUserId,
          key: file.key,
          url: file.ufsUrl ?? file.url,
          name: file.name,
          size: file.size,
          type: 'image/*',
        },
      });

      return { uploadedBy: metadata.dbUserId, url: file.ufsUrl ?? file.url };
    }),

  // Course resource uploader — any authenticated user (instructors attach to lessons)
  courseResourceUploader: f({
    pdf: { maxFileSize: '32MB', maxFileCount: 5 },
    'application/zip': { maxFileSize: '32MB', maxFileCount: 5 },
    text: { maxFileSize: '4MB', maxFileCount: 5 },
    image: { maxFileSize: '8MB', maxFileCount: 5 },
  })
    .middleware(async ({ req }) => {
      const { userId } = await auth();
      if (!userId) throw new Error('Unauthorized');
      const dbUser = await getCurrentDbUserAsync();
      if (!dbUser) throw new Error('User record not found');

      // Read courseId and lessonId from request headers
      const courseId = req.headers.get('x-course-id') ?? undefined;
      const lessonId = req.headers.get('x-lesson-id') ?? undefined;

      return { dbUserId: dbUser.id, courseId, lessonId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Resolve lessonId — it must exist in DB if provided
      let resolvedLessonId: string | undefined = metadata.lessonId;
      if (resolvedLessonId) {
        const lessonExists = await prisma.lesson.findUnique({
          where: { id: resolvedLessonId },
          select: { id: true },
        });
        if (!lessonExists) resolvedLessonId = undefined;
      }

      await prisma.uploadedFile.create({
        data: {
          userId: metadata.dbUserId,
          uploadedBy: metadata.dbUserId,
          key: file.key,
          url: file.ufsUrl ?? file.url,
          name: file.name,
          size: file.size,
          type: file.type ?? 'application/octet-stream',
          courseId: metadata.courseId ?? undefined,
          lessonId: resolvedLessonId ?? undefined,
        },
      });

      return {
        uploadedBy: metadata.dbUserId,
        url: file.ufsUrl ?? file.url,
        name: file.name,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
