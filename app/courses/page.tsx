import { getCoursesAsync } from '@/lib/db-data';
import CoursesCatalogClient from '@/components/courses-catalog-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CoursesCatalogPage() {
  const courses = await getCoursesAsync();
  return <CoursesCatalogClient initialCourses={courses} />;
}
