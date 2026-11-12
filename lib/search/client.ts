import { Meilisearch } from 'meilisearch';

let client: Meilisearch | null = null;

export const COURSES_INDEX = 'courses';

export function getMeilisearchClient(): Meilisearch {
  if (!client) {
    const host =
      process.env.MEILISEARCH_URL ||
      process.env.NEXT_PUBLIC_MEILISEARCH_URL ||
      'http://localhost:7700';
    const apiKey =
      process.env.MEILISEARCH_MASTER_KEY ||
      process.env.MEILISEARCH_API_KEY ||
      'masterKey';

    client = new Meilisearch({
      host,
      apiKey,
    });
  }

  return client;
}
