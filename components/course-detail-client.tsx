'use client';

import { getCourseImageUrl } from '@/lib/course-image';
import { Award, FileCheck } from 'lucide-react';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  Clock,
  BookOpen,
  CheckCircle,
  PlayCircle,
  Lock,
  ShieldCheck,
  Globe,
  ArrowRight,
  ChevronDown,
  X,
  Sparkles,
  MessageSquare,
  ThumbsUp,
  FileText,
  Share2,
  Rocket,
  Compass,
  Milestone,
} from 'lucide-react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import MuxPlayer from '@mux/mux-player-react';
import { getCourse, getInstructor, Course, Instructor } from '@/lib/data';

export default function CourseDetailClientPage({
  courseSlug,
  initialCourse,
  initialInstructor,
}: {
  courseSlug: string;
  initialCourse?: Course;
  initialInstructor?: Instructor;
}) {
  const course = initialCourse || getCourse(courseSlug) || getCourse('ultimate-nextjs-guide')!;
  const instructor = initialInstructor || getInstructor(course.instructorId);

  // Enrollment state
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Waitlist state for Coming Soon courses
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistMessage, setWaitlistMessage] = useState('');
  const [waitlistCount, setWaitlistCount] = useState(course.waitlistCount || 0);

  useEffect(() => {
    fetch(`/api/enroll?courseId=${course.slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.isEnrolled) setIsEnrolled(true);
      })
      .catch(() => {});
  }, [course.slug]);

  useEffect(() => {
    if (course.isComingSoon) {
      fetch(`/api/courses/${course.slug}/waitlist`)
        .then((r) => r.json())
        .then((data) => {
          if (data.waitlistCount !== undefined) setWaitlistCount(data.waitlistCount);
          if (data.isUserWaitlisted) setWaitlistSuccess(true);
        })
        .catch(() => {});
    }
  }, [course.slug, course.isComingSoon]);

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || !waitlistEmail.includes('@')) return;
    setWaitlistLoading(true);
    setWaitlistMessage('');
    try {
      const res = await fetch(`/api/courses/${course.slug}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail, name: waitlistName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join waitlist');
      setWaitlistSuccess(true);
      setWaitlistMessage(data.message || 'You have successfully joined the priority waitlist!');
      if (data.waitlistCount !== undefined) setWaitlistCount(data.waitlistCount);
    } catch (err: any) {
      setWaitlistMessage(err.message || 'Error joining waitlist');
    } finally {
      setWaitlistLoading(false);
    }
  };

  // Video Modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeVideoTitle, setActiveVideoTitle] = useState('Course Overview & Trailer');
  const [activePlaybackId, setActivePlaybackId] = useState<string>('');
  const [previewTokens, setPreviewTokens] = useState<{ playback?: string; thumbnail?: string; storyboard?: string } | null>(null);

  const openPreviewVideo = async (lessonId: string | undefined, title: string, playbackId?: string) => {
    setActiveVideoTitle(title);
    setActivePlaybackId(playbackId || '');
    setPreviewTokens(null);
    setIsVideoModalOpen(true);

    if (lessonId && playbackId) {
      try {
        const res = await fetch(`/api/courses/${course.slug}/lessons/${lessonId}/playback`);
        if (res.ok) {
          const data = await res.json();
          if (data.playbackConfig?.tokens) {
            setPreviewTokens(data.playbackConfig.tokens);
          } else if (data.playbackConfig?.token) {
            setPreviewTokens({ playback: data.playbackConfig.token });
          }
        }
      } catch {
        // Fallback gracefully to unsigned playback
      }
    }
  };

  // Curriculum Accordion State
  const [openSections, setOpenSections] = useState<number[]>([0, 1]);

  const toggleSection = (idx: number) => {
    if (openSections.includes(idx)) {
      setOpenSections(openSections.filter((i) => i !== idx));
    } else {
      setOpenSections([...openSections, idx]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#4d65ff] selection:text-white font-sans">
      <Navbar />

      {/* Video Modal Component */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="relative w-full max-w-4xl rounded-3xl border border-white/15 bg-[#030a1a] overflow-hidden shadow-2xl space-y-4 p-4 sm:p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#4d65ff] animate-pulse" />
                <h3 className="text-sm font-bold text-white truncate max-w-md">{activeVideoTitle}</h3>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Video Container */}
            <div className="relative aspect-video w-full rounded-2xl bg-black overflow-hidden border border-white/10 shadow-2xl">
              {activePlaybackId ? (
                <MuxPlayer
                  streamType="on-demand"
                  playbackId={activePlaybackId}
                  tokens={previewTokens || undefined}
                  metadata={{ video_title: activeVideoTitle }}
                  accentColor="#4d65ff"
                  autoPlay
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#040e1a] via-[#020813] to-black text-center p-6">
                  <PlayCircle size={40} className="text-[#4d65ff] opacity-60" />
                  <p className="text-white font-bold text-base">{activeVideoTitle}</p>
                  <p className="text-xs text-gray-400 max-w-sm">
                    Preview video is not currently available for this lesson. Enroll in the course to access all content and resources.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-400">Like this preview? Enroll now to get access to all {course.totalLessons} lessons!</p>
              <Link
                href={`/checkout?course=${course.slug}`}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4d65ff] to-[#b23fe0] text-white font-bold text-xs hover:opacity-90 transition-opacity"
              >
                Enroll Now — ${course.price}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <section className="relative pt-36 pb-20 overflow-hidden bg-gradient-to-b from-[#080d22] via-[#030612] to-black border-b border-white/10">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at top left, rgba(77, 101, 255, 0.2), transparent 60%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">

            {/* Left 2 Cols: Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Link href="/courses" className="hover:text-white transition-colors">Courses</Link>
                <span>/</span>
                <span className="capitalize">{course.category}</span>
                <span>/</span>
                <span className="text-[#a5b4fc] truncate max-w-[200px]">{course.title}</span>
              </div>

              {/* Course Series Badge if part of a track */}
              {course.seriesName && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#4d65ff]/15 via-[#b23fe0]/15 to-[#4d65ff]/15 border border-[#4d65ff]/30 text-xs font-bold text-[#a5b4fc]">
                  <Compass size={14} className="text-[#4d65ff] shrink-0" />
                  <span>Part of {course.seriesName} • Week {course.seriesOrder ?? 0}</span>
                  <Link href="/courses" className="text-purple-300 hover:text-white underline ml-1.5 font-normal">
                    View Track RoadMap →
                  </Link>
                </div>
              )}

              {/* Title & Tagline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-space-grotesk text-white tracking-tight leading-tight">
                {course.title}
              </h1>

              <p className="text-lg text-gray-300 leading-relaxed">
                {course.longDescription}
              </p>

              {/* Badges & Rating */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                  <Star size={16} className="fill-amber-400" />
                  <span>{course.rating}</span>
                  <span className="text-gray-400 font-normal">({course.reviews} ratings)</span>
                </div>

                <div className="flex items-center gap-1.5 text-gray-400">
                  <Clock size={16} />
                  <span>{course.totalHours > 0 ? `${course.totalHours} hrs` : course.duration} total</span>
                </div>

                {course.hasCertificate && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold text-xs">
                    <Award size={14} className="text-cyan-400" />
                    <span>Verified Certificate Included</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-gray-400">
                  <BookOpen size={16} />
                  <span>{course.totalLessons} lessons</span>
                </div>

                <div className="flex items-center gap-1.5 text-gray-400">
                  <Globe size={16} />
                  <span>Updated {course.lastUpdated}</span>
                </div>
              </div>

              {/* Instructor Mini Badge */}
              {instructor && (
                <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-blue-500/40">
                    <Image
                      src={instructor.avatar}
                      alt={instructor.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Created by</p>
                    <Link href={`/instructors/${instructor.id}`} className="font-bold text-white hover:text-blue-400 transition-colors">
                      {instructor.name}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sticky Card / Checkout Sidebar */}
            <div className="lg:col-span-1 lg:sticky lg:top-28">
              <div className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur-xl p-6 shadow-2xl space-y-6">
                {/* Course Image & Play Video Trigger */}
                <div
                  onClick={() => {
                    const firstLessonWithPlayback = course.curriculum.flatMap(s => s.lessons).find(l => l.muxPlaybackId);
                    if (firstLessonWithPlayback) {
                      openPreviewVideo(firstLessonWithPlayback.id, course.title + ' — Preview', firstLessonWithPlayback.muxPlaybackId);
                    } else {
                      openPreviewVideo(undefined, course.title + ' — Preview', '');
                    }
                  }}
                  className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gray-900 group cursor-pointer border border-white/10"
                >
                  <Image
                    src={getCourseImageUrl(course.image)}
                    alt={course.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 group-hover:bg-black/50 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-blue-600/90 flex items-center justify-center text-white shadow-xl shadow-blue-600/50 group-hover:scale-110 transition-transform">
                      <PlayCircle size={32} className="ml-0.5" />
                    </div>
                    <span className="text-xs font-bold text-white tracking-wider uppercase bg-black/60 px-3 py-1 rounded-full border border-white/20 backdrop-blur-md">
                      Watch Preview
                    </span>
                  </div>
                </div>

                {/* Price or Enrolled Badge or Coming Soon Waitlist */}
                {isEnrolled ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold">
                        <CheckCircle size={18} className="text-emerald-400" />
                        <span>You are enrolled in this course</span>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200">Active Access</span>
                    </div>

                    <Link
                      href={`/courses/${course.slug}/learn`}
                      className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 text-white font-black text-base hover:opacity-95 transition-all duration-300 shadow-xl shadow-emerald-500/25 hover:-translate-y-0.5"
                    >
                      <PlayCircle size={20} />
                      Continue Learning
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                ) : course.isComingSoon ? (
                  <div className="space-y-4">
                    {/* Pre-launch Lock Banner */}
                    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-bold uppercase text-[10px] tracking-wider border border-indigo-500/30">
                          <Rocket size={12} /> Coming Soon
                        </span>
                        <span className="text-[11px] font-mono text-indigo-300/80">Priority Waitlist</span>
                      </div>
                      <p className="text-white font-bold text-sm">
                        {course.releaseDate ? `Enrollment locked until ${course.releaseDate}` : 'Preparing for release — enrollment locked'}
                      </p>
                      <p className="text-gray-300 text-[11px] leading-relaxed">
                        Course materials and interactive player are locked until launch. Join the waitlist below to get early-bird discounts and launch day access.
                      </p>
                    </div>

                    {/* Waitlist Form or Success State */}
                    {waitlistSuccess ? (
                      <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                          <CheckCircle size={22} />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-sm">You&apos;re On The Waitlist!</h4>
                          <p className="text-emerald-300/90 text-xs mt-1">
                            {waitlistMessage || 'We will notify you with priority early-bird access the moment enrollment opens.'}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-emerald-500/20 text-[11px] font-medium text-emerald-300/80 flex items-center justify-center gap-1.5">
                          <Sparkles size={13} className="text-emerald-400" /> Priority spot confirmed • Early-bird perks locked in
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleJoinWaitlist} className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-gray-300">
                            Enter your email for launch invite & discount
                          </label>
                          <input
                            type="email"
                            required
                            value={waitlistEmail}
                            onChange={(e) => setWaitlistEmail(e.target.value)}
                            placeholder="you@domain.com"
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={waitlistLoading}
                          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-black text-sm hover:opacity-95 transition-all duration-300 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5 disabled:opacity-50"
                        >
                          {waitlistLoading ? (
                            <span>Adding to list...</span>
                          ) : (
                            <>
                              <Rocket size={16} />
                              Join Priority Waitlist
                              <ArrowRight size={16} />
                            </>
                          )}
                        </button>

                        <p className="text-[11px] text-center text-gray-400 flex items-center justify-center gap-1.5">
                          <Sparkles size={12} className="text-amber-400" /> Free early-bird discount & launch day notification
                        </p>
                      </form>
                    )}

                    {/* Locked player notice */}
                    <div className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/10 bg-white/[0.02] text-gray-400 font-medium text-xs">
                      <Lock size={13} className="text-gray-500" />
                      Content & Player Locked in Pre-Launch
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-black text-white">${course.price}</span>
                        <span className="text-lg text-gray-500 line-through">${course.originalPrice}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                        70% OFF
                      </span>
                    </div>

                    <div className="space-y-3">
                      <Link
                        href={`/checkout?course=${course.slug}`}
                        className="button is-chamfer is-grad w-button w-full flex items-center justify-center gap-2"
                        style={{
                          padding: '16px 28px',
                          fontSize: '1rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                          boxShadow: '0 10px 30px rgba(77, 101, 255, 0.4)',
                        }}
                      >
                        Enroll Now — ${course.price}
                        <ArrowRight size={18} />
                      </Link>

                      <Link
                        href={`/courses/${course.slug}/learn`}
                        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl border border-white/15 bg-white/5 text-gray-300 font-semibold text-sm hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <PlayCircle size={16} />
                        Launch Interactive Player
                      </Link>
                    </div>
                  </>
                )}

                {/* Includes List */}
                <div className="pt-4 border-t border-white/10 space-y-3 text-xs text-gray-300">
                  <p className="font-bold text-white uppercase tracking-wider text-[11px]">This course includes:</p>
                  {course.includes.map((inc, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-blue-400 shrink-0" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>

                {/* Guarantee line */}
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-2">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>30-Day Money-Back Guarantee</span>
                </div>
              </div>

              {/* Series Track Roadmap Sidebar Widget */}
              {course.seriesName && (
                <div className="mt-4 p-5 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/30 via-purple-950/20 to-black space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Milestone size={14} className="text-indigo-400" />
                      Learning Track
                    </span>
                    <span className="text-[10px] font-mono text-purple-300 px-2.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 font-bold">
                      Week {course.seriesOrder ?? 0}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Part of the <strong>{course.seriesName}</strong> series. Follow the sequential track from foundational concepts to advanced systems.
                  </p>
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                  >
                    <span>View Full 11-Week RoadMap</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Main Body */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        
        {/* What You'll Learn Grid */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <CheckCircle className="text-blue-400" />
            What You&apos;ll Learn
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {course.whatYouLearn.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5">
                <CheckCircle size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-200">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Completion Criteria & Accreditation Card */}
        {(course.hasCertificate || course.completionCriteria) && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Award size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Accreditation & Completion Requirements</h3>
                <p className="text-xs text-gray-400">
                  {course.hasCertificate
                    ? 'Upon satisfying completion requirements, you receive a cryptographically verified digital certificate.'
                    : 'Course completion requirements and milestones.'}
                </p>
              </div>
            </div>

            {course.completionCriteria && (
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-xs text-gray-300 leading-relaxed font-sans">
                <span className="font-bold text-white block mb-1">Criteria for Graduation:</span>
                {course.completionCriteria}
              </div>
            )}
          </div>
        )}

        {/* Course Curriculum Accordion */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Course Curriculum</h2>
              <p className="text-xs text-gray-400 mt-1">Click any lesson with a preview tag to watch video samples</p>
            </div>
            <span className="text-xs text-gray-400 font-mono">
              {course.curriculum.length} modules • {course.totalLessons} lessons
            </span>
          </div>

          <div className="space-y-4">
            {course.curriculum.map((section, sIdx) => {
              const isOpen = openSections.includes(sIdx);

              return (
                <div key={sIdx} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden transition-colors">
                  {/* Header toggle button */}
                  <button
                    onClick={() => toggleSection(sIdx)}
                    className="w-full p-5 bg-white/5 hover:bg-white/10 flex items-center justify-between transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      <h3 className="font-bold text-white text-base">{section.title}</h3>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">{section.lessons.length} lessons</span>
                  </button>

                  {/* Lessons List */}
                  {isOpen && (
                    <div className="divide-y divide-white/5">
                      {section.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          onClick={() => {
                            if (lesson.preview) {
                              openPreviewVideo(lesson.id, lesson.title, lesson.muxPlaybackId || '');
                            }
                          }}
                          className={`p-4 flex items-center justify-between transition-colors ${
                            lesson.preview ? 'hover:bg-blue-600/10 cursor-pointer' : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {lesson.preview ? (
                              <PlayCircle size={18} className="text-blue-400 shrink-0" />
                            ) : (
                              <Lock size={18} className="text-gray-600 shrink-0" />
                            )}
                            <span className="text-sm text-gray-300 font-medium">{lesson.title}</span>
                            {lesson.preview && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 flex items-center gap-1">
                                <PlayCircle size={10} /> FREE PREVIEW
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 font-mono">{lesson.duration}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Student Reviews & Testimonials */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Star className="text-amber-400 fill-amber-400" />
              Student Reviews ({course.reviews})
            </h2>
            <span className="text-sm font-bold text-amber-400">{course.rating} out of 5.0</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: 'Michael Chen', role: 'Fullstack Dev @ Stripe', comment: 'The Server Actions and App Router modules in this course saved me weeks of trial and error. Absolutely elite quality.', rating: 5 },
              { name: 'Elena Rostova', role: 'Frontend Engineer', comment: 'Best Next.js 15 course available. Yahye explains production patterns that you cannot find in documentation.', rating: 5 },
            ].map((rev, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{rev.name}</h4>
                    <p className="text-[11px] text-gray-400">{rev.role}</p>
                  </div>
                  <div className="flex text-amber-400 text-xs">★★★★★</div>
                </div>
                <p className="text-xs text-gray-300 italic">&quot;{rev.comment}&quot;</p>
              </div>
            ))}
          </div>
        </div>

        {/* Instructor Bio */}
        {instructor && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 flex flex-col md:flex-row items-start gap-6">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-blue-500/40 shrink-0">
              <Image
                src={instructor.avatar}
                alt={instructor.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-xl font-bold text-white">{instructor.name}</h3>
                  <p className="text-xs text-blue-400">{instructor.title}</p>
                </div>
                <Link
                  href={`/instructors/${instructor.id}`}
                  className="text-xs text-cyan-400 hover:underline font-semibold"
                >
                  View Full Profile →
                </Link>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed">
                {instructor.bio}
              </p>

              <div className="flex items-center gap-6 pt-2 text-xs text-gray-400">
                <span>⭐ {instructor.rating} Instructor Rating</span>
                <span>👨‍🎓 {instructor.students.toLocaleString()} Students</span>
                <span>📚 {instructor.courses} Courses</span>
              </div>
            </div>
          </div>
        )}

      </section>

      <Footer />
    </div>
  );
}
