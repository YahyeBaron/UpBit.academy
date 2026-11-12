'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star, Clock, Bookmark, Sparkles, PlayCircle } from 'lucide-react';
import { Course } from '@/lib/data';
import { getCourseImageUrl } from '@/lib/course-image';

const CATEGORIES = [
  { id: 'all', label: 'All Courses' },
  { id: 'frontend', label: 'Frontend & Next.js' },
  { id: '3d', label: '3D & WebGL' },
  { id: 'saas', label: 'Fullstack SaaS' },
  { id: 'career', label: 'Career & Growth' },
];

interface CoursesSectionClientProps {
  courses: Course[];
}

export default function CoursesSectionClient({ courses }: CoursesSectionClientProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});

  const filteredCourses = activeCategory === 'all'
    ? courses
    : courses.filter((c) => c.category === activeCategory);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="courses" className="section section-base">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header with reveal animation */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6"
        >
          <div className="max-w-xl">
            <div className="section-badge">
              <Sparkles size={13} /> Curriculum Catalog
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Popular Masterclasses
            </h2>
            <p className="text-gray-400 text-lg mt-3">
              Step-by-step courses designed to take you from foundational syntax to production deployment.
            </p>
          </div>

          <Link
            href="/courses"
            className="font-bold text-sm text-blue-400 hover:text-blue-300 transition-all duration-300 flex items-center gap-2 border-b border-blue-500/30 pb-1 self-start md:self-auto group"
          >
            <span>Explore All Courses ({courses.length})</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Category Filter Pills with animated sliding background */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`relative px-5 py-2.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap cursor-pointer z-10 ${
                  isActive ? 'text-white' : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryPill"
                    className="absolute inset-0 rounded-full bg-blue-600 shadow-[0_0_25px_rgba(37,99,235,0.45)] -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Course Cards Grid with Animated Filtering */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredCourses.map((course) => (
              <motion.div
                key={course.slug}
                layout
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 20 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
                className="flex flex-col"
              >
                <Link
                  href={`/courses/${course.slug}`}
                  className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-[#0A0E1A]/80 backdrop-blur-md p-3.5 transition-all duration-400 hover:border-blue-500/40 hover:shadow-[0_0_45px_rgba(37,99,235,0.22)] flex flex-col justify-between"
                >
                  <div>
                    {/* Course Image & Play Overlay */}
                    <div className="relative aspect-[16/9] overflow-hidden rounded-2xl mb-4 bg-gray-900">
                      <img
                        src={getCourseImageUrl(course.image)}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                      />
                      
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/90 text-white font-bold text-xs backdrop-blur-md shadow-xl transition-transform duration-300 group-hover:scale-105">
                          <PlayCircle size={16} />
                          Preview Course
                        </div>
                      </div>

                      {/* Bookmark Button */}
                      <button
                        onClick={(e) => toggleBookmark(course.slug, e)}
                        className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-black transition-all hover:scale-110 active:scale-95 z-10"
                        title="Bookmark Course"
                      >
                        <Bookmark
                          size={15}
                          className={`transition-colors ${bookmarked[course.slug] ? 'fill-blue-400 text-blue-400' : 'text-gray-300'}`}
                        />
                      </button>

                      {/* Level Tag */}
                      <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-bold text-white border border-white/10">
                        {course.level}
                      </span>
                    </div>

                    {/* Course Content */}
                    <div className="px-3 pb-2">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                        <span className="flex items-center gap-1 text-amber-400 font-bold">
                          <Star size={13} className="fill-amber-400" />
                          {course.rating} <span className="text-gray-500">({course.reviews})</span>
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock size={13} /> {course.totalHours > 0 ? `${course.totalHours}h` : course.duration}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                        {course.title}
                      </h3>
                      
                      <p className="text-sm text-gray-400 mb-6 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>
                  </div>

                  {/* Footer Row */}
                  <div className="px-3 pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {(course.instructorAvatars && course.instructorAvatars.length > 0
                          ? course.instructorAvatars
                          : (course.instructors || [])
                        ).map((src, i) => {
                          const isUrl = src.startsWith('http') || src.startsWith('/');
                          return isUrl ? (
                            <img
                              key={i}
                              src={src}
                              alt={(course.instructors || [])[i] || 'Instructor'}
                              className="h-7 w-7 rounded-full border-2 border-black object-cover"
                            />
                          ) : (
                            <div
                              key={i}
                              className="h-7 w-7 rounded-full border-2 border-black bg-blue-700 flex items-center justify-center text-[10px] font-bold text-white"
                              title={src}
                            >
                              {src.charAt(0).toUpperCase()}
                            </div>
                          );
                        })}
                      </div>
                      <span className="text-xs text-gray-400 font-semibold">Mentored</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                      <span>View Course</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
