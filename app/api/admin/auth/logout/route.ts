import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { clearAdminSessionCache, ADMIN_COOKIE_OPTIONS } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_OPTIONS.name)?.value;

    if (token) {
      // 1. Invalidate in-memory cache
      clearAdminSessionCache(token);

      // 2. Invalidate in database
      try {
        await prisma.adminSession.deleteMany({
          where: { token },
        });
      } catch (dbErr) {
        console.warn('[Admin Logout] Failed to delete session from DB:', dbErr);
      }
    }

    // 3. Clear cookie
    cookieStore.delete(ADMIN_COOKIE_OPTIONS.name);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Logout] Error during logout:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
