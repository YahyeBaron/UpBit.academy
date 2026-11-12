import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCurrentDbUserAsync } from '@/lib/db-data';

export const dynamic = 'force-dynamic';

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  // Automatically sync authenticated Clerk user to Neon PostgreSQL database
  await getCurrentDbUserAsync();

  return <>{children}</>;
}

