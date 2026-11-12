import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAdminCoursesAsync } from '@/lib/db-data';
import { getCourseImageUrl } from '@/lib/course-image';
import { PlusCircle, Edit3, Eye, BookOpen, Globe, Lock, Award, Clock, Users, GraduationCap, Rocket } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminCoursesCatalogPage() {
  const courses = await getAdminCoursesAsync();

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Course Management Studio</h1>
          <p className="text-sm text-gray-400 mt-1">
            Create new courses, toggle publication state, attach curriculum modules, configure certificates, and manage pricing.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/admin/instructors"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-bold text-xs transition-all"
          >
            <GraduationCap size={15} className="text-cyan-400" /> Manage Instructors
          </Link>
          <Link
            href="/admin/courses/new"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-xl shadow-blue-500/25 transition-all"
          >
            <PlusCircle size={15} /> Create Course
          </Link>
        </div>
      </div>

      {/* Courses Table Container */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] shadow-2xl overflow-hidden">
        <div className="p-4 bg-black/40 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
            <BookOpen size={15} className="text-blue-400" /> Total Registered Courses ({courses.length})
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-white/5 text-[11px] font-mono text-gray-400 uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Course Info</th>
                <th className="px-6 py-4">Status & Category</th>
                <th className="px-6 py-4">Pricing ($)</th>
                <th className="px-6 py-4">Lessons & Hours</th>
                <th className="px-6 py-4">Students</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {courses.map((course) => {
                const lessonCount =
                  course.curriculum?.reduce((acc, s) => acc + s.lessons.length, 0) ||
                  course.totalLessons ||
                  0;
                const isDraft = course.isPublished === false;
                const isComingSoon = Boolean(course.isPublished && course.isComingSoon);
                const isLive = Boolean(course.isPublished && !course.isComingSoon);
                const imageUrl = getCourseImageUrl(course.image);

                return (
                  <tr key={course.slug} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-gray-900">
                          <Image
                            src={imageUrl}
                            alt={course.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm block group-hover:text-blue-400 transition-colors">
                            {course.title}
                          </span>
                          <span className="text-[11px] text-gray-400 block truncate max-w-xs font-mono">
                            /{course.slug}
                          </span>
                          {(course.instructors?.[0] || course.instructorId) && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400/90 mt-1 font-medium">
                              <GraduationCap size={11} className="text-cyan-400" />
                              {course.instructors?.[0] || course.instructorId}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isDraft && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border bg-amber-500/10 text-amber-400 border-amber-500/20">
                            <Lock size={10} /> Draft
                          </span>
                        )}
                        {isComingSoon && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border bg-indigo-500/10 text-indigo-300 border-indigo-500/20">
                            <Rocket size={10} /> Coming Soon
                          </span>
                        )}
                        {isLive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            <Globe size={10} /> Published
                          </span>
                        )}
                        <span className="inline-block px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[10px] uppercase">
                          {course.category}
                        </span>
                        {course.seriesName && (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold text-[10px]">
                            {course.seriesName} • Wk {course.seriesOrder ?? 0}
                          </span>
                        )}
                      </div>
                      {isComingSoon && course.releaseDate && (
                        <div className="text-[10px] font-mono text-indigo-300/90 flex items-center gap-1">
                          <Clock size={10} /> Release: {course.releaseDate}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <span>{course.level}</span>
                        {course.hasCertificate && (
                          <span className="inline-flex items-center gap-0.5 text-cyan-400 font-semibold">
                            <Award size={11} /> Cert
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-white">
                      ${course.price}{' '}
                      {course.originalPrice > course.price && (
                        <span className="line-through text-gray-500 text-[10px] ml-1">
                          ${course.originalPrice}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 font-mono text-gray-300 space-y-0.5">
                      <div>{lessonCount} Lessons</div>
                      {course.totalHours > 0 && (
                        <div className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Clock size={11} /> {course.totalHours} hrs
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/enrollments?courseSlug=${course.slug}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/25 transition-all text-xs group/enr"
                        title="View enrolled students in Sales & Enrollments"
                      >
                        <Users size={12} className="text-blue-400 shrink-0" />
                        <span className="font-mono font-bold text-white group-hover/enr:text-blue-300">
                          {course.students?.toLocaleString() || 0}
                        </span>
                        <span className="text-[10px] text-gray-400 group-hover/enr:text-gray-300">
                          {course.students === 1 ? 'student' : 'students'}
                        </span>
                      </Link>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/courses/${course.slug}/edit`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
                        >
                          <Edit3 size={13} /> Edit
                        </Link>
                        <Link
                          href={`/courses/${course.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title="Preview Public Page"
                        >
                          <Eye size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
