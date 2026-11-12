import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuthUser,
  requireCourseAccess,
  validateOwnership,
  handleApiError,
  badRequestResponse,
  notFoundResponse,
  forbiddenResponse,
} from '@/lib/auth-policy';
import { sanitizeText } from '@/lib/sanitize';
import { logger } from '@/lib/logger';
import { broadcastRealtimeEvent, realTimeChannels } from '@/lib/realtime';
import { trackServerEvent, ANALYTICS_EVENTS } from '@/lib/posthog';

// ─────────────────────────────────────────────
// POST /api/discussions/[threadId]/replies
// Create a reply to a discussion thread
// ─────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const dbUser = await requireAuthUser();
    const { threadId } = await params;

    const body = await req.json().catch(() => null);
    if (!body || !body.content) {
      return badRequestResponse('Reply content is required');
    }

    const sanitizedContent = sanitizeText(body.content);
    if (!sanitizedContent) {
      return badRequestResponse('Reply content cannot be empty');
    }

    if (sanitizedContent.length > 5000) {
      return badRequestResponse('Reply content exceeds maximum character limit (5000)');
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        reply: {
          id: `mock-reply-${Date.now()}`,
          threadId,
          userId: dbUser.id,
          content: sanitizedContent,
          createdAt: new Date().toISOString(),
          user: { id: dbUser.id, name: dbUser.name, avatar: dbUser.avatar, role: dbUser.role },
        },
      }, { status: 201 });
    }

    const thread = await prisma.discussionThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return notFoundResponse('Discussion thread not found');
    }

    if (thread.isLocked) {
      return forbiddenResponse('This discussion thread is locked and cannot receive new replies');
    }

    await requireCourseAccess(dbUser.id, dbUser.role, thread.courseId);

    const reply = await prisma.discussionReply.create({
      data: {
        threadId,
        userId: dbUser.id,
        content: sanitizedContent,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    // DB-First Broadcast via Pusher WebSockets
    await broadcastRealtimeEvent(
      realTimeChannels.thread(threadId),
      'new-reply',
      { reply }
    );

    // Track reply creation in PostHog analytics
    await trackServerEvent(
      ANALYTICS_EVENTS.DISCUSSION_REPLY_POSTED,
      dbUser.id,
      { threadId, courseId: thread.courseId, replyId: reply.id }
    );

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────────
// DELETE /api/discussions/[threadId]/replies?replyId=x
// Delete a reply owned by the current user or admin
// ─────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const dbUser = await requireAuthUser();
    const { threadId } = await params;

    const { searchParams } = new URL(req.url);
    const replyId = searchParams.get('replyId');
    if (!replyId) return badRequestResponse('Missing replyId parameter');

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ message: 'Reply deleted' });
    }

    const reply = await prisma.discussionReply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      return notFoundResponse('Reply not found');
    }

    // Verify reply belongs to the thread in the URL
    if (reply.threadId !== threadId) {
      logger.warn('Reply deletion rejected: thread mismatch', { replyId, threadId, userId: dbUser.id });
      return badRequestResponse('Reply does not belong to the specified thread');
    }

    validateOwnership(reply.userId, dbUser.id, dbUser.role);

    await prisma.discussionReply.delete({ where: { id: replyId } });

    return NextResponse.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
