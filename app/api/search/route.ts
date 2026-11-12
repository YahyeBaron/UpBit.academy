import { NextRequest, NextResponse } from 'next/server';
import { searchCourses } from '@/lib/search/indexer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const level = searchParams.get('level') || undefined;
    const maxPriceParam = searchParams.get('maxPrice');
    const maxPrice = maxPriceParam ? Number(maxPriceParam) : undefined;
    const limit = Number(searchParams.get('limit') || '12');
    const offset = Number(searchParams.get('offset') || '0');

    const result = await searchCourses({
      query: q,
      level,
      maxPrice,
      limit,
      offset,
    });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error in /api/search:', error);
    return NextResponse.json(
      { error: 'Failed to search courses' },
      { status: 500 }
    );
  }
}
