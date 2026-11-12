import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOnly, handleApiError, notFoundResponse, badRequestResponse } from '@/lib/auth-policy';
import { UserRoleUpdateSchema } from '@/lib/validation-schemas';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOnly();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: { course: { select: { slug: true, title: true, price: true } } },
          orderBy: { enrolledAt: 'desc' },
        },
        _count: { select: { notes: true, lessonProgress: true } },
      },
    });

    if (!user) {
      return notFoundResponse('User not found');
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOnly();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) {
      return badRequestResponse('Invalid JSON payload');
    }

    let roleToUpdate: string | undefined = undefined;
    if (body.role !== undefined) {
      const normalizedRole = String(body.role).toUpperCase();
      const parsed = UserRoleUpdateSchema.safeParse({ role: normalizedRole });
      if (!parsed.success) {
        return badRequestResponse('Invalid role value. Must be STUDENT, INSTRUCTOR, or ADMIN');
      }
      roleToUpdate = parsed.data.role;
    }

    const nameToUpdate = body.name !== undefined ? String(body.name).trim().slice(0, 100) : undefined;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(roleToUpdate !== undefined ? { role: roleToUpdate } : {}),
        ...(nameToUpdate !== undefined ? { name: nameToUpdate } : {}),
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ user: updated, message: 'User updated successfully' });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const caller = await requireAdminOnly();
    const { id } = await params;

    if (caller.id === id) {
      return badRequestResponse('You cannot delete your own administrative account.');
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, clerkId: true, role: true },
    });

    if (!user) {
      return notFoundResponse('User not found');
    }

    if (user.role === 'ADMIN' && caller.role !== 'SUPER_ADMIN') {
      return badRequestResponse('Only a Super Administrator can delete another administrator account.');
    }

    // 1. Delete from Clerk Authentication if clerkId is set
    if (user.clerkId && process.env.CLERK_SECRET_KEY) {
      try {
        const { clerkClient } = await import('@clerk/nextjs/server');
        const client = await clerkClient();
        await client.users.deleteUser(user.clerkId);
      } catch (clerkErr) {
        console.warn(`[Clerk Delete Warning] Could not delete Clerk user ${user.clerkId}:`, clerkErr);
      }
    }

    // 2. Perform atomic cascading delete of all user-dependent records
    await prisma.$transaction(async (tx) => {
      await tx.note.deleteMany({ where: { userId: id } });
      await tx.lessonProgress.deleteMany({ where: { userId: id } });
      await tx.discussionReply.deleteMany({ where: { userId: id } });
      await tx.discussionThread.deleteMany({ where: { userId: id } });
      await tx.quizAttempt.deleteMany({ where: { userId: id } });
      await tx.achievement.deleteMany({ where: { userId: id } });
      await tx.certificate.deleteMany({ where: { userId: id } });
      await tx.uploadedFile.deleteMany({ where: { userId: id } });
      await tx.promoCodeUsage.deleteMany({ where: { userId: id } });
      await tx.enrollment.deleteMany({ where: { userId: id } });
      await tx.checkoutOrder.deleteMany({ where: { userId: id } });
      await tx.courseWaitlist.deleteMany({ where: { userId: id } });

      await tx.user.delete({ where: { id } });
    });

    return NextResponse.json({
      success: true,
      message: `User ${user.email} and all associated data have been permanently deleted.`,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

