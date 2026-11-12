import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthorizedLessonPlayback, logMediaError } from '@/lib/mux-server';
import { requireAuthUser, handleApiError } from '@/lib/auth-policy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  try {
    const { slug, lessonId } = await params;

    // Optional user resolution (public previews don't require auth)
    let userId: string | undefined;
    let userRole: string | undefined;

    try {
      const dbUser = await requireAuthUser();
      userId = dbUser.id;
      userRole = dbUser.role;
    } catch {
      // Unauthenticated request — allowed only if preview lesson
    }

    const { config, reason } = await resolveAuthorizedLessonPlayback(slug, lessonId, userId, userRole);

    if (!config) {
      logMediaError(lessonId, new Error(reason || 'Playback unauthorized'), { courseId: slug, lessonId });
      return NextResponse.json({ error: reason || 'Playback unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ playbackConfig: config });
  } catch (error) {
    return handleApiError(error);
  }
}
