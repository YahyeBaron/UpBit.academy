import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { INSTRUCTORS } from '@/lib/data';
import { getInstructorAsync, getInstructorCoursesAsync, getInstructorsAsync } from '@/lib/db-data';
import { getCourseImageUrl } from '@/lib/course-image';
import { Star, ArrowRight, ArrowLeft } from 'lucide-react';

export function generateStaticParams() {
  return INSTRUCTORS.map((instructor) => ({
    id: instructor.id,
  }));
}

export default async function InstructorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const instructor = await getInstructorAsync(id);

  if (!instructor) {
    notFound();
  }

  const courses = await getInstructorCoursesAsync(instructor.id);
  const allInstructors = await getInstructorsAsync();
  const otherInstructors = allInstructors.filter((i) => i.id !== instructor.id);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500 selection:text-white">
      {/* Header Banner */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-[#030d20] via-black to-black border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(29,78,216,0.15),transparent_70%)]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <Link
            href="/instructors"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft size={14} /> Back to All Instructors
          </Link>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
            {/* Avatar */}
            <div className="relative w-36 h-36 rounded-3xl overflow-hidden border-4 border-blue-500/40 shadow-2xl shadow-blue-500/20 shrink-0">
              <Image src={instructor.avatar} alt={instructor.name} fill className="object-cover" />
            </div>

            {/* Info */}
            <div className="space-y-4 flex-1">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Lead Instructor
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-white mt-2">{instructor.name}</h1>
                <p className="text-blue-400 font-semibold text-base">{instructor.title}</p>
              </div>

              <p className="text-gray-300 text-sm max-w-2xl leading-relaxed">{instructor.bio}</p>

              {/* Expertise Tags */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {instructor.expertise.map((exp, i) => (
                  <span key={i} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-gray-300">
                    {exp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md text-center">
            <div>
              <div className="text-2xl font-black text-white flex items-center justify-center gap-1">
                <Star size={18} className="text-amber-400 fill-amber-400" />
                {instructor.rating}
              </div>
              <div className="text-xs text-gray-400 mt-1">Instructor Rating</div>
            </div>

            <div>
              <div className="text-2xl font-black text-white">{instructor.students.toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-1">Total Students</div>
            </div>

            <div>
              <div className="text-2xl font-black text-white">{instructor.reviews.toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-1">Reviews</div>
            </div>

            <div>
              <div className="text-2xl font-black text-white">{instructor.courses}</div>
              <div className="text-xs text-gray-400 mt-1">Courses Published</div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses by Instructor */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-white mb-8">Courses by {instructor.name}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {courses.map((course) => (
            <div key={course.slug} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex flex-col hover:border-blue-500/40 transition-all">
              <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
                <Image src={getCourseImageUrl(course.image)} alt={course.title} fill className="object-cover" />
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{course.title}</h3>
                  <p className="text-xs text-gray-400 line-clamp-2">{course.tagline}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-xl font-black text-white">${course.price}</span>
                  <Link
                    href={`/courses/${course.slug}`}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-colors"
                  >
                    View Course
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Other Instructors */}
      {otherInstructors.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-4">
          <div className="border-t border-white/10 pt-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">Other Faculty & Mentors</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Explore other specialized courses taught by BIT Academy instructors
                </p>
              </div>
              <Link
                href="/instructors"
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                View All Instructors <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {otherInstructors.map((other) => (
                <Link
                  key={other.id}
                  href={`/instructors/${other.id}`}
                  className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyan-500/30 transition-all flex items-center gap-4 group shadow-xl"
                >
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/15 shrink-0 bg-gray-900 group-hover:border-cyan-400/40 transition-colors">
                    <Image
                      src={other.avatar || '/assets/pri-next.jpg'}
                      alt={other.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {other.name}
                    </h3>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{other.title}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-500">
                      <span className="text-cyan-400 font-mono font-semibold">
                        {other.courses || 0} courses
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-amber-400 font-medium">
                        <Star size={10} className="fill-amber-400" />
                        {other.rating || 5.0}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
