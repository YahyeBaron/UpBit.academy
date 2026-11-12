import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCurrentDbUserAsync } from '@/lib/db-data';
import { prisma } from '@/lib/prisma';
import { checkEnrollment } from '@/lib/payments/service';

export const dynamic = 'force-dynamic';

interface LearnLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function LearnLayout({ children, params }: LearnLayoutProps) {
  const { slug } = await params;

  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  // Get authenticated DB user
  const dbUser = await getCurrentDbUserAsync();

  if (!dbUser) {
    redirect(`/login?redirect=/courses/${slug}/learn`);
  }

  // ─────────────────────────────────────────────
  // Enrollment Verification: Check if user is enrolled in this course
  // ─────────────────────────────────────────────
  const isAdmin = dbUser.role === 'ADMIN' || dbUser.role === 'INSTRUCTOR';
  
  // Privileged preview bypass for admin/instructors
  if (!isAdmin) {
    const check = await checkEnrollment(dbUser.id, slug);
    if (!check.isEnrolled) {
      // Direct database query fallback if user.enrollments wasn't fresh or DB is available
      if (process.env.DATABASE_URL) {
        try {
          const activeEnrollment = await prisma.enrollment.findFirst({
            where: {
              userId: dbUser.id,
              OR: [{ courseId: slug }, { course: { slug } }],
              paymentStatus: 'COMPLETED',
            },
          });
          if (!activeEnrollment) {
            redirect(`/courses/${slug}?error=not_enrolled`);
          }
        } catch {
          redirect(`/courses/${slug}?error=not_enrolled`);
        }
      } else {
        redirect(`/courses/${slug}?error=not_enrolled`);
      }
    }
  }

  return <>{children}</>;
}

