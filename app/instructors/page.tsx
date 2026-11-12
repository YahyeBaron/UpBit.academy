import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { getInstructorsAsync } from '@/lib/db-data';
import {
  GraduationCap,
  Star,
  BookOpen,
  Users,
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
  Sparkles,
} from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Instructors & Faculty | UpBit Academy',
  description:
    'Learn from world-class senior Forward Deployed Engineers, AI architects, and practitioners leading UpBit Academy programs.',
};

export default async function InstructorsDirectoryPage() {
  const instructors = await getInstructorsAsync();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#4d65ff] selection:text-white flex flex-col font-sans">
      <Navbar />

      {/* Hero Header */}
      <section className="relative pt-36 pb-20 overflow-hidden bg-gradient-to-b from-[#080d22] via-[#030612] to-black border-b border-white/10">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at top, rgba(77, 101, 255, 0.18), transparent 70%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#4d65ff]/10 border border-[#4d65ff]/30 text-[#a5b4fc] text-xs font-bold uppercase tracking-wider">
            <Sparkles size={13} className="text-[#b23fe0]" />
            World-Class Mentors &amp; AI Practitioners
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-space-grotesk text-white tracking-tight">
            Meet Our <span className="bg-gradient-to-r from-[#4d65ff] to-[#b23fe0] bg-clip-text text-transparent">Faculty</span>
          </h1>

          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Gain production-tested insights from active Forward Deployed Engineers who build high-scale client solutions, agentic workflows, and robust architectures every day.
          </p>
        </div>
      </section>

      {/* Instructors Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {instructors.length === 0 ? (
          <div className="p-16 rounded-3xl border border-white/10 bg-white/[0.02] text-center space-y-4 max-w-md mx-auto">
            <GraduationCap size={44} className="mx-auto text-gray-500" />
            <h2 className="text-lg font-bold text-white">No Instructors Listed Yet</h2>
            <p className="text-xs text-gray-400">
              Instructor profiles will appear here once registered in the admin portal.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {instructors.map((instructor) => (
              <div
                key={instructor.id}
                className="rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-cyan-500/30 transition-all duration-300 p-6 flex flex-col justify-between space-y-6 shadow-2xl group relative overflow-hidden"
              >
                <div className="space-y-5">
                  {/* Avatar & Basic Info */}
                  <div className="flex items-start gap-4">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/15 shrink-0 bg-gray-900 shadow-xl group-hover:border-cyan-400/50 transition-colors">
                      <Image
                        src={instructor.avatar || '/assets/pri-next.jpg'}
                        alt={instructor.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="font-extrabold text-white text-lg group-hover:text-cyan-300 transition-colors truncate">
                        {instructor.name}
                      </h2>
                      <p className="text-xs text-cyan-400 font-semibold line-clamp-2 mt-0.5">
                        {instructor.title}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2">
                        <Star size={13} className="text-amber-400 fill-amber-400" />
                        <span className="text-xs font-bold text-white">{instructor.rating || 5.0}</span>
                        <span className="text-[11px] text-gray-500">
                          ({(instructor.reviews || 0).toLocaleString()} reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                    {instructor.bio}
                  </p>

                  {/* Expertise Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {(instructor.expertise || []).slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-gray-300 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {(instructor.expertise || []).length > 4 && (
                      <span className="px-2 py-1 rounded-lg bg-white/5 text-[10px] text-gray-500 font-mono">
                        +{(instructor.expertise || []).length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Metrics & Link */}
                <div className="pt-4 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <BookOpen size={13} className="text-blue-400" />
                      <span className="font-bold text-white font-mono">{instructor.courses || 0}</span>
                      <span>courses</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Users size={13} className="text-cyan-400" />
                      <span className="font-bold text-white font-mono">
                        {(instructor.students || 0).toLocaleString()}
                      </span>
                      <span>students</span>
                    </div>

                    {/* Socials */}
                    <div className="flex items-center gap-2 text-gray-500">
                      {instructor.social?.github && instructor.social.github !== '#' && (
                        <a
                          href={instructor.social.github}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-white transition-colors"
                          title="GitHub"
                        >
                          <Github size={13} />
                        </a>
                      )}
                      {instructor.social?.twitter && instructor.social.twitter !== '#' && (
                        <a
                          href={instructor.social.twitter}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-cyan-400 transition-colors"
                          title="Twitter"
                        >
                          <Twitter size={13} />
                        </a>
                      )}
                      {instructor.social?.linkedin && instructor.social.linkedin !== '#' && (
                        <a
                          href={instructor.social.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-blue-400 transition-colors"
                          title="LinkedIn"
                        >
                          <Linkedin size={13} />
                        </a>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/instructors/${instructor.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 hover:shadow-cyan-500/30 transition-all group/btn"
                  >
                    <span>View Profile & Courses</span>
                    <ArrowRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
