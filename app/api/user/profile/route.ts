import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getCurrentDbUserAsync } from '@/lib/db-data';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await getCurrentDbUserAsync();
    if (!dbUser) {
      return NextResponse.json({ error: 'User record not found' }, { status: 404 });
    }

    const { name, avatar } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        ...(name ? { name } : {}),
        ...(avatar ? { avatar } : {}),
      },
    });

    return NextResponse.json({ message: 'Profile updated successfully', user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error('Error updating user profile in Neon DB:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
