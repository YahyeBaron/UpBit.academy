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
import { broadcastRealtimeEvent, realTimeChannels } from '@/lib/realtime';
import { trackServerEvent, ANALYTICS_EVENTS } from '@/lib/posthog';

// ─────────────────────────────────────────────
// GET /api/discussions?courseId=x&lessonId=y
// Returns course/lesson discussion threads and replies
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
      return NextResponse.json({ threads: [] });
    }

    const threads = await prisma.discussionThread.findMany({
      where: {
        courseId,
        ...(lessonId ? { lessonId } : {}),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, avatar: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ threads });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────────
// POST /api/discussions
// Creates a new discussion thread
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const dbUser = await requireAuthUser();

    const body = await req.json().catch(() => null);
    if (!body || !body.courseId || !body.title || !body.content) {
      return badRequestResponse('Missing required courseId, title, or content');
    }

    const { courseId, lessonId, title, content } = body;

    const sanitizedTitle = sanitizeText(title);
    const sanitizedContent = sanitizeText(content);

    if (!sanitizedTitle || !sanitizedContent) {
      return badRequestResponse('Title and content cannot be empty');
    }

    if (sanitizedTitle.length > 200 || sanitizedContent.length > 5000) {
      return badRequestResponse('Title or content exceeds maximum character limit');
    }

    await requireCourseAccess(dbUser.id, dbUser.role, courseId);

    if (lessonId) {
      await validateLessonRelationship(courseId, lessonId);
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        thread: {
          id: `mock-thread-${Date.now()}`,
          courseId,
          lessonId,
          userId: dbUser.id,
          title: sanitizedTitle,
          content: sanitizedContent,
          isPinned: false,
          isLocked: false,
          createdAt: new Date().toISOString(),
          user: { id: dbUser.id, name: dbUser.name, avatar: dbUser.avatar, role: dbUser.role },
          replies: [],
        },
      }, { status: 201 });
    }

    const thread = await prisma.discussionThread.create({
      data: {
        courseId,
        lessonId: lessonId || undefined,
        userId: dbUser.id,
        title: sanitizedTitle,
        content: sanitizedContent,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
        replies: true,
      },
    });

    // DB-First Broadcast via Pusher WebSockets
    await broadcastRealtimeEvent(
      realTimeChannels.course(courseId),
      'new-thread',
      { thread }
    );

    // Track thread creation in PostHog analytics
    await trackServerEvent(
      ANALYTICS_EVENTS.DISCUSSION_THREAD_CREATED,
      dbUser.id,
      { courseId, lessonId, threadId: thread.id, title: sanitizedTitle }
    );

    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────────
// DELETE /api/discussions?id=x
// Deletes a thread owned by current user or admin
// ─────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const dbUser = await requireAuthUser();

    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('id');
    if (!threadId) return badRequestResponse('Missing thread ID parameter');

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ message: 'Thread deleted' });
    }

    const existingThread = await prisma.discussionThread.findUnique({
      where: { id: threadId },
    });

    if (!existingThread) {
      return notFoundResponse('Discussion thread not found');
    }

    validateOwnership(existingThread.userId, dbUser.id, dbUser.role);

    await prisma.discussionThread.delete({
      where: { id: threadId },
    });

    return NextResponse.json({ message: 'Discussion thread deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
