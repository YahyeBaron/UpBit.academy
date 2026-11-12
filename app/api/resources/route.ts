import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuthUser,
  requireCourseAccess,
  validateLessonRelationship,
  validateOwnership,
  handleApiError,
  badRequestResponse,
  notFoundResponse,
  forbiddenResponse,
  AuthError,
} from '@/lib/auth-policy';
import { logger } from '@/lib/logger';
import { sanitizeText } from '@/lib/sanitize';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB hard limit

const ALLOWED_MIME_TYPES = new Set([
  // Documents
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-tar',
  'application/gzip',
  // Text / Code
  'text/plain',
  'text/html',
  'text/css',
  'text/javascript',
  'application/json',
  'application/xml',
  // Images
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Video (slide/demo resources, not Mux streams)
  'video/mp4',
  'video/webm',
  // Office documents
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Fallback
  'application/octet-stream',
]);

/**
 * Sanitizes a display filename for safe rendering.
 * Strips null bytes, path traversal, and control characters.
 */
function sanitizeFilename(raw: string): string {
  return raw
    .replace(/\0/g, '')
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '')
    .trim()
    .slice(0, 255);
}

/**
 * Only ADMIN and INSTRUCTOR roles may create or manage resources.
 */
function requireStaffRole(userRole: string) {
  if (userRole !== 'ADMIN' && userRole !== 'INSTRUCTOR') {
    throw new AuthError('Forbidden: Only instructors and admins can manage resources', 403);
  }
}

// ─────────────────────────────────────────────
// GET /api/resources?courseId=x&lessonId=y
// Returns resource metadata for enrolled users.
// Resource URLs are returned as-is (UploadThing CDN URLs).
// Private resources are gated behind enrollment check.
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const dbUser = await requireAuthUser();

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const lessonId = searchParams.get('lessonId');

    if (!courseId) {
      return badRequestResponse('Missing required courseId parameter');
    }

    await requireCourseAccess(dbUser.id, dbUser.role, courseId);

    if (lessonId) {
      await validateLessonRelationship(courseId, lessonId);
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ resources: [] });
    }

    const resources = await prisma.uploadedFile.findMany({
      where: {
        courseId,
        ...(lessonId ? { lessonId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        url: true,
        size: true,
        type: true,
        createdAt: true,
        lessonId: true,
        courseId: true,
        // Deliberately exclude `key` and `uploadedBy` from client response
      },
    });

    return NextResponse.json({ resources });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────────
// POST /api/resources
// Save uploaded resource metadata.
// Restricted to INSTRUCTOR and ADMIN roles.
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const dbUser = await requireAuthUser();

    // Restrict resource creation to staff roles only
    requireStaffRole(dbUser.role);

    const body = await req.json().catch(() => null);
    if (!body) return badRequestResponse('Invalid JSON payload');

    const { courseId, lessonId, key, url, name, size, type } = body;

    // Required field validation
    if (!url || !name || !courseId || !key) {
      return badRequestResponse('Missing required fields: courseId, url, key, and name are required');
    }

    // MIME type validation
    const mimeType = (type || 'application/octet-stream').toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      logger.warn('Resource upload rejected: unsupported MIME type', { mimeType, courseId });
      return badRequestResponse(`File type '${mimeType}' is not permitted for course resources`);
    }

    // File size validation
    const fileSize = typeof size === 'number' ? size : 0;
    if (fileSize > MAX_FILE_SIZE_BYTES) {
      return badRequestResponse(`File size exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB limit`);
    }

    // Filename sanitization
    const safeName = sanitizeFilename(sanitizeText(name));
    if (!safeName || safeName.length < 1) {
      return badRequestResponse('Invalid or empty filename provided');
    }

    // Course & lesson relationship verification
    await requireCourseAccess(dbUser.id, dbUser.role, courseId);
    if (lessonId) {
      await validateLessonRelationship(courseId, lessonId);
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          resource: {
            id: key,
            courseId,
            lessonId: lessonId || null,
            key,
            url,
            name: safeName,
            size: fileSize,
            type: mimeType,
            createdAt: new Date().toISOString(),
          },
        },
        { status: 201 }
      );
    }

    const resource = await prisma.uploadedFile.upsert({
      where: { key },
      update: {
        courseId,
        lessonId: lessonId || undefined,
        name: safeName,
        size: fileSize,
        type: mimeType,
      },
      create: {
        courseId,
        lessonId: lessonId || undefined,
        key,
        url,
        name: safeName,
        size: fileSize,
        type: mimeType,
        uploadedBy: dbUser.id,
        userId: dbUser.id,
      },
    });

    logger.info('Resource uploaded', { courseId, lessonId, name: safeName, uploadedBy: dbUser.id });

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────────
// DELETE /api/resources
// Delete an uploaded resource.
// Requires: resource ID + courseId (never by ID alone).
// Restricted to owner + course staff verification.
// ─────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const dbUser = await requireAuthUser();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const courseId = searchParams.get('courseId');

    if (!id) return badRequestResponse('Missing resource ID parameter');
    if (!courseId) return badRequestResponse('Missing courseId parameter — deletion requires course context');

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ message: 'Resource deleted' });
    }

    // Fetch and validate: the resource must belong to the specified course
    const existingFile = await prisma.uploadedFile.findUnique({
      where: { id },
    });

    if (!existingFile) {
      return notFoundResponse('Resource file not found');
    }

    // Verify the resource actually belongs to the courseId in the request
    if (existingFile.courseId !== courseId) {
      logger.warn('Resource deletion rejected: course mismatch', {
        resourceId: id,
        requestedCourseId: courseId,
        actualCourseId: existingFile.courseId,
        requestedBy: dbUser.id,
      });
      return forbiddenResponse('Resource does not belong to the specified course');
    }

    // Verify ownership or staff role
    validateOwnership(existingFile.userId, dbUser.id, dbUser.role);

    await prisma.uploadedFile.delete({
      where: { id },
    });

    logger.info('Resource deleted', { resourceId: id, courseId, deletedBy: dbUser.id });

    return NextResponse.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
