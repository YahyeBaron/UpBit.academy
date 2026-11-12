import { NextResponse } from 'next/server';
import { getCourseAsync } from '@/lib/db-data';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const course = await getCourseAsync(slug);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    return NextResponse.json({ course });
  } catch (error: any) {
    console.error('Error fetching public course:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch course' }, { status: 500 });
  }
}
