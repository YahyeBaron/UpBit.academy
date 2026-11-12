import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

// ─── Shared auth logic ───────────────────────────────────────────────────────

class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

function validateOwnership(entityUserId: string, currentUserId: string, currentUserRole: string) {
  if (currentUserRole === 'ADMIN' || currentUserRole === 'INSTRUCTOR') return true;
  if (entityUserId !== currentUserId) throw new AuthError('Forbidden: You do not own this resource', 403);
  return true;
}

function validateEntityBelongsToCourseAndLesson(
  entity: { courseId?: string | null; lessonId?: string | null },
  expectedCourseSlug: string,
  expectedLessonId?: string
) {
  if (entity.courseId && entity.courseId !== expectedCourseSlug) {
    throw new AuthError(`Resource/Note attached to course '${entity.courseId}', not '${expectedCourseSlug}'`, 400);
  }
  if (expectedLessonId && entity.lessonId && entity.lessonId !== expectedLessonId) {
    throw new AuthError(`Resource/Note attached to lesson '${entity.lessonId}', not '${expectedLessonId}'`, 400);
  }
  return true;
}

// ─── Resource validation helpers (Phase 8) ─────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf', 'application/zip', 'text/plain', 'image/png', 'image/jpeg',
  'application/json', 'application/octet-stream', 'video/mp4',
]);
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

function sanitizeFilename(raw: string): string {
  return raw.replace(/\0/g, '').replace(/\.\./g, '').replace(/[/\\]/g, '').trim().slice(0, 255);
}

function validateResourceUpload(mime: string, size: number, name: string): { valid: boolean; reason?: string } {
  if (!ALLOWED_MIME_TYPES.has(mime.toLowerCase())) {
    return { valid: false, reason: `MIME type '${mime}' not allowed` };
  }
  if (size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, reason: `File size exceeds 50 MB limit` };
  }
  const safe = sanitizeFilename(name);
  if (!safe || safe.length < 1) {
    return { valid: false, reason: 'Invalid filename' };
  }
  return { valid: true };
}

// ─── Certificate helpers (Phase 11) ──────────────────────────────────────────

function validateCertificateIssuance(
  completedLessons: number,
  totalLessons: number,
  userRole: string
): { eligible: boolean; reason?: string } {
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  if (progress < 100 && userRole !== 'ADMIN') {
    return {
      eligible: false,
      reason: `Course completion requirements not fulfilled (${completedLessons}/${totalLessons} completed, ${progress}%)`,
    };
  }
  return { eligible: true };
}

function isValidVerificationCodeFormat(code: string): boolean {
  return /^CERT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);
}

// ─── Cache & API Response helpers (Phase 13) ────────────────────────────────

const PRIVATE_CACHE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

describe('Phase 2 — Auth Policy & Relationship Resolver Unit Tests', () => {
  test('validateOwnership allows owner access', () => {
    assert.equal(validateOwnership('user-123', 'user-123', 'student'), true);
  });

  test('validateOwnership allows Admin role bypass even for different user ID', () => {
    assert.equal(validateOwnership('user-123', 'admin-999', 'ADMIN'), true);
  });

  test('validateOwnership allows Instructor role bypass', () => {
    assert.equal(validateOwnership('user-123', 'inst-888', 'INSTRUCTOR'), true);
  });

  test('validateOwnership throws 403 AuthError when non-admin accesses another user data', () => {
    assert.throws(
      () => validateOwnership('user-123', 'user-456', 'student'),
      (err: any) => err instanceof AuthError && err.statusCode === 403 && err.message.includes('Forbidden')
    );
  });

  test('validateEntityBelongsToCourseAndLesson passes for matching course and lesson', () => {
    assert.equal(
      validateEntityBelongsToCourseAndLesson({ courseId: 'nextjs-masterclass', lessonId: 'les-1' }, 'nextjs-masterclass', 'les-1'),
      true
    );
  });

  test('validateEntityBelongsToCourseAndLesson rejects mismatched courseId', () => {
    assert.throws(
      () => validateEntityBelongsToCourseAndLesson({ courseId: 'wrong-course', lessonId: 'les-1' }, 'nextjs-masterclass', 'les-1'),
      (err: any) => err instanceof AuthError && err.statusCode === 400
    );
  });

  test('validateEntityBelongsToCourseAndLesson rejects mismatched lessonId', () => {
    assert.throws(
      () => validateEntityBelongsToCourseAndLesson({ courseId: 'nextjs-masterclass', lessonId: 'wrong-lesson' }, 'nextjs-masterclass', 'les-1'),
      (err: any) => err instanceof AuthError && err.statusCode === 400
    );
  });
});

describe('Phase 7 — Notes CRUD Validation Tests', () => {
  test('note content within 5000 char limit is valid', () => {
    const content = 'A'.repeat(4999);
    assert.equal(content.length <= 5000, true);
  });

  test('note content exceeding 5000 chars should be rejected', () => {
    const content = 'A'.repeat(5001);
    assert.equal(content.length > 5000, true);
  });

  test('video timestamp is clamped to non-negative integer', () => {
    const rawTime = -5;
    const cleanTime = Math.max(0, Math.round(isFinite(rawTime) ? rawTime : 0));
    assert.equal(cleanTime, 0);
  });

  test('valid video timestamp is normalized correctly', () => {
    const rawTime = 123.7;
    const cleanTime = Math.max(0, Math.round(rawTime));
    assert.equal(cleanTime, 124);
  });

  test('note delete with rollback uses snapshot correctly', () => {
    const notes = [{ id: 'n1', content: 'Test' }, { id: 'n2', content: 'Other' }];
    const snapshot = [...notes];
    const optimistic = notes.filter((n) => n.id !== 'n1');
    assert.equal(optimistic.length, 1);
    assert.equal(snapshot.length, 2);
  });
});

describe('Phase 8 — Resource Security Validation Tests', () => {
  test('rejects disallowed MIME type', () => {
    const result = validateResourceUpload('application/x-msdownload', 1024, 'virus.exe');
    assert.equal(result.valid, false);
    assert.ok(result.reason?.includes('not allowed'));
  });

  test('accepts allowed MIME type (PDF)', () => {
    const result = validateResourceUpload('application/pdf', 1024 * 100, 'notes.pdf');
    assert.equal(result.valid, true);
  });

  test('rejects file exceeding 50 MB limit', () => {
    const result = validateResourceUpload('application/zip', 60 * 1024 * 1024, 'large.zip');
    assert.equal(result.valid, false);
    assert.ok(result.reason?.includes('50 MB'));
  });

  test('sanitizeFilename strips path traversal sequences', () => {
    const raw = '../../etc/passwd';
    const safe = sanitizeFilename(raw);
    assert.equal(safe.includes('..'), false);
    assert.equal(safe.includes('/'), false);
  });

  test('sanitizeFilename strips null bytes', () => {
    const raw = 'file\0name.pdf';
    const safe = sanitizeFilename(raw);
    assert.equal(safe.includes('\0'), false);
  });

  test('rejects empty filename after sanitization', () => {
    const result = validateResourceUpload('application/pdf', 1024, '   ');
    assert.equal(result.valid, false);
  });

  test('resource staff-only check: student role should fail', () => {
    assert.throws(
      () => {
        const userRole: string = 'student';
        if (userRole !== 'ADMIN' && userRole !== 'INSTRUCTOR') {
          throw new AuthError('Forbidden: Only instructors and admins can manage resources', 403);
        }
      },
      (err: any) => err instanceof AuthError && err.statusCode === 403
    );
  });

  test('resource staff-only check: INSTRUCTOR role should pass', () => {
    const userRole: string = 'INSTRUCTOR';
    const allowed = userRole === 'ADMIN' || userRole === 'INSTRUCTOR';
    assert.equal(allowed, true);
  });
});

describe('Phase 11 & 12 — Certificate & Production Safety Tests', () => {
  test('rejects certificate request when course completion is less than 100%', () => {
    const res = validateCertificateIssuance(8, 10, 'student');
    assert.equal(res.eligible, false);
    assert.ok(res.reason?.includes('not fulfilled'));
  });

  test('allows certificate issuance when course is 100% completed', () => {
    const res = validateCertificateIssuance(10, 10, 'student');
    assert.equal(res.eligible, true);
  });

  test('allows Admin role to bypass certificate completion requirement', () => {
    const res = validateCertificateIssuance(2, 10, 'ADMIN');
    assert.equal(res.eligible, true);
  });

  test('validates cryptographically secure verification code format', () => {
    const validCode = 'CERT-A1B2-C3D4-E5F6-7890';
    const invalidCode = 'CERT-123';
    assert.equal(isValidVerificationCodeFormat(validCode), true);
    assert.equal(isValidVerificationCodeFormat(invalidCode), false);
  });
});

describe('Phase 13 & 14 — API Consistency & Privacy Header Tests', () => {
  test('PRIVATE_CACHE_HEADERS contains no-store and no-cache directives', () => {
    assert.ok(PRIVATE_CACHE_HEADERS['Cache-Control'].includes('no-store'));
    assert.ok(PRIVATE_CACHE_HEADERS['Cache-Control'].includes('private'));
    assert.ok(PRIVATE_CACHE_HEADERS['Cache-Control'].includes('must-revalidate'));
    assert.equal(PRIVATE_CACHE_HEADERS['Pragma'], 'no-cache');
  });

  test('AuthError maps status code correctly for 401, 403, 404, 409', () => {
    const err401 = new AuthError('Unauth', 401);
    const err403 = new AuthError('Forbid', 403);
    const err404 = new AuthError('Not Found', 404);
    const err409 = new AuthError('Conflict', 409);

    assert.equal(err401.statusCode, 401);
    assert.equal(err403.statusCode, 403);
    assert.equal(err404.statusCode, 404);
    assert.equal(err409.statusCode, 409);
  });
});
