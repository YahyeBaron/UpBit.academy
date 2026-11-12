import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Strict Coercion Helpers
// ─────────────────────────────────────────────────────────────────────────────

export const strictBooleanSchema = z.preprocess((val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const lower = val.trim().toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
  }
  return val;
}, z.boolean({ message: 'Must be a valid boolean (true or false)' }));

export const strictNonNegativeNumberSchema = z.preprocess((val) => {
  if (val === null || val === undefined || val === '') return undefined;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') return undefined;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : NaN;
  }
  return NaN;
}, z.number({ message: 'Must be a valid finite number' }).min(0, 'Cannot be negative').max(999999, 'Number exceeds maximum limit').refine((n) => Number.isFinite(n), { message: 'Must be a finite number' }));

// ─────────────────────────────────────────────────────────────────────────────
// Course Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const LessonInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Lesson title is required').max(200),
  duration: z.string().trim().default('10m'),
  type: z.enum(['video', 'quiz', 'project']).default('video'),
  preview: strictBooleanSchema.default(false),
  muxPlaybackId: z.string().trim().nullable().optional(),
  order: z.number().int().nonnegative().optional(),
});

export const CurriculumSectionInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Section title is required').max(200),
  order: z.number().int().nonnegative().optional(),
  lessons: z.array(LessonInputSchema).default([]),
});

export const CourseCreateSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').optional(),
  tagline: z.string().trim().max(300).optional().default(''),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  longDescription: z.string().trim().optional().default(''),
  price: strictNonNegativeNumberSchema.default(0),
  originalPrice: strictNonNegativeNumberSchema.optional(),
  category: z.string().trim().max(100).default('frontend'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'All Levels']).default('Beginner'),
  instructorId: z.string().trim().default('yahye'),
  tags: z.preprocess((val) => {
    if (Array.isArray(val)) return val.map((t) => String(t).trim()).filter(Boolean);
    if (typeof val === 'string') return val.split(',').map((t) => t.trim()).filter(Boolean);
    return ['Coding'];
  }, z.array(z.string().max(50))).default(['Coding']),
  image: z.string().trim().max(1000).optional(),
  duration: z.string().trim().default('4h 00m'),
  isPublished: strictBooleanSchema.default(true),
  isComingSoon: strictBooleanSchema.default(false),
  releaseDate: z.string().trim().max(100).nullable().optional(),
  seriesName: z.string().trim().max(100).nullable().optional(),
  seriesOrder: z.coerce.number().int().min(0).nullable().optional(),
  nextCourseSlug: z.string().trim().max(150).nullable().optional(),
  hasCertificate: strictBooleanSchema.default(true),
  totalHours: strictNonNegativeNumberSchema.default(0),
  completionCriteria: z.string().trim().max(1000).default('Complete all lessons and knowledge checks to earn your certificate.'),
  curriculum: z.array(CurriculumSectionInputSchema).optional(),
});

export const CourseUpdateSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200).optional(),
  tagline: z.string().trim().max(300).optional(),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').optional(),
  longDescription: z.string().trim().optional(),
  price: strictNonNegativeNumberSchema.optional(),
  originalPrice: strictNonNegativeNumberSchema.optional(),
  category: z.string().trim().max(100).optional(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'All Levels']).optional(),
  instructorId: z.string().trim().optional(),
  tags: z.preprocess((val) => {
    if (Array.isArray(val)) return val.map((t) => String(t).trim()).filter(Boolean);
    if (typeof val === 'string') return val.split(',').map((t) => t.trim()).filter(Boolean);
    return undefined;
  }, z.array(z.string().max(50)).optional()),
  image: z.string().trim().max(1000).nullable().optional(),
  duration: z.string().trim().optional(),
  isPublished: strictBooleanSchema.optional(),
  isComingSoon: strictBooleanSchema.optional(),
  releaseDate: z.string().trim().max(100).nullable().optional(),
  seriesName: z.string().trim().max(100).nullable().optional(),
  seriesOrder: z.coerce.number().int().min(0).nullable().optional(),
  nextCourseSlug: z.string().trim().max(150).nullable().optional(),
  hasCertificate: strictBooleanSchema.optional(),
  totalHours: strictNonNegativeNumberSchema.optional(),
  completionCriteria: z.string().trim().max(1000).optional(),
  curriculum: z.array(CurriculumSectionInputSchema).optional(),
  totalLessons: z.number().int().nonnegative().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Promo Code Schemas
// ─────────────────────────────────────────────────────────────────────────────

const PromoCodeBaseSchema = z.object({
  code: z
    .string()
    .transform((val) => val.trim().toUpperCase())
    .pipe(
      z
        .string()
        .min(3, 'Code must be at least 3 characters')
        .max(20, 'Code maximum 20 characters')
        .regex(/^[A-Za-z0-9_-]+$/, 'Code can only contain alphanumeric characters, underscores, and hyphens')
    ),
  discount: z.coerce.number().int().min(1, 'Discount percentage must be between 1 and 100').max(100).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED', 'FIXED_AMOUNT']).default('PERCENTAGE'),
  discountValue: z.coerce.number().min(0, 'Discount value cannot be negative').optional(),
  discountAmount: z.coerce.number().min(0, 'Discount amount cannot be negative').nullable().optional(),
  minOrderAmount: z.coerce.number().min(0, 'Minimum order amount cannot be negative').nullable().optional(),
  maxDiscountAmount: z.coerce.number().min(0, 'Maximum discount amount cannot be negative').nullable().optional(),
  applicableCourses: z.array(z.string()).default([]),
  startsAt: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Invalid start date' }),
  expiresAt: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid expiration date' }),
  maxUses: z.coerce.number().int().positive('Max uses must be a positive integer').nullable().optional(),
  maxPerUser: z.coerce.number().int().min(1, 'Max per user must be at least 1').default(1),
  isActive: z.boolean().default(true),
  description: z.string().max(300).optional(),
});

export const PromoCodeCreateSchema = PromoCodeBaseSchema.refine(
  (data) => {
    const type = (data.discountType || 'PERCENTAGE').toUpperCase();
    if (type === 'PERCENTAGE') {
      const val = data.discountValue ?? data.discount ?? 0;
      return val >= 1 && val <= 100;
    }
    if (type === 'FIXED' || type === 'FIXED_AMOUNT') {
      const val = data.discountValue ?? data.discountAmount ?? 0;
      return val >= 0;
    }
    return true;
  },
  {
    message: 'Percentage discount must be between 1 and 100',
    path: ['discount'],
  }
).refine(
  (data) => {
    if (data.startsAt && data.expiresAt) {
      return new Date(data.expiresAt) > new Date(data.startsAt);
    }
    return true;
  },
  {
    message: 'Expiration date must be after start date',
    path: ['expiresAt'],
  }
);

export const PromoCodeUpdateSchema = PromoCodeBaseSchema.partial();

// ─────────────────────────────────────────────────────────────────────────────
// Note Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const NoteCreateSchema = z.object({
  lessonId: z.string().min(1, 'Lesson ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  content: z.string().min(1, 'Note content cannot be empty').max(5000, 'Note content exceeds 5000 characters'),
  videoTime: z.coerce.number().min(0, 'Video time must be non-negative').default(0),
});

export const NoteUpdateSchema = z.object({
  id: z.string().min(1, 'Note ID is required'),
  content: z.string().min(1, 'Note content cannot be empty').max(5000, 'Note content exceeds 5000 characters').optional(),
  videoTime: z.coerce.number().min(0, 'Video time must be non-negative').optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Discussion Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const DiscussionThreadCreateSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  lessonId: z.string().optional().nullable(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title cannot exceed 200 characters'),
  content: z.string().min(5, 'Content must be at least 5 characters').max(10000, 'Content cannot exceed 10000 characters'),
});

export const DiscussionReplyCreateSchema = z.object({
  content: z.string().min(1, 'Reply content cannot be empty').max(5000, 'Reply content cannot exceed 5000 characters'),
});

// ─────────────────────────────────────────────────────────────────────────────
// Quiz & Progress Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const QuizSubmitSchema = z.object({
  answers: z.record(z.string(), z.string()).refine(
    (obj) => Object.keys(obj).length > 0,
    { message: 'At least one answer must be submitted' }
  ),
});

export const ProgressUpdateSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  lessonId: z.string().min(1, 'Lesson ID is required'),
  positionSeconds: z.coerce.number().min(0).optional(),
  durationSeconds: z.coerce.number().min(0).optional(),
  completed: z.boolean().optional(),
  explicitComplete: z.boolean().optional(),
  watchedPct: z.coerce.number().min(0).max(100).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Enrollment & Admin Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const ManualEnrollmentSchema = z.object({
  studentEmail: z.string().email('Invalid student email address'),
  courseSlug: z.string().min(1, 'Course slug is required'),
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED']).default('COMPLETED'),
  amountPaid: z.coerce.number().min(0).default(0),
  provider: z.string().default('MANUAL'),
});

export const UserRoleUpdateSchema = z.object({
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']),
});

export const ResourceCreateSchema = z.object({
  title: z.string().min(2, 'Resource title must be at least 2 characters').max(200),
  url: z.string().url('Must be a valid URL'),
  type: z.enum(['PDF', 'CODE', 'LINK', 'DOCUMENT', 'ARCHIVE', 'OTHER']).default('LINK'),
  courseId: z.string().min(1, 'Course ID is required'),
  lessonId: z.string().optional().nullable(),
  size: z.string().optional(),
});
