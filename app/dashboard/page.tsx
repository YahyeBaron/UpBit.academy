import Image from 'next/image';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard-layout';
import { getCoursesAsync, getCurrentDbUserAsync } from '@/lib/db-data';
import { getCourseImageUrl } from '@/lib/course-image';
import {
  PlayCircle,
  Award,
  Flame,
  Clock,
  ArrowRight,
  CheckCircle2,
  Trophy,
  Calendar,
  BookOpen,
  TrendingUp,
  Sparkles,
  Search,
  Check,
  GraduationCap,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  const dbUser = await getCurrentDbUserAsync();
  const allCourses = await getCoursesAsync();
  const userName = dbUser?.name || 'Student';
  const userEnrollments = dbUser?.enrollments || [];

  const enrolledSlugs = userEnrollments
    .filter((e) => e.paymentStatus === 'COMPLETED')
    .map((e) => e.courseId);
  const enrolledCourses = allCourses.filter((c) => enrolledSlugs.includes(c.slug));
  const hasEnrollments = enrolledCourses.length > 0;

  const streak = hasEnrollments ? 3 : 1;
  const totalXP = userEnrollments.reduce((acc, e) => acc + (e.progress * 10), hasEnrollments ? 350 : 50);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* 1. Hero / Welcome Banner */}
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-r from-[#0d1a3a]/80 via-[#1a0d3a]/60 to-black p-8 md:p-10 overflow-hidden shadow-2xl">
          <div
            className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at top right, rgba(178, 63, 224, 0.2), transparent 70%)' }}
          />
          <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-[#4d65ff]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#4d65ff]/15 text-[#a5b4fc] border border-[#4d65ff]/30 flex items-center gap-1.5 font-space-grotesk">
                  <Sparkles size={13} className="text-[#b23fe0]" />
                  {hasEnrollments ? 'Welcome back!' : 'Welcome to UpBit Academy!'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Student Member
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-space-grotesk text-white tracking-tight">
                {userName}
              </h1>

              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                {hasEnrollments ? (
                  <>You are on a <strong className="text-orange-400 font-bold">{streak}-day learning streak</strong>! Complete today&apos;s lesson to maintain your momentum.</>
                ) : (
                  <>Start your learning journey today! Explore our industry-leading courses in Forward Deployed Engineering, Applied AI, and production systems.</>
                )}
              </p>
            </div>

            {/* Quick Action CTA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              {hasEnrollments ? (
                <Link
                  href={`/courses/${enrolledCourses[0]?.slug}/learn`}
                  className="button is-chamfer is-grad w-button flex items-center justify-center gap-2"
                  style={{ padding: '14px 28px', fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none' }}
                >
                  <PlayCircle size={18} />
                  Resume Learning
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <Link
                  href="/courses"
                  className="button is-chamfer is-grad w-button flex items-center justify-center gap-2"
                  style={{ padding: '14px 28px', fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none' }}
                >
                  <BookOpen size={18} />
                  Explore Courses
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 2. Key Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Enrolled Courses', value: enrolledCourses.length, sub: hasEnrollments ? `${enrolledCourses.length} Active` : '0 Enrolled', icon: BookOpen, color: 'text-blue-400', bg: 'from-blue-500/10 to-transparent' },
            { label: 'Completed Courses', value: userEnrollments.filter(e => e.progress === 100).length, sub: '0 Certificates', icon: CheckCircle2, color: 'text-emerald-400', bg: 'from-emerald-500/10 to-transparent' },
            { label: 'Learning Streak', value: `${streak} Day${streak > 1 ? 's' : ''}`, sub: 'Daily active student', icon: Flame, color: 'text-orange-400', bg: 'from-orange-500/10 to-transparent' },
            { label: 'Total Experience XP', value: `${totalXP} XP`, sub: '+50 XP for joining', icon: Trophy, color: 'text-cyan-400', bg: 'from-cyan-500/10 to-transparent' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className={`p-6 rounded-2xl border border-white/10 bg-gradient-to-br ${stat.bg} bg-white/5 backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-all`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400 font-semibold">{stat.label}</span>
                  <div className={`p-2 rounded-xl bg-white/5 border border-white/10 ${stat.color}`}>
                    <Icon size={18} />
                  </div>
                </div>
                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-[11px] text-gray-400">{stat.sub}</div>
              </div>
            );
          })}
        </div>

        {/* 3. Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Left Column: In-Progress Courses or Empty State */}
          <div className="lg:col-span-2 space-y-8">
            
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">My Enrolled Courses</h2>
                  <p className="text-xs text-gray-400">Manage your active learning modules</p>
                </div>
                <Link href="/courses" className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                  Browse Catalog →
                </Link>
              </div>

              {hasEnrollments ? (
                <div className="space-y-4">
                  {enrolledCourses.map((course) => {
                    const enrollment = userEnrollments.find((e) => e.courseId === course.slug);
                    const progressPct = enrollment?.progress || 0;

                    return (
                      <div
                        key={course.slug}
                        className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md hover:border-blue-500/40 hover:bg-white/[0.07] transition-all duration-300 shadow-lg"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                          <div className="relative w-full sm:w-36 aspect-video rounded-xl overflow-hidden bg-gray-900 shrink-0">
                            <Image src={getCourseImageUrl(course.image)} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <PlayCircle size={28} className="text-white drop-shadow-md" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 space-y-3 w-full">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                                  {course.category}
                                </span>
                                <h3 className="text-base font-bold text-white truncate mt-1 group-hover:text-blue-300 transition-colors">
                                  {course.title}
                                </h3>
                              </div>
                              <span className="text-xs text-gray-400 shrink-0">{course.duration}</span>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400 font-medium font-sans">Course Progress</span>
                                <span className="font-bold text-cyan-300">{progressPct}%</span>
                              </div>
                              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[11px] text-gray-400">Lesson 1 • Introduction</span>
                              <Link
                                href={`/courses/${course.slug}/learn`}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-cyan-300 transition-colors"
                              >
                                Start Learning
                                <ArrowRight size={14} />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Empty State Card for New Users */
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
                    <BookOpen size={32} />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="text-xl font-bold text-white">No Enrolled Courses Yet</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      You haven&apos;t enrolled in any courses. Explore our curated tech catalog to start your learning path.
                    </p>
                  </div>
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm hover:from-blue-500 hover:to-cyan-400 transition-all shadow-lg shadow-blue-500/25"
                  >
                    <Search size={16} />
                    Explore Courses
                  </Link>
                </div>
              )}
            </div>

            {/* Featured Course Recommendation */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-black p-6 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-purple-400 tracking-wider">Recommended Starter Course</span>
                  <h3 className="text-lg font-bold text-white">The Ultimate Next.js 15 Guide</h3>
                  <p className="text-xs text-gray-400">Master Server Components, App Router, Dynamic Data Fetching, and Prisma.</p>
                </div>
                <Link
                  href="/courses/ultimate-nextjs-guide"
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors shrink-0 text-center"
                >
                  View Details
                </Link>
              </div>
            </div>

          </div>

          {/* Right Column: Target + Badges */}
          <div className="space-y-8">
            
            {/* Weekly Target Widget */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp size={18} className="text-cyan-400" />
                  Weekly Target
                </h3>
                <span className="text-xs font-semibold text-gray-400">{hasEnrollments ? '2 / 7 Hours' : '0 / 7 Hours'}</span>
              </div>

              <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r from-cyan-500 to-blue-500 ${hasEnrollments ? 'w-[30%]' : 'w-[10%]'}`} />
              </div>

              <div className="flex justify-between items-center pt-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 text-gray-500 border border-white/5'
                    }`}>
                      {i === 0 ? <Check size={12} strokeWidth={3} /> : day}
                    </div>
                    <span className="text-[10px] text-gray-500">{day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Office Hours */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar size={18} className="text-blue-400" />
                Live Office Hours
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Next.js 15 Q&A Session</span>
                    <span className="text-[10px] text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded">Tomorrow, 6 PM</span>
                  </div>
                  <p className="text-[11px] text-gray-400">Hosted by Yahye Baron • Live Code Review</p>
                </div>
              </div>
            </div>

            {/* Achievements Showcase */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award size={18} className="text-amber-400" />
                  Achievements
                </h3>
                <span className="text-xs text-amber-400 font-bold">1 Unlocked</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-center">
                  <div className="text-2xl mb-1">🎉</div>
                  <div className="text-[10px] font-bold text-white truncate">Joined EST</div>
                </div>
                <div className="p-3 rounded-xl border border-white/5 bg-white/5 text-center opacity-40">
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="text-[10px] font-bold text-gray-400 truncate">First Lesson</div>
                </div>
                <div className="p-3 rounded-xl border border-white/5 bg-white/5 text-center opacity-40">
                  <div className="text-2xl mb-1">🔥</div>
                  <div className="text-[10px] font-bold text-gray-400 truncate">7-Day Streak</div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
