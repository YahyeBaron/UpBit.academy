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
} from '@/lib/auth-policy';
import { sanitizeText } from '@/lib/sanitize';

// ─────────────────────────────────────────────
// GET /api/notes?lessonId=x&courseId=y
// Returns notes for current user on a specific course lesson
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const dbUser = await requireAuthUser();

    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get('lessonId');
    const courseId = searchParams.get('courseId');

    if (!lessonId || !courseId) {
      return badRequestResponse('Missing required lessonId or courseId parameter');
    }

    await requireCourseAccess(dbUser.id, dbUser.role, courseId);
    await validateLessonRelationship(courseId, lessonId);

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ notes: [] });
    }

    const notes = await prisma.note.findMany({
      where: { userId: dbUser.id, lessonId, courseId },
      orderBy: { videoTime: 'asc' },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────────
// POST /api/notes
// Creates a new timestamped note
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const dbUser = await requireAuthUser();

    const body = await req.json().catch(() => null);
    if (!body) return badRequestResponse('Invalid JSON body');

    const { lessonId, courseId, content, videoTime } = body;

    const sanitizedContent = sanitizeText(content);
    if (!lessonId || !courseId || !sanitizedContent) {
      return badRequestResponse('Valid lessonId, courseId, and note content are required');
    }

    if (sanitizedContent.length > 5000) {
      return badRequestResponse('Note content exceeds maximum length of 5000 characters');
    }

    await requireCourseAccess(dbUser.id, dbUser.role, courseId);
    await validateLessonRelationship(courseId, lessonId);

    const rawTime = typeof videoTime === 'number' ? videoTime : 0;
    const cleanTime = Math.max(0, Math.round(isFinite(rawTime) ? rawTime : 0));

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        note: {
          id: `mock-note-${Date.now()}`,
          userId: dbUser.id,
          lessonId,
          courseId,
          content: sanitizedContent,
          videoTime: cleanTime,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }, { status: 201 });
    }

    const note = await prisma.note.create({
      data: {
        userId: dbUser.id,
        lessonId,
        courseId,
        content: sanitizedContent,
        videoTime: cleanTime,
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────────
// PATCH /api/notes
// Updates an existing note owned by current user
// ─────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const dbUser = await requireAuthUser();

    const body = await req.json().catch(() => null);
    if (!body || !body.id) return badRequestResponse('Note ID is required');

    const { id, content, videoTime } = body;

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ message: 'Note updated' });
    }

    const existingNote = await prisma.note.findUnique({
      where: { id },
    });

    if (!existingNote) {
      return notFoundResponse('Note not found');
    }

    validateOwnership(existingNote.userId, dbUser.id, dbUser.role);

    const sanitizedContent = content ? sanitizeText(content) : existingNote.content;
    if (sanitizedContent.length > 5000) {
      return badRequestResponse('Note content exceeds maximum length of 5000 characters');
    }

    const cleanTime = typeof videoTime === 'number' && isFinite(videoTime) && videoTime >= 0
      ? Math.round(videoTime)
      : existingNote.videoTime;

    const note = await prisma.note.update({
      where: { id },
      data: {
        content: sanitizedContent,
        videoTime: cleanTime,
      },
    });

    return NextResponse.json({ note });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────────
// DELETE /api/notes?id=noteId
// Deletes a note owned by current user
// ─────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const dbUser = await requireAuthUser();

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get('id');
    if (!noteId) return badRequestResponse('Missing note id parameter');

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ message: 'Note deleted' });
    }

    const existingNote = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!existingNote) {
      return notFoundResponse('Note not found');
    }

    validateOwnership(existingNote.userId, dbUser.id, dbUser.role);

    await prisma.note.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
