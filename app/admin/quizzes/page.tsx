import React from 'react';
import { HelpCircle, BookOpen, Edit3, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { getAdminCoursesAsync } from '@/lib/db-data';
import { getCourseImageUrl } from '@/lib/course-image';

export const dynamic = 'force-dynamic';

export default async function AdminQuizzesPage() {
  const courses = await getAdminCoursesAsync();

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <HelpCircle size={28} className="text-cyan-400" /> Quiz Management Studio
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Create, manage, and attach interactive quizzes to lessons across your courses.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2 shadow-xl">
          <BookOpen className="text-cyan-400" size={20} />
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Registered Courses</p>
          <p className="text-2xl font-black text-white">{courses.length}</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2 shadow-xl">
          <CheckCircle2 className="text-emerald-400" size={20} />
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Quiz Status</p>
          <p className="text-2xl font-black text-emerald-400">Active & Ready</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2 shadow-xl">
          <HelpCircle className="text-blue-400" size={20} />
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Auto-Grading</p>
          <p className="text-2xl font-black text-white">Enabled</p>
        </div>
      </div>

      {/* Courses List to Edit Quizzes */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] shadow-2xl overflow-hidden">
        <div className="p-4 bg-black/40 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
            <HelpCircle size={16} className="text-cyan-400" /> Select a course to edit its quizzes
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {courses.map((course) => {
            const lessonCount = course.curriculum?.reduce((acc, s) => acc + s.lessons.length, 0) || course.totalLessons || 0;
            return (
              <div key={course.slug} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-center gap-4">
                  <img
                    src={getCourseImageUrl(course.image)}
                    alt={course.title}
                    className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      /{course.slug} • {lessonCount} lessons
                    </p>
                  </div>
                </div>

                <Link
                  href={`/admin/courses/${course.slug}/edit`}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/40 text-xs font-bold transition-all"
                >
                  <Edit3 size={14} /> Open Quiz Builder <ArrowRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
