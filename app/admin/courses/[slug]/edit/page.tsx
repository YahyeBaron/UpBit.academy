import { notFound } from 'next/navigation';
import { getDbCourseBySlugAsync } from '@/lib/db-data';
import CourseEditor from '@/components/admin/course-editor';

export const dynamic = 'force-dynamic';

export default async function EditCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  // Next.js 15 Async Params Resolution
  const { slug } = await params;
  const course = await getDbCourseBySlugAsync(slug);

  if (!course) {
    return notFound();
  }

  return <CourseEditor course={course} />;
}
