import { Metadata } from 'next';
import { getCoursesAsync, getCurrentDbUserAsync } from '@/lib/db-data';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import VisualRoadmap from '@/components/visual-roadmap';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Computer Science Learning Path | EraySame Tech Academy',
  description:
    'Master computer science fundamentals from algorithmic problem-solving and systems C to relational databases, full-stack web architecture, and cybersecurity defense.',
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
    <div className="min-h-screen bg-[#020814] text-white selection:bg-blue-500 selection:text-white font-sans antialiased">
      <Navbar />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-24">
        {/* Subtle background ambient lighting */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[45rem] h-[25rem] bg-blue-600/[0.07] rounded-full blur-[120px] pointer-events-none" />

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
