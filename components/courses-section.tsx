import { getCoursesAsync } from '@/lib/db-data';
import CoursesSectionClient from './courses-section-client';

export default async function CoursesSection() {
  const courses = await getCoursesAsync();
  return <CoursesSectionClient courses={courses} />;
}
