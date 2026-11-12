import CourseDetailClientPage from '@/components/course-detail-client';
import { getCourseAndInstructorAsync } from '@/lib/db-data';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  noStore();
  const { slug } = await params;
  const { course: initialCourse, instructor: initialInstructor } = await getCourseAndInstructorAsync(slug);

  return (
    <CourseDetailClientPage
      courseSlug={slug}
      initialCourse={initialCourse}
      initialInstructor={initialInstructor}
    />
  );
}
