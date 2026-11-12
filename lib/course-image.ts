/**
 * Standardized course image resolver and fallback contract.
 *
 * Contract:
 * - If image is a valid non-empty string, it is used directly (preserves exact UploadThing / assets / external URLs).
 * - Fallback default '/assets/w-rc.jpg' is used ONLY when image is missing, null, undefined, or empty/whitespace.
 */

export const DEFAULT_COURSE_IMAGE = '/assets/w-rc.jpg';

export function getCourseImageUrl(image?: string | null): string {
  if (!image) return DEFAULT_COURSE_IMAGE;
  const trimmed = image.trim();
  if (trimmed.length === 0) return DEFAULT_COURSE_IMAGE;
  return trimmed;
}

export function isValidCourseImageUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Local assets or UploadThing / remote HTTP(S) URLs
  if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return true;
  }
  return false;
}
