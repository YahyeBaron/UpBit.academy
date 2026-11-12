import { prisma } from '@/lib/prisma';
import { getMeilisearchClient, COURSES_INDEX } from './client';
import type {
  CourseSearchDocument,
  SearchCoursesParams,
  SearchCoursesResponse,
} from './types';

/**
 * Configure Meilisearch index settings:
 * - Searchable attributes: title, description, instructorName, category, tags
 * - Filterable attributes: level, price, category
 * - Ranking rules: standard relevance ranking
 */
export async function configureIndex() {
  try {
    const client = getMeilisearchClient();
    const index = client.index<CourseSearchDocument>(COURSES_INDEX);

    await index.updateSearchableAttributes([
      'title',
      'tags',
      'category',
      'instructorName',
      'description',
    ]);

    await index.updateFilterableAttributes(['level', 'price', 'category']);

    return true;
  } catch (error) {
    console.warn('⚠️ Unable to configure Meilisearch index:', error);
    return false;
  }
}

/**
 * Add or update courses in Meilisearch
 */
export async function indexCourses(docs: CourseSearchDocument[]) {
  if (docs.length === 0) return;
  const client = getMeilisearchClient();
  const index = client.index<CourseSearchDocument>(COURSES_INDEX);
  return await index.addDocuments(docs, { primaryKey: 'id' });
}

/**
 * Remove courses from Meilisearch
 */
export async function deleteFromIndex(slugs: string[]) {
  if (slugs.length === 0) return;
  const client = getMeilisearchClient();
  const index = client.index(COURSES_INDEX);
  return await index.deleteDocuments(slugs);
}

/**
 * Sync all courses from Postgres/Prisma into Meilisearch
 */
export async function syncAllCourses() {
  const courses = await prisma.course.findMany({
    include: {
      instructor: true,
    },
  });

  const documents: CourseSearchDocument[] = courses.map((c) => ({
    id: c.slug,
    slug: c.slug,
    title: c.title,
    description: c.description || c.tagline || '',
    instructorName: c.instructor?.name || 'Instructor',
    category: c.category,
    level: c.level,
    price: Number(c.price),
    tags: c.tags || [],
    thumbnail: c.image,
  }));

  try {
    await configureIndex();
    const result = await indexCourses(documents);
    return {
      success: true,
      syncedCount: documents.length,
      task: result,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Meilisearch sync error:', message);
    return {
      success: false,
      syncedCount: 0,
      error: message,
    };
  }
}

/**
 * Search courses with graceful database fallback if Meilisearch service is unreachable
 */
export async function searchCourses(
  params: SearchCoursesParams
): Promise<SearchCoursesResponse> {
  const startTime = Date.now();
  const { query, level, maxPrice, limit = 12, offset = 0 } = params;

  try {
    const client = getMeilisearchClient();
    const index = client.index<CourseSearchDocument>(COURSES_INDEX);

    const filter: string[] = [];
    if (level) {
      filter.push(`level = "${level}"`);
    }
    if (typeof maxPrice === 'number') {
      filter.push(`price <= ${maxPrice}`);
    }

    const searchResults = await index.search(query, {
      limit,
      offset,
      filter: filter.length > 0 ? filter.join(' AND ') : undefined,
    });

    return {
      hits: searchResults.hits,
      totalHits: searchResults.estimatedTotalHits ?? searchResults.hits.length,
      processingTimeMs: searchResults.processingTimeMs ?? (Date.now() - startTime),
      query,
    };
  } catch (error) {
    // Graceful fallback to Prisma database search
    console.warn(
      '⚠️ Meilisearch query failed or unreachable, falling back to database query:',
      error instanceof Error ? error.message : error
    );

    const whereClause: Record<string, unknown> = {};

    if (query.trim()) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tagline: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (level) {
      whereClause.level = level;
    }

    if (typeof maxPrice === 'number') {
      whereClause.price = { lte: maxPrice };
    }

    const [dbCourses, total] = await Promise.all([
      prisma.course.findMany({
        where: whereClause,
        include: { instructor: true },
        skip: offset,
        take: limit,
      }),
      prisma.course.count({ where: whereClause }),
    ]);

    const hits: CourseSearchDocument[] = dbCourses.map((c) => ({
      id: c.slug,
      slug: c.slug,
      title: c.title,
      description: c.description || c.tagline || '',
      instructorName: c.instructor?.name || 'Instructor',
      category: c.category,
      level: c.level,
      price: Number(c.price),
      tags: c.tags || [],
      thumbnail: c.image,
    }));

    return {
      hits,
      totalHits: total,
      processingTimeMs: Date.now() - startTime,
      query,
    };
  }
}
