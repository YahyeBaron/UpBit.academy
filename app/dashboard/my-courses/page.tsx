import Image from 'next/image';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard-layout';
import { getCoursesAsync, getCurrentDbUserAsync } from '@/lib/db-data';
import { getCourseImageUrl } from '@/lib/course-image';
import { PlayCircle, BookOpen, ArrowRight, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MyCoursesPage() {
  const dbUser = await getCurrentDbUserAsync();
  const allCourses = await getCoursesAsync();
  const userEnrollments = dbUser?.enrollments || [];

  const enrolledSlugs = userEnrollments
    .filter((e) => e.paymentStatus === 'COMPLETED')
    .map((e) => e.courseId);
  const enrolledCourses = allCourses.filter((c) => enrolledSlugs.includes(c.slug));
  const hasEnrollments = enrolledCourses.length > 0;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">My Courses</h1>
          <p className="text-sm text-gray-400 mt-1">Manage and access all your enrolled courses.</p>
        </div>

        {hasEnrollments ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {enrolledCourses.map((course) => {
              const enrollment = userEnrollments.find((e) => e.courseId === course.slug);
              const progressPct = enrollment?.progress || 0;

              return (
                <div
                  key={course.slug}
                  className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex flex-col hover:border-blue-500/40 transition-all p-6 space-y-4"
                >
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-900">
                    <Image src={getCourseImageUrl(course.image)} alt={course.title} fill className="object-cover" />
                  </div>

                  <div className="space-y-2 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                      {course.category}
                    </span>
                    <h3 className="text-xl font-bold text-white">{course.title}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2">{course.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Completion Progress</span>
                      <span className="font-bold text-blue-400">{progressPct}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    href={`/courses/${course.slug}/learn`}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-colors"
                  >
                    <PlayCircle size={18} />
                    Go to Course Player
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-16 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
              <BookOpen size={32} />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-2xl font-bold text-white">No Courses Yet</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                You haven&apos;t enrolled in any courses. Browse the catalog to start your learning journey.
              </p>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm hover:from-blue-500 hover:to-cyan-400 transition-all shadow-lg shadow-blue-500/25"
            >
              <Search size={16} />
              Browse Courses
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
