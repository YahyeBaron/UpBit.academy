import { Metadata } from 'next';
import { getCoursesAsync, getCurrentDbUserAsync } from '@/lib/db-data';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import VisualRoadmap from '@/components/visual-roadmap';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: '32-Week Curriculum Roadmap | UpBit Academy',
  description:
    'Master Forward Deployed Engineering, Applied AI, and production systems architecture across our structured 32-week pathway.',
};

export default async function RoadmapPage() {
  const [courses, dbUser] = await Promise.all([
    getCoursesAsync().catch(() => []),
    getCurrentDbUserAsync().catch(() => null),
  ]);

  const userEnrollments = (dbUser?.enrollments || []).map((e) => ({
    courseId: e.courseId,
    progress: e.progress,
    paymentStatus: e.paymentStatus,
  }));

  const userProfile = dbUser
    ? {
        name: dbUser.name,
        email: dbUser.email,
      }
    : null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#4d65ff] selection:text-white font-sans antialiased">
      <Navbar />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-24">
        {/* Subtle background ambient lighting */}
        <div
          className="absolute top-12 left-1/2 -translate-x-1/2 w-[45rem] h-[25rem] rounded-full blur-[140px] pointer-events-none"
          style={{ background: 'rgba(77, 101, 255, 0.12)' }}
        />

        <VisualRoadmap
          courses={courses}
          userEnrollments={userEnrollments}
          user={userProfile}
        />
      </main>

      <Footer />
    </div>
  );
}
