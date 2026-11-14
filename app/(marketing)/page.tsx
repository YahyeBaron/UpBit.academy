import { getCoursesAsync } from '@/lib/db-data';
import { getHomePageHtml } from '@/lib/home-html';
import HomePageClient from '@/components/home-page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const courses = await getCoursesAsync();
  const html = getHomePageHtml(courses);

  return <HomePageClient html={html} />;
}

