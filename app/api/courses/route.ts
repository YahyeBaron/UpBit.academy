import { NextResponse } from 'next/server';
import { getCoursesAsync } from '@/lib/db-data';

export async function GET() {
  try {
    const courses = await getCoursesAsync();
    return NextResponse.json({ courses });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch courses from database', details: String(error) },
      { status: 500 }
    );
  }
}
