import { auth } from '@clerk/nextjs/server';
import { getCurrentDbUserAsync } from '@/lib/db-data';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

import { getAdminSession } from '@/lib/admin-auth';

/**
 * Requires an authenticated Clerk user and resolves their internal DB User record.
 */
export async function requireAuthUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new AuthError('Unauthorized: Please sign in', 401);
  }

  const dbUser = await getCurrentDbUserAsync();
  if (!dbUser) {
    throw new AuthError('Unauthorized: User record not found', 404);
  }

  return dbUser;
}

/**
 * Requires either an active Admin session or an authenticated Clerk user with ADMIN or INSTRUCTOR role.
 * Throws AuthError(401) if not authenticated, or AuthError(403) if not authorized.
 */
export async function requireStaffOrAdmin() {
  const admin = await getAdminSession();
  if (admin && admin.isActive) {
    return { admin, isDatabaseAdmin: true, role: admin.role, id: admin.id };
  }

  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new AuthError('Unauthorized: Admin session or sign-in required', 401);
  }

  const dbUser = await getCurrentDbUserAsync();
  if (!dbUser) {
    throw new AuthError('Forbidden: User record not found', 403);
  }

  if (dbUser.role !== 'ADMIN' && dbUser.role !== 'INSTRUCTOR') {
    throw new AuthError('Forbidden: Administrator or Instructor role required', 403);
  }

  return { user: dbUser, isDatabaseAdmin: false, role: dbUser.role, id: dbUser.id };
}

/**
 * Requires an active Admin session or Clerk user with ADMIN role.
 * Throws AuthError(401) if not authenticated, or AuthError(403) if not ADMIN.
 */
export async function requireAdminOnly() {
  const admin = await getAdminSession();
  if (admin && admin.isActive) {
    if (admin.role !== 'SUPER_ADMIN' && admin.role !== 'ADMIN') {
      throw new AuthError('Forbidden: Administrator role required', 403);
    }
    return { admin, isDatabaseAdmin: true, role: admin.role, id: admin.id };
  }

  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new AuthError('Unauthorized: Admin session or sign-in required', 401);
  }

  const dbUser = await getCurrentDbUserAsync();
  if (!dbUser || dbUser.role !== 'ADMIN') {
    throw new AuthError('Forbidden: Administrator role required', 403);
  }

  return { user: dbUser, isDatabaseAdmin: false, role: dbUser.role, id: dbUser.id };
}

import { checkEnrollment } from '@/lib/payments/service';
export { checkEnrollment };

/**
 * Checks active paid enrollment for a course.
 * Enforces paymentStatus === 'COMPLETED' (from Enrollment model enum).
 * Applies intentional Admin & Instructor role bypass.
 */
export async function requireCourseAccess(userId: string, userRole: string, courseSlug: string) {
  // Intentional Admin / Instructor bypass
  if (userRole === 'ADMIN' || userRole === 'INSTRUCTOR') {
    return { isPrivileged: true, hasAccess: true };
  }

  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
      // FAIL CLOSED in production: no DB = no access. Never silently grant access.
      logger.error('requireCourseAccess: DATABASE_URL is missing in production', { userId, courseSlug });
      throw new AuthError('Service unavailable: enrollment system is offline', 503);
    }
    // Development/test only — allow with loud warning so developers notice
    logger.warn('[DEV ONLY] Course access check bypassed: DATABASE_URL not set', { userId, courseSlug });
    return { isPrivileged: false, hasAccess: true };
  }

  const check = await checkEnrollment(userId, courseSlug);
  if (!check.isEnrolled) {
    logger.warn('Access denied: active paid enrollment required', { userId, courseSlug, reason: check.reason });
    throw new AuthError(
      'Forbidden: You must be enrolled in this course to access protected materials',
      403
    );
  }

  return { isPrivileged: false, hasAccess: true, progress: check.enrollment?.progress ?? 0 };
}

/**
 * Resolves a course by its slug and validates that it exists and is published.
 */
export async function resolveCourseBySlug(courseSlug: string) {
  if (!process.env.DATABASE_URL) {
    return { slug: courseSlug, title: courseSlug };
  }

  const course = await prisma.course.findUnique({
    where: { slug: courseSlug, isDeleted: false },
    select: {
      slug: true,
      title: true,
      isPublished: true,
      price: true,
    },
  });

  if (!course) {
    throw new AuthError(`Course '${courseSlug}' not found`, 404);
  }

  return course;
}

/**
 * Verifies that a lesson belongs to the specified course section.
 * Rejects mismatched courseId / lessonId combinations (400 Bad Request).
 */
export async function validateLessonRelationship(courseSlug: string, lessonId: string) {
  if (!process.env.DATABASE_URL) return true;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      section: {
        select: { courseId: true },
      },
    },
  });

  if (!lesson) {
    throw new AuthError(`Lesson '${lessonId}' not found`, 404);
  }

  if (lesson.section.courseId !== courseSlug) {
    logger.warn('Mismatched course/lesson relationship rejected', {
      lessonId,
      requestedCourseSlug: courseSlug,
      actualCourseSlug: lesson.section.courseId,
    });
    throw new AuthError(
      `Lesson '${lessonId}' does not belong to course '${courseSlug}'`,
      400
    );
  }

  return true;
}

/**
 * Verifies resource or note ownership.
 * Allows Admin and Instructor bypass. Throws 403 if unauthorized.
 */
export function validateOwnership(
  entityUserId: string,
  currentUserId: string,
  currentUserRole: string
) {
  if (currentUserRole === 'ADMIN' || currentUserRole === 'INSTRUCTOR') {
    return true;
  }

  if (entityUserId !== currentUserId) {
    logger.warn('IDOR attempt or unauthorized access blocked', {
      entityUserId,
      currentUserId,
      currentUserRole,
    });
    throw new AuthError('Forbidden: You do not own this resource', 403);
  }

  return true;
}

/**
 * Validates that an entity (note/resource/thread) belongs to both course and lesson.
 * Rejects entity mismatch across courses or lessons.
 */
export function validateEntityBelongsToCourseAndLesson(
  entity: { courseId?: string | null; lessonId?: string | null },
  expectedCourseSlug: string,
  expectedLessonId?: string
) {
  if (entity.courseId && entity.courseId !== expectedCourseSlug) {
    throw new AuthError(
      `Resource or note is attached to course '${entity.courseId}', not '${expectedCourseSlug}'`,
      400
    );
  }

  if (expectedLessonId && entity.lessonId && entity.lessonId !== expectedLessonId) {
    throw new AuthError(
      `Resource or note is attached to lesson '${entity.lessonId}', not '${expectedLessonId}'`,
      400
    );
  }

  return true;
}

export async function authorizeNoteAccess(userId: string, userRole: string, noteId: string) {
  if (!process.env.DATABASE_URL) return null;
  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note) throw new AuthError('Note not found', 404);
  validateOwnership(note.userId, userId, userRole);
  return note;
}

export async function authorizeThreadAccess(userId: string, userRole: string, threadId: string) {
  if (!process.env.DATABASE_URL) return null;
  const thread = await prisma.discussionThread.findUnique({ where: { id: threadId } });
  if (!thread) throw new AuthError('Discussion thread not found', 404);
  await requireCourseAccess(userId, userRole, thread.courseId);
  return thread;
}

export async function authorizeCertificateAccess(userId: string, userRole: string, courseSlug: string) {
  await requireCourseAccess(userId, userRole, courseSlug);
  if (!process.env.DATABASE_URL) return null;
  const cert = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId, courseId: courseSlug } },
  });
  return cert;
}

// ─────────────────────────────────────────────
// STANDARDIZED API RESPONSE HELPERS & NO-STORE CACHE HEADERS
// ─────────────────────────────────────────────

export const PRIVATE_CACHE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export function privateJsonResponse(data: any, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  Object.entries(PRIVATE_CACHE_HEADERS).forEach(([k, v]) => headers.set(k, v));
  return NextResponse.json(data, { ...init, headers });
}

export function unauthorizedResponse(message = 'Unauthorized: Sign in required') {
  return privateJsonResponse({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = 'Forbidden: Access denied') {
  return privateJsonResponse({ error: message }, { status: 403 });
}

export function notFoundResponse(message = 'Resource not found') {
  return privateJsonResponse({ error: message }, { status: 404 });
}

export function badRequestResponse(message = 'Invalid request parameters') {
  return privateJsonResponse({ error: message }, { status: 400 });
}

export function conflictResponse(message = 'State conflict') {
  return privateJsonResponse({ error: message }, { status: 409 });
}

export function serverErrorResponse(message = 'An unexpected server error occurred', error?: any) {
  logger.error(message, error);
  return privateJsonResponse({ error: message }, { status: 500 });
}

export function handleApiError(error: any) {
  if (error instanceof AuthError) {
    return privateJsonResponse({ error: error.message }, { status: error.statusCode });
  }

  if (error instanceof ZodError) {
    const errorMsg =
      error.issues?.map((i) => `${i.path.length ? i.path.join('.') + ': ' : ''}${i.message}`).join(', ') ||
      'Validation failed';
    return privateJsonResponse({ error: errorMsg, details: error.issues }, { status: 400 });
  }

  if (
    error?.code === 'P1001' ||
    error?.message?.includes("Can't reach database server") ||
    error?.name === 'PrismaClientInitializationError'
  ) {
    logger.error('Database connection error in API handler', error);
    return privateJsonResponse(
      {
        error:
          'Database is temporarily unreachable. Neon database may be suspended or waking up. Please retry in a moment.',
      },
      { status: 503 }
    );
  }

  logger.error('Unhandled API exception', error);
  const isDev = process.env.NODE_ENV !== 'production';
  return privateJsonResponse(
    { error: isDev && error?.message ? error.message : 'An internal server error occurred' },
    { status: 500 }
  );
}
