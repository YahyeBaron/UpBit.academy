import sanitizeHtml from 'sanitize-html';

export function sanitizeHTML(dirty: string): string {
  if (!dirty) return '';
  return sanitizeHtml(dirty, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'ul', 'ol', 'li', 'code', 'pre'],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
    },
  });
}

export function sanitizeText(text: string): string {
  if (!text) return '';
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}
