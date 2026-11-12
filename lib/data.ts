// ═══════════════════════════════════════════
// BIT Academy — Shared Mock Data
// ═══════════════════════════════════════════

export interface Course {
  slug: string;
  title: string;
  tagline: string;
  category: 'frontend' | '3d' | 'saas' | 'career';
  image: string;
  description: string;
  longDescription: string;
  instructorId: string;
  instructors: string[];
  instructorAvatars?: string[];
  rating: number;
  reviews: number;
  students: number;
  duration: string;
  totalLessons: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  price: number;
  originalPrice: number;
  tags: string[];
  lastUpdated: string;
  includes: string[];
  whatYouLearn: string[];
  curriculum: CurriculumSection[];
  hasCertificate: boolean;
  totalHours: number;
  completionCriteria: string;
  isPublished?: boolean;
  isComingSoon?: boolean;
  releaseDate?: string;
  waitlistCount?: number;
  seriesName?: string;
  seriesOrder?: number;
  nextCourseSlug?: string;
  isDeleted?: boolean;
}

export interface CurriculumSection {
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'quiz' | 'project';
  preview?: boolean;
  completed?: boolean;
  muxPlaybackId?: string;
}

export interface Instructor {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar: string;
  cover: string;
  rating: number;
  reviews: number;
  students: number;
  courses: number;
  expertise: string[];
  social: { github?: string; twitter?: string; linkedin?: string };
}

// ───────────────────────────────────────────
// INSTRUCTORS
// ───────────────────────────────────────────
export const INSTRUCTORS: Instructor[] = [
  {
    id: 'yahye',
    name: 'Yahye Baron',
    title: 'Full-Stack Engineer & Creative Developer',
    bio: 'Senior software architect with 8+ years building production SaaS platforms, 3D WebGL experiences, and high-performance Next.js applications. Founded BIT Academy to share real-world engineering patterns.',
    avatar: '/assets/pri-next.jpg',
    cover: '/assets/The20Ultimate20Next.png',
    rating: 4.97,
    reviews: 4200,
    students: 32000,
    courses: 5,
    expertise: ['Next.js 15', 'Three.js', 'TypeScript', 'System Design'],
    social: { github: '#', twitter: '#', linkedin: '#' },
  },
  {
    id: 'alex',
    name: 'Alex Rivera',
    title: 'WebGL Specialist & GSAP Animator',
    bio: 'Creative developer specializing in immersive 3D web experiences and GSAP animation systems. Delivered award-winning interactive campaigns for Fortune 500 brands.',
    avatar: '/assets/pri-gsap.jpg',
    cover: '/assets/GSAP20Pro3A20Animate20Like20a20Boss20F09F9A80.png',
    rating: 4.92,
    reviews: 2100,
    students: 18500,
    courses: 3,
    expertise: ['GSAP', 'Three.js', 'WebGL', 'Creative CSS'],
    social: { github: '#', twitter: '#', linkedin: '#' },
  },
  {
    id: 'sarah',
    name: 'Sarah Kim',
    title: 'SaaS Founder & Backend Architect',
    bio: 'Built and sold two B2B SaaS products. Now teaches developers to launch production-ready SaaS with Prisma, Stripe, and Next.js Server Actions.',
    avatar: '/assets/pri-js.jpg',
    cover: '/assets/Build202620Launch20Your20SaaS20in20Under20720Days.png',
    rating: 4.95,
    reviews: 1800,
    students: 12000,
    courses: 2,
    expertise: ['SaaS', 'Prisma ORM', 'Stripe Payments', 'Postgres'],
    social: { github: '#', twitter: '#', linkedin: '#' },
  },
];

// ───────────────────────────────────────────
// COURSES
// ───────────────────────────────────────────
export const COURSES: Course[] = [
  {
    slug: 'ultimate-nextjs-guide',
    title: 'The Ultimate Next.js 15 Guide',
    tagline: 'Master App Router, Server Actions & production deployment',
    category: 'frontend',
    image: '/assets/The20Ultimate20Next.png',
    description: 'Master Next.js 15 from zero to production deployment.',
    longDescription: 'The most comprehensive Next.js 15 course available. Covers App Router, Server Components, Server Actions, Parallel Routes, caching strategies, and deploying to Vercel with CI/CD.',
    instructorId: 'yahye',
    instructors: ['/assets/pri-next.jpg', '/assets/pri-js.jpg'],
    rating: 4.9,
    reviews: 1420,
    students: 9800,
    duration: '18h 30m',
    totalLessons: 94,
    level: 'Intermediate',
    price: 29,
    originalPrice: 99,
    tags: ['Next.js', 'React', 'TypeScript', 'App Router'],
    lastUpdated: 'July 2026',
    includes: ['94 HD video lessons', 'Source code repository', 'Lifetime access', 'Certificate of completion', 'Private Discord access'],
    whatYouLearn: [
      'Build full-stack apps with Next.js 15 App Router',
      'Use Server Actions for secure form & data mutations',
      'Implement advanced caching strategies',
      'Deploy to Vercel with CI/CD pipelines',
      'Design scalable file-based routing systems',
      'Integrate authentication with NextAuth.js',
    ],
    hasCertificate: true,
    totalHours: 18.5,
    completionCriteria: 'Complete all 94 lessons and pass the final knowledge check with 80% or higher.',
    isPublished: true,
    isDeleted: false,
    curriculum: [
      {
        title: 'Module 1: App Router Fundamentals',
        lessons: [
          { id: 'l1', title: 'Introduction & Project Setup', duration: '8:30', type: 'video', preview: true, muxPlaybackId: 'EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI600kE00MQ' },
          { id: 'l2', title: 'File-based Routing Deep Dive', duration: '14:20', type: 'video', muxPlaybackId: 'EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI600kE00MQ' },
          { id: 'l3', title: 'Layouts & Templates', duration: '11:45', type: 'video' },
          { id: 'l4', title: 'Module 1 Quiz', duration: '5:00', type: 'quiz' },
        ],
      },
      {
        title: 'Module 2: Server & Client Components',
        lessons: [
          { id: 'l5', title: 'When to use Server vs Client', duration: '12:10', type: 'video', preview: true },
          { id: 'l6', title: 'Data Fetching Patterns', duration: '18:40', type: 'video' },
          { id: 'l7', title: 'Suspense & Streaming', duration: '16:00', type: 'video' },
        ],
      },
      {
        title: 'Module 3: Server Actions & Forms',
        lessons: [
          { id: 'l8', title: 'Introduction to Server Actions', duration: '10:30', type: 'video' },
          { id: 'l9', title: 'Progressive Enhancement Forms', duration: '20:15', type: 'video' },
          { id: 'l10', title: 'Build a Real CRUD App', duration: '35:00', type: 'project' },
        ],
      },
      {
        title: 'Module 4: Production Deployment',
        lessons: [
          { id: 'l11', title: 'Vercel Deployment & CI/CD', duration: '15:00', type: 'video' },
          { id: 'l12', title: 'Performance Monitoring', duration: '12:30', type: 'video' },
        ],
      },
    ],
  },
  {
    slug: 'saas-launch-masterclass',
    title: 'Build & Launch Your SaaS',
    tagline: 'Go from idea to paying customers in 7 days',
    category: 'saas',
    image: '/assets/Build202620Launch20Your20SaaS20in20Under20720Days.png',
    description: 'Build a production SaaS product with Stripe, Prisma & Next.js.',
    longDescription: 'The end-to-end SaaS development course. Build a real subscription-based product with authentication, Stripe billing, Prisma database, email notifications, and a production admin dashboard.',
    instructorId: 'sarah',
    instructors: ['/assets/pri-next.jpg', '/assets/pri-threejs.jpg'],
    rating: 4.95,
    reviews: 980,
    students: 6200,
    duration: '24h 00m',
    totalLessons: 112,
    level: 'Advanced',
    price: 33,
    originalPrice: 119,
    tags: ['SaaS', 'Stripe', 'Prisma', 'PostgreSQL'],
    lastUpdated: 'June 2026',
    includes: ['112 HD video lessons', 'Complete SaaS starter kit', 'Stripe integration guide', 'Private Discord access', 'Certificate'],
    whatYouLearn: [
      'Build a complete B2B SaaS product from scratch',
      'Implement Stripe subscriptions & billing portals',
      'Design a scalable database schema with Prisma',
      'Set up role-based access control',
      'Send transactional emails with Resend',
      'Launch and market your SaaS product',
    ],
    hasCertificate: true,
    totalHours: 24,
    completionCriteria: 'Complete all 112 lessons and deploy your SaaS capstone project.',
    isPublished: true,
    isDeleted: false,
    curriculum: [
      {
        title: 'Module 1: SaaS Architecture',
        lessons: [
          { id: 's1', title: 'SaaS Business Model Overview', duration: '10:00', type: 'video', preview: true },
          { id: 's2', title: 'Tech Stack Selection', duration: '8:30', type: 'video' },
          { id: 's3', title: 'Database Schema Design', duration: '22:15', type: 'video' },
        ],
      },
      {
        title: 'Module 2: Authentication & Authorization',
        lessons: [
          { id: 's4', title: 'NextAuth.js Setup', duration: '18:00', type: 'video' },
          { id: 's5', title: 'Role-Based Access Control', duration: '15:30', type: 'video' },
        ],
      },
      {
        title: 'Module 3: Stripe Integration',
        lessons: [
          { id: 's6', title: 'Stripe Products & Pricing', duration: '14:00', type: 'video' },
          { id: 's7', title: 'Webhooks & Billing Portal', duration: '20:00', type: 'video' },
          { id: 's8', title: 'Build Subscription Flow', duration: '40:00', type: 'project' },
        ],
      },
    ],
  },
  {
    slug: 'gsap-pro-animations',
    title: 'GSAP Pro Animations',
    tagline: 'Animate like a boss with scroll-triggered effects',
    category: '3d',
    image: '/assets/GSAP20Pro3A20Animate20Like20a20Boss20F09F9A80.png',
    description: 'Build jaw-dropping scroll-triggered animations with GSAP.',
    longDescription: 'Master GreenSock Animation Platform from beginner to advanced. Learn ScrollTrigger, timeline animations, morphing SVG, and create portfolio-worthy interactive experiences that land you creative developer roles.',
    instructorId: 'alex',
    instructors: ['/assets/pri-gsap.jpg'],
    rating: 4.88,
    reviews: 750,
    students: 5100,
    duration: '14h 15m',
    totalLessons: 68,
    level: 'All Levels',
    price: 29,
    originalPrice: 89,
    tags: ['GSAP', 'ScrollTrigger', 'SVG', 'Animation'],
    lastUpdated: 'May 2026',
    includes: ['68 HD video lessons', 'GSAP plugin access', 'Animation starter kit', 'Lifetime access', 'Certificate'],
    whatYouLearn: [
      'Master GSAP core API and timelines',
      'Build advanced ScrollTrigger animations',
      'Animate SVG paths and morphing transitions',
      'Create smooth page transitions',
      'Integrate GSAP with React and Next.js',
      'Build a premium animated portfolio',
    ],
    hasCertificate: true,
    totalHours: 14.25,
    completionCriteria: 'Complete all 68 interactive animation exercises.',
    isPublished: true,
    isDeleted: false,
    curriculum: [
      {
        title: 'Module 1: GSAP Fundamentals',
        lessons: [
          { id: 'g1', title: 'GSAP Core Concepts', duration: '12:00', type: 'video', preview: true },
          { id: 'g2', title: 'Timelines & Sequencing', duration: '18:30', type: 'video' },
          { id: 'g3', title: 'Easing Functions Deep Dive', duration: '10:00', type: 'video' },
        ],
      },
      {
        title: 'Module 2: ScrollTrigger Mastery',
        lessons: [
          { id: 'g4', title: 'ScrollTrigger Basics', duration: '15:00', type: 'video', preview: true },
          { id: 'g5', title: 'Pinning & Scrubbing', duration: '22:00', type: 'video' },
          { id: 'g6', title: 'Parallax Effects', duration: '18:00', type: 'video' },
        ],
      },
    ],
  },
  {
    slug: 'vanilla-threejs-course',
    title: 'Vanilla Three.js & WebGL Shaders',
    tagline: 'Master 3D programming and GLSL shaders from scratch',
    category: '3d',
    image: '/assets/Vanilla20Three.png',
    description: 'Master 3D WebGL programming and GLSL shaders on the browser.',
    longDescription: 'The complete Three.js course from zero. Learn scene setup, geometries, lighting, textures, custom GLSL shaders, post-processing, physics, and building production-ready interactive 3D web experiences.',
    instructorId: 'alex',
    instructors: ['/assets/pri-threejs.jpg'],
    rating: 4.94,
    reviews: 890,
    students: 6700,
    duration: '20h 45m',
    totalLessons: 98,
    level: 'Advanced',
    price: 33,
    originalPrice: 109,
    tags: ['Three.js', 'WebGL', 'GLSL', '3D'],
    lastUpdated: 'July 2026',
    includes: ['98 HD video lessons', 'Shader starter kit', '3D model assets', 'Private Discord access', 'Certificate'],
    whatYouLearn: [
      'Set up Three.js scenes with cameras and lighting',
      'Work with geometries, materials, and textures',
      'Write custom GLSL vertex and fragment shaders',
      'Implement post-processing effects',
      'Add physics with Cannon.js',
      'Build a production 3D product showcase',
    ],
    hasCertificate: true,
    totalHours: 20.75,
    completionCriteria: 'Complete all 98 lessons and submit a 3D WebGL showcase.',
    isPublished: true,
    isDeleted: false,
    curriculum: [
      {
        title: 'Module 1: Three.js Foundations',
        lessons: [
          { id: 't1', title: 'Scene, Camera & Renderer', duration: '15:00', type: 'video', preview: true },
          { id: 't2', title: 'Geometries & Materials', duration: '20:00', type: 'video' },
          { id: 't3', title: 'Lighting & Shadows', duration: '18:00', type: 'video' },
        ],
      },
      {
        title: 'Module 2: GLSL Shader Programming',
        lessons: [
          { id: 't4', title: 'Introduction to GLSL', duration: '22:00', type: 'video' },
          { id: 't5', title: 'Vertex Shader Techniques', duration: '25:00', type: 'video' },
          { id: 't6', title: 'Fragment Shaders & Noise', duration: '28:00', type: 'video' },
        ],
      },
    ],
  },
  {
    slug: 'dev-career-accelerator',
    title: 'Dev Career Accelerator',
    tagline: 'Land your first or next high-paying developer role',
    category: 'career',
    image: '/assets/Dev20Career20Accelerator.png',
    description: 'Everything you need to land your first high-paying developer job.',
    longDescription: 'The complete career engineering course. Learn resume optimization, portfolio building, GitHub strategy, LinkedIn growth, technical interview preparation, salary negotiation, and freelance business setup.',
    instructorId: 'yahye',
    instructors: ['/assets/pri-native.jpg'],
    rating: 4.97,
    reviews: 2100,
    students: 15000,
    duration: '10h 20m',
    totalLessons: 52,
    level: 'All Levels',
    price: 19,
    originalPrice: 79,
    tags: ['Career', 'Resume', 'Interviews', 'Salary'],
    lastUpdated: 'July 2026',
    includes: ['52 HD video lessons', 'Resume templates', 'Interview prep guide', 'Lifetime access', 'Certificate'],
    whatYouLearn: [
      'Build a portfolio that gets callbacks',
      'Optimize your resume for ATS and engineering leads',
      'Prepare for technical and behavioral interviews',
      'Negotiate salary with confidence',
      'Grow your LinkedIn and GitHub presence',
      'Start freelancing and land your first client',
    ],
    hasCertificate: true,
    totalHours: 10.33,
    completionCriteria: 'Complete all career modules and submit your reviewed portfolio & resume.',
    isPublished: true,
    isDeleted: false,
    curriculum: [
      {
        title: 'Module 1: Portfolio & Resume',
        lessons: [
          { id: 'c1', title: 'What Hiring Managers Look For', duration: '12:00', type: 'video', preview: true },
          { id: 'c2', title: 'Portfolio Site Strategy', duration: '18:00', type: 'video' },
          { id: 'c3', title: 'Resume ATS Optimization', duration: '15:00', type: 'video' },
        ],
      },
      {
        title: 'Module 2: Technical Interview Prep',
        lessons: [
          { id: 'c4', title: 'Data Structures You Must Know', duration: '22:00', type: 'video' },
          { id: 'c5', title: 'System Design Basics', duration: '30:00', type: 'video' },
          { id: 'c6', title: 'Mock Interview Practice', duration: '45:00', type: 'project' },
        ],
      },
    ],
  },
  {
    slug: 'database-prisma-mastery',
    title: 'Database & Prisma Mastery',
    tagline: 'From SQL fundamentals to scalable ORM design patterns',
    category: 'saas',
    image: '/assets/Database20Mastery3A20SQL20to20Prisma.jpg',
    description: 'Understand SQL, NoSQL, and Prisma ORM to scale modern apps.',
    longDescription: 'Deep-dive into database engineering: relational modeling, SQL queries, PostgreSQL advanced features, Prisma ORM schema design, migrations, seeding, and advanced query optimization for production loads.',
    instructorId: 'sarah',
    instructors: ['/assets/pri-js.jpg', '/assets/pri-next.jpg'],
    rating: 4.92,
    reviews: 620,
    students: 4200,
    duration: '12h 10m',
    totalLessons: 60,
    level: 'Intermediate',
    price: 25,
    originalPrice: 89,
    tags: ['SQL', 'PostgreSQL', 'Prisma', 'Database'],
    lastUpdated: 'June 2026',
    includes: ['60 HD video lessons', 'Prisma schema examples', 'SQL cheat sheet', 'Lifetime access', 'Certificate'],
    whatYouLearn: [
      'Design efficient relational database schemas',
      'Write advanced SQL queries and joins',
      'Use Prisma ORM for type-safe database access',
      'Handle migrations and data seeding',
      'Optimize query performance with indexes',
      'Connect PostgreSQL to Next.js applications',
    ],
    hasCertificate: true,
    totalHours: 12.16,
    completionCriteria: 'Complete all 60 database modules and schema design challenges.',
    isPublished: true,
    isDeleted: false,
    curriculum: [
      {
        title: 'Module 1: Relational Database Fundamentals',
        lessons: [
          { id: 'd1', title: 'Database Design Principles', duration: '14:00', type: 'video', preview: true },
          { id: 'd2', title: 'SQL Queries & Joins', duration: '24:00', type: 'video' },
          { id: 'd3', title: 'PostgreSQL Specific Features', duration: '18:00', type: 'video' },
        ],
      },
      {
        title: 'Module 2: Prisma ORM',
        lessons: [
          { id: 'd4', title: 'Prisma Schema Basics', duration: '16:00', type: 'video' },
          { id: 'd5', title: 'Migrations & Seeding', duration: '14:00', type: 'video' },
          { id: 'd6', title: 'Build a Full Data Layer', duration: '38:00', type: 'project' },
        ],
      },
    ],
  },
];

export const getCourse = (slug: string): Course | undefined =>
  COURSES.find((c) => c.slug === slug);

export const getInstructor = (id: string): Instructor | undefined =>
  INSTRUCTORS.find((i) => i.id === id);

export const getInstructorCourses = (instructorId: string): Course[] =>
  COURSES.filter((c) => c.instructorId === instructorId);

// ───────────────────────────────────────────
// MOCK STUDENT DATA
// ───────────────────────────────────────────
export const MOCK_STUDENT = {
  name: 'Ahmed Hassan',
  email: 'ahmed@example.com',
  avatar: '/assets/w-rc.jpg',
  joinedDate: 'January 2026',
  streak: 14,
  totalPoints: 4850,
  level: 'Advanced',
  enrolledCourses: ['ultimate-nextjs-guide', 'gsap-pro-animations'],
  completedCourses: ['dev-career-accelerator'],
  progress: {
    'ultimate-nextjs-guide': 62,
    'gsap-pro-animations': 35,
    'dev-career-accelerator': 100,
  },
  badges: [
    { icon: '🎯', name: 'First Lesson', earned: true },
    { icon: '🔥', name: '7-Day Streak', earned: true },
    { icon: '⚡', name: 'Speed Learner', earned: true },
    { icon: '🏆', name: 'Course Complete', earned: true },
    { icon: '🚀', name: 'Project Submitted', earned: false },
    { icon: '💎', name: 'Top Performer', earned: false },
  ],
};
