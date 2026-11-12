# Diagnostic Report: Catalog Data Synchronization & Checkout Hardening

## 1. Schema & Database Models
- **Database Architecture**: PostgreSQL (Neon Serverless) managed via Prisma ORM.
- **Core Entities**:
  - `Course`: Contains `slug` (unique identifier), `title`, `price`, `isPublished`, `isDeleted`, `lastUpdated`, and relation to `CurriculumSection` and `Instructor`.
  - `CurriculumSection` & `Lesson`: Define course structure and curriculum ordering.
  - `Enrollment`: Composite primary key `[userId, courseId]` (`courseId` maps to `Course.slug`). Contains `paymentStatus`, `transactionRef`, `provider`, `amountPaid`.
  - `PromoCode` & `PromoCodeUsage`: Handles discount codes, expiration, max usage, and per-user usage tracking.

## 2. Cache Behavior & Freshness Strategy
- **Data Helper Layer (`lib/db-data.ts`)**:
  - Functions like `getCoursesAsync()` and `getCourseAndInstructorAsync()` wrap Prisma DB calls with React `cache()`.
  - **Issue Identified**: React `cache()` memoizes requests during a single render cycle, but Next.js App Router route segment caching can retain statically generated rendered output unless dynamic rendering is configured or invalidation triggers.
  - **Resolution**: Added `unstable_noStore()` inside `getCoursesAsync()` and `getCourseAndInstructorAsync()`, and declared `export const dynamic = 'force-dynamic'` and `export const revalidate = 0` on catalog and detail route pages.

## 3. Route & Render Trace

```
[ Admin Action: PUT /api/admin/courses/[slug] ]
       │
       ├── 1. Validate price (must be finite non-negative number)
       ├── 2. Prisma Transaction: Update Course + Replace CurriculumSections
       └── 3. Cache Invalidation: revalidatePath('/courses'), revalidatePath('/courses/[slug]')
                                        │
                                        ▼
[ Public User Request: GET /courses ] ──► Async Server Component (app/courses/page.tsx)
                                        │
                                        ├── 1. Calls noStore() + getCoursesAsync()
                                        ├── 2. Queries Prisma DB (prisma.course.findMany)
                                        └── 3. Renders <CoursesCatalogClient initialCourses={courses} />
```

- **Catalog Page (`app/courses/page.tsx`)**:
  - *Before*: Marked `'use client'`, directly imported static `COURSES` array from `@/lib/data`. Admin DB edits were invisible on `/courses`.
  - *After*: Async Server Component, loads `getCoursesAsync()` on each request, and passes DB courses into `<CoursesCatalogClient />` for client-side search/filter/sort.
- **Course Detail (`app/courses/[slug]/page.tsx`)**:
  - *Before*: Had static parameterization without dynamic revalidation hooks.
  - *After*: Enforced dynamic request freshness with `export const dynamic = 'force-dynamic'` and `noStore()`.
- **Admin Edit Handler (`app/api/admin/courses/[slug]/route.ts`)**:
  - *Before*: Non-transactional price parsing with `parseFloat(price)`, missing path invalidation.
  - *After*: Validates `price` as a finite non-negative number (returns `400` if invalid), wraps DB updates in `prisma.$transaction`, and calls `revalidatePath` for `/courses`, `/courses/[slug]`, `/admin/courses`, `/admin/courses/[slug]/edit`, and `/admin`.
- **Sifalo Checkout Handler (`app/api/checkout/sifalo/route.ts`)**:
  - *Before*: Allowed fallback to static `COURSES` when DB mode was active if course wasn't found in DB; did not strictly enforce DB resolution on all actions.
  - *After*: Added `resolveServerCourse(slug)`. In DB mode, rejects missing DB courses immediately with `404` (`"Course not found in database."`). Never trusts client amount/price fields, calculates promo against server price, and passes authoritative `finalPrice` to Sifalo gateway payloads and enrollment records.

## 4. Root Cause Analysis
1. **Catalog Bug**: `app/courses/page.tsx` was a client component importing static mock data (`COURSES`), completely bypassing database queries. Thus, any course updates saved to PostgreSQL by admin PUT requests were never reflected in the catalog UI.
2. **Stale Route Caching**: Routes were statically evaluated or cached without explicit dynamic route declarations (`export const dynamic = 'force-dynamic'`) or cache invalidation calls (`revalidatePath`).
3. **Checkout Vulnerability & Inconsistency**: Sifalo checkout could silently fall back to static prices if a course was missing from DB, and lacked server-authoritative enforcement for amount parameters.

## 5. Applied Fixes & Verification Summary
- **Fix 1**: Converted `app/courses/page.tsx` to Server Component, created `components/courses-catalog-client.tsx` for client interactivity over server-fetched DB courses.
- **Fix 2**: Added `noStore()` and dynamic route flags to `/courses` and `/courses/[slug]`.
- **Fix 3**: Hardened admin PUT handler with price validation (`parsedPrice >= 0` & `Number.isFinite`), transactional persistence (`prisma.$transaction`), and revalidation of all affected routes via `revalidatePath`.
- **Fix 4**: Hardened Sifalo checkout API (`/api/checkout/sifalo`) with strict database-authoritative course resolution and price calculation across `DIRECT_PAY`, `HOSTED_CHECKOUT`, `VERIFY`, and `GET` verification.
- **Fix 5**: Added this diagnostic report (`DIAGNOSTIC_REPORT.md`).
- **Verification**: Verified using TypeScript type-checking, ESLint, Next.js build checks, and git diff inspection.
