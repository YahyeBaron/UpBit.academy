import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INSTRUCTORS } from '@/lib/data';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ instructors: INSTRUCTORS });
    }
    const instructors = await prisma.instructor.findMany({
      include: {
        courseList: {
          select: {
            slug: true,
            title: true,
            price: true,
            image: true,
          },
        },
      },
    });
    return NextResponse.json({ instructors });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch instructors from database', details: String(error) },
      { status: 500 }
    );
  }
}
