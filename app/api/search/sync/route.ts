import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { syncAllCourses } from '@/lib/search/indexer';

export async function POST(request: NextRequest) {
  try {
    // Check either admin session or bearer secret token for cron/CI
    const authHeader = request.headers.get('authorization');
    const secret = process.env.CRON_SECRET || process.env.ADMIN_API_KEY;
    const isSecretValid = secret && authHeader === `Bearer ${secret}`;

    if (!isSecretValid) {
      const admin = await getAdminSession();
      if (!admin) {
        return NextResponse.json(
          { error: 'Unauthorized: Admin access required' },
          { status: 401 }
        );
      }
    }

    const result = await syncAllCourses();

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    console.error('Error in /api/search/sync:', error);
    return NextResponse.json(
      { error: 'Failed to sync search index' },
      { status: 500 }
    );
  }
}
