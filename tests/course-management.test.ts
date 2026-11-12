import test from 'node:test';
import assert from 'node:assert/strict';
import {
  strictBooleanSchema,
  strictNonNegativeNumberSchema,
  CourseCreateSchema,
  CourseUpdateSchema,
} from '../lib/validation-schemas';
import { getCourseImageUrl, isValidCourseImageUrl, DEFAULT_COURSE_IMAGE } from '../lib/course-image';
import { COURSES } from '../lib/data';

test('Course Management & Settings Test Suite', async (t) => {
  await t.test('1. strictBooleanSchema parsing rules', () => {
    // Exact booleans
    assert.strictEqual(strictBooleanSchema.parse(true), true);
    assert.strictEqual(strictBooleanSchema.parse(false), false);

    // Exact string booleans
    assert.strictEqual(strictBooleanSchema.parse('true'), true);
    assert.strictEqual(strictBooleanSchema.parse('false'), false);
    assert.strictEqual(strictBooleanSchema.parse('TRUE'), true);
    assert.strictEqual(strictBooleanSchema.parse('False'), false);

    // Rejects truthy string coercion anti-patterns
    assert.throws(() => strictBooleanSchema.parse('random_text'));
    assert.throws(() => strictBooleanSchema.parse('1'));
    assert.throws(() => strictBooleanSchema.parse('0'));
    assert.throws(() => strictBooleanSchema.parse(''));
    assert.throws(() => strictBooleanSchema.parse(123));
  });

  await t.test('2. strictNonNegativeNumberSchema validation', () => {
    // Valid numbers
    assert.strictEqual(strictNonNegativeNumberSchema.parse(0), 0);
    assert.strictEqual(strictNonNegativeNumberSchema.parse(49.99), 49.99);
    assert.strictEqual(strictNonNegativeNumberSchema.parse('0'), 0);
    assert.strictEqual(strictNonNegativeNumberSchema.parse('18.5'), 18.5);

    // Rejects negative numbers and invalid numerical formats
    assert.throws(() => strictNonNegativeNumberSchema.parse(-1));
    assert.throws(() => strictNonNegativeNumberSchema.parse('-0.5'));
    assert.throws(() => strictNonNegativeNumberSchema.parse('abc'));
    assert.throws(() => strictNonNegativeNumberSchema.parse(NaN));
    assert.throws(() => strictNonNegativeNumberSchema.parse(Infinity));
  });

  await t.test('3. Course Image Fallback and Validation Rules', () => {
    // Valid image paths
    assert.strictEqual(getCourseImageUrl('/assets/custom.png'), '/assets/custom.png');
    assert.strictEqual(
      getCourseImageUrl('https://utfs.io/f/test-image.webp'),
      'https://utfs.io/f/test-image.webp'
    );
    assert.strictEqual(
      getCourseImageUrl('  https://example.com/image.jpg  '),
      'https://example.com/image.jpg'
    );

    // Fallbacks
    assert.strictEqual(getCourseImageUrl(''), DEFAULT_COURSE_IMAGE);
    assert.strictEqual(getCourseImageUrl('   '), DEFAULT_COURSE_IMAGE);
    assert.strictEqual(getCourseImageUrl(null), DEFAULT_COURSE_IMAGE);
    assert.strictEqual(getCourseImageUrl(undefined), DEFAULT_COURSE_IMAGE);

    // isValidCourseImageUrl
    assert.strictEqual(isValidCourseImageUrl('/assets/test.jpg'), true);
    assert.strictEqual(isValidCourseImageUrl('https://example.com/img.png'), true);
    assert.strictEqual(isValidCourseImageUrl(''), false);
    assert.strictEqual(isValidCourseImageUrl(null), false);
    assert.strictEqual(isValidCourseImageUrl(undefined), false);
  });

  await t.test('4. CourseCreateSchema validates all new fields correctly', () => {
    const validDraftPayload = {
      title: 'Advanced Microfrontends 2026',
      slug: 'advanced-microfrontends-2026',
      tagline: 'Module federation and edge composition',
      category: 'frontend',
      level: 'Advanced',
      price: 49.99,
      originalPrice: 99.99,
      description: 'Master large-scale enterprise frontend architectures.',
      longDescription: 'Deep dive into webpack federation, vite single-spa, and cloudflare workers.',
      tags: ['microfrontends', 'architecture', 'typescript'],
      image: 'https://utfs.io/f/banner.png',
      duration: '22h 30m',
      isPublished: false,
      hasCertificate: true,
      totalHours: 22.5,
      completionCriteria: 'Complete all modules and submit final capstone repo.',
    };

    const parsed = CourseCreateSchema.parse(validDraftPayload);
    assert.strictEqual(parsed.title, validDraftPayload.title);
    assert.strictEqual(parsed.slug, validDraftPayload.slug);
    assert.strictEqual(parsed.isPublished, false);
    assert.strictEqual(parsed.hasCertificate, true);
    assert.strictEqual(parsed.totalHours, 22.5);
    assert.strictEqual(parsed.completionCriteria, validDraftPayload.completionCriteria);
    assert.strictEqual(parsed.price, 49.99);
  });

  await t.test('5. CourseCreateSchema rejects invalid slug or missing required fields', () => {
    // Invalid slug with spaces or uppercase
    assert.throws(() =>
      CourseCreateSchema.parse({
        title: 'Invalid Slug Course',
        slug: 'Invalid Slug With Spaces!',
        description: 'Test description',
      })
    );

    // Missing title
    assert.throws(() =>
      CourseCreateSchema.parse({
        slug: 'missing-title-course',
        description: 'Test description',
      })
    );

    // Negative totalHours
    assert.throws(() =>
      CourseCreateSchema.parse({
        title: 'Negative Hours Course',
        slug: 'negative-hours',
        description: 'Test description',
        totalHours: -5,
      })
    );
  });

  await t.test('6. CourseUpdateSchema parses partial updates with strict booleans', () => {
    // Publishing a draft course via string boolean
    const updatePayload1 = {
      isPublished: 'true',
      hasCertificate: 'false',
      totalHours: '15.5',
    };
    const parsed1 = CourseUpdateSchema.parse(updatePayload1);
    assert.strictEqual(parsed1.isPublished, true);
    assert.strictEqual(parsed1.hasCertificate, false);
    assert.strictEqual(parsed1.totalHours, 15.5);

    // Unpublishing a course via boolean
    const updatePayload2 = {
      isPublished: false,
      completionCriteria: 'Pass the 50-question final exam with at least 85%.',
    };
    const parsed2 = CourseUpdateSchema.parse(updatePayload2);
    assert.strictEqual(parsed2.isPublished, false);
    assert.strictEqual(parsed2.completionCriteria, 'Pass the 50-question final exam with at least 85%.');
  });

  await t.test('7. Static Course fixtures have complete contracts and default settings', () => {
    assert.ok(COURSES.length > 0, 'Static course catalog has entries');
    for (const course of COURSES) {
      assert.ok(course.slug, 'Course has a slug');
      assert.ok(course.title, 'Course has a title');
      assert.strictEqual(typeof course.hasCertificate, 'boolean', `Course ${course.slug} has boolean hasCertificate`);
      assert.strictEqual(typeof course.totalHours, 'number', `Course ${course.slug} has numeric totalHours`);
      assert.ok(course.totalHours >= 0, `Course ${course.slug} totalHours is non-negative`);
      assert.strictEqual(typeof course.completionCriteria, 'string', `Course ${course.slug} has string completionCriteria`);
      assert.ok(course.image, `Course ${course.slug} has image`);
      assert.strictEqual(typeof course.price, 'number', `Course ${course.slug} price is a number`);
    }
  });

  await t.test('8. Course schemas support isComingSoon and releaseDate parameters', () => {
    // Creating a coming soon course
    const newCoursePayload = {
      title: 'Rust for High-Frequency Systems',
      slug: 'rust-hft-systems',
      description: 'Master systems programming and low latency engineering.',
      isPublished: true,
      isComingSoon: true,
      releaseDate: 'November 2026',
    };
    const created = CourseCreateSchema.parse(newCoursePayload);
    assert.strictEqual(created.isPublished, true);
    assert.strictEqual(created.isComingSoon, true);
    assert.strictEqual(created.releaseDate, 'November 2026');

    // Updating a course to Coming Soon with target month
    const updatePayload = {
      isComingSoon: 'true',
      releaseDate: 'October 2026',
    };
    const updated = CourseUpdateSchema.parse(updatePayload);
    assert.strictEqual(updated.isComingSoon, true);
    assert.strictEqual(updated.releaseDate, 'October 2026');

    // Resetting back to live published
    const resetPayload = {
      isComingSoon: false,
      releaseDate: null,
    };
    const reset = CourseUpdateSchema.parse(resetPayload);
    assert.strictEqual(reset.isComingSoon, false);
    assert.strictEqual(reset.releaseDate, null);
  });

  await t.test('9. Course schemas support seriesName, seriesOrder, and nextCourseSlug for learning tracks', () => {
    // Week 0 Scratch in CS50 track
    const scratchPayload = {
      title: 'CS50 Week 0: Scratch',
      slug: 'cs50-week-0-scratch',
      description: 'An introduction to the intellectual enterprises of computer science.',
      seriesName: 'CS50 Computer Science',
      seriesOrder: 0,
      nextCourseSlug: 'cs50-week-1-c',
    };
    const parsedScratch = CourseCreateSchema.parse(scratchPayload);
    assert.strictEqual(parsedScratch.seriesName, 'CS50 Computer Science');
    assert.strictEqual(parsedScratch.seriesOrder, 0);
    assert.strictEqual(parsedScratch.nextCourseSlug, 'cs50-week-1-c');

    // Updating a course with series position and stringified order
    const updateSeriesPayload = {
      seriesName: 'Full-Stack JavaScript Track',
      seriesOrder: '3',
      nextCourseSlug: 'fullstack-js-part-4',
    };
    const parsedUpdate = CourseUpdateSchema.parse(updateSeriesPayload);
    assert.strictEqual(parsedUpdate.seriesName, 'Full-Stack JavaScript Track');
    assert.strictEqual(parsedUpdate.seriesOrder, 3);
    assert.strictEqual(parsedUpdate.nextCourseSlug, 'fullstack-js-part-4');

    // Resetting / removing series data
    const clearSeriesPayload = {
      seriesName: null,
      seriesOrder: null,
      nextCourseSlug: null,
    };
    const parsedClear = CourseUpdateSchema.parse(clearSeriesPayload);
    assert.strictEqual(parsedClear.seriesName, null);
    assert.strictEqual(parsedClear.seriesOrder, null);
    assert.strictEqual(parsedClear.nextCourseSlug, null);
  });
});
