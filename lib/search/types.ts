export interface CourseSearchDocument {
  id: string; // slug
  slug: string;
  title: string;
  description: string;
  instructorName: string;
  category: string;
  level: string;
  price: number;
  tags: string[];
  thumbnail?: string;
}

export interface SearchCoursesParams {
  query: string;
  level?: string;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}

export interface SearchCoursesResponse {
  hits: CourseSearchDocument[];
  totalHits: number;
  processingTimeMs: number;
  query: string;
}
