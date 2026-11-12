import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CS50_SERIES_NAME = 'CS50 Computer Science';

interface CS50CourseDef {
  slug: string;
  title: string;
  tagline: string;
  category: 'frontend' | '3d' | 'saas' | 'career';
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  seriesOrder: number;
  nextCourseSlug: string | null;
  duration: string;
  totalHours: number;
  price: number;
  originalPrice: number;
  image: string;
  description: string;
  longDescription: string;
  tags: string[];
  whatYouLearn: string[];
  sections: {
    title: string;
    lessons: {
      title: string;
      duration: string;
      preview: boolean;
      type: 'video' | 'quiz' | 'exercise';
    }[];
  }[];
}

const CS50_COURSES: CS50CourseDef[] = [
  {
    slug: 'cs50-week-0-scratch',
    title: 'CS50 - Week 0: Scratch',
    tagline: 'Computational Thinking, Algorithms & Visual Programming Foundations',
    category: 'frontend',
    level: 'Beginner',
    seriesOrder: 0,
    nextCourseSlug: 'cs50-week-1-c',
    duration: '4h 30m',
    totalHours: 4.5,
    price: 0,
    originalPrice: 49,
    image: '/assets/w-rc.jpg',
    description: 'Master core computational thinking, algorithmic decomposition, and basic programming constructs using Scratch.',
    longDescription: 'Week 0 introduces computer science fundamentals: binary representation, ASCII, algorithms, inputs/outputs, and computational problem solving without syntax hurdles through MIT Scratch.',
    tags: ['Scratch', 'Computer Science', 'Algorithms', 'Logic'],
    whatYouLearn: [
      'Understand binary, bytes, and computer memory basics',
      'Deconstruct complex problems into deterministic algorithms',
      'Implement loops, conditional statements, and variables',
      'Build an interactive multimedia game in Scratch',
    ],
    sections: [
      {
        title: 'Module 1: Computational Foundations',
        lessons: [
          { title: 'Welcome to CS50 & How Computers Count (Binary)', duration: '18:00', preview: true, type: 'video' },
          { title: 'ASCII, Unicode & RGB Color Representations', duration: '14:20', preview: true, type: 'video' },
          { title: 'What is an Algorithm? Inputs, Outputs & Pseudocode', duration: '20:10', preview: false, type: 'video' },
        ],
      },
      {
        title: 'Module 2: Visual Programming in Scratch',
        lessons: [
          { title: 'Scratch Canvas, Sprites & Coordinates', duration: '16:45', preview: false, type: 'video' },
          { title: 'Loops, Variables & Event Handlers', duration: '22:30', preview: false, type: 'video' },
          { title: 'Custom Functions (My Blocks) & Final Project', duration: '25:00', preview: false, type: 'video' },
        ],
      },
    ],
  },
  {
    slug: 'cs50-week-1-c',
    title: 'CS50 - Week 1: C',
    tagline: 'Syntax, Compilers, Data Types & Low-Level Control Flow',
    category: 'saas',
    level: 'Beginner',
    seriesOrder: 1,
    nextCourseSlug: 'cs50-week-2-arrays',
    duration: '5h 15m',
    totalHours: 5.25,
    price: 0,
    originalPrice: 59,
    image: '/assets/pri-js.jpg',
    description: 'Transition from visual blocks to textual programming in C, learning syntax, types, and compiler operations.',
    longDescription: 'Discover the bedrock language of operating systems. Understand source code compilation into assembly and machine code, memory types (int, float, char), and loop constructs in C.',
    tags: ['C', 'Clang', 'Compilers', 'Systems Programming'],
    whatYouLearn: [
      'Write, compile, and execute native C programs with Clang',
      'Master data types, memory bounds, and format specifiers',
      'Understand integer overflow and floating-point precision issues',
      'Implement nested loops to solve Mario pyramid problems',
    ],
    sections: [
      {
        title: 'Module 1: From Scratch to C',
        lessons: [
          { title: 'Source Code to Machine Code: The Compiler Pipeline', duration: '22:15', preview: true, type: 'video' },
          { title: 'Hello World in C, printf & Format Specifiers', duration: '15:30', preview: true, type: 'video' },
          { title: 'Data Types, Operators & Integer Precision Limits', duration: '24:00', preview: false, type: 'video' },
        ],
      },
      {
        title: 'Module 2: Control Flow & Problem Sets',
        lessons: [
          { title: 'Conditionals (if/else) & Boolean Logic', duration: '18:40', preview: false, type: 'video' },
          { title: 'While, For, and Do-While Loop Constructs', duration: '21:10', preview: false, type: 'video' },
          { title: 'Building Mario: Algorithmic Nested Loops', duration: '26:00', preview: false, type: 'video' },
        ],
      },
    ],
  },
  {
    slug: 'cs50-week-2-arrays',
    title: 'CS50 - Week 2: Arrays',
    tagline: 'Contiguous Memory, Strings, Command-Line Arguments & Cryptography',
    category: 'saas',
    level: 'Intermediate',
    seriesOrder: 2,
    nextCourseSlug: 'cs50-week-3-algorithms',
    duration: '5h 45m',
    totalHours: 5.75,
    price: 0,
    originalPrice: 69,
    image: '/assets/The20Ultimate20Next.png',
    description: 'Dive into contiguous memory buffers, strings as character arrays, command-line arguments, and classical ciphers.',
    longDescription: 'Understand how arrays map contiguous memory in RAM. Learn the anatomy of C strings terminating in null bytes (\\0), inspect memory with debuggers, and implement cryptographic ciphers.',
    tags: ['C', 'Arrays', 'Memory Layout', 'Cryptography'],
    whatYouLearn: [
      'Understand contiguous memory allocation and zero-based indexing',
      'Manipulate strings as null-terminated character arrays',
      'Parse command-line arguments via argc and argv',
      'Implement Caesar and Vigenere encryption algorithms',
    ],
    sections: [
      {
        title: 'Module 1: Memory Layout & Arrays',
        lessons: [
          { title: 'Debugging with GDB & Memory Inspection', duration: '19:30', preview: true, type: 'video' },
          { title: 'Declaring & Initializing Contiguous Arrays', duration: '21:00', preview: true, type: 'video' },
          { title: 'Strings as char Arrays & The NUL Terminator (\\0)', duration: '23:45', preview: false, type: 'video' },
        ],
      },
      {
        title: 'Module 2: Command-Line Arguments & Ciphers',
        lessons: [
          { title: 'Command-Line Inputs: int main(int argc, string argv[])', duration: '18:20', preview: false, type: 'video' },
          { title: 'Character Arithmetic & ASCII Math', duration: '20:15', preview: false, type: 'video' },
          { title: 'Implementing the Caesar Cipher Program', duration: '28:00', preview: false, type: 'video' },
        ],
      },
    ],
  },
  {
    slug: 'cs50-week-3-algorithms',
    title: 'CS50 - Week 3: Algorithms',
    tagline: 'Linear Search, Binary Search, Sorting Algorithms & Asymptotic Big O',
    category: 'career',
    level: 'Intermediate',
    seriesOrder: 3,
    nextCourseSlug: 'cs50-week-4-memory',
    duration: '6h 00m',
    totalHours: 6.0,
    price: 0,
    originalPrice: 79,
    image: '/assets/Build202620Launch20Your20SaaS20in20Under20720Days.png',
    description: 'Learn search algorithms, selection sort, bubble sort, merge sort, and asymptotic efficiency analysis (Big O).',
    longDescription: 'Explore algorithmic complexity. Compare O(n) vs O(log n) searches, implement recursive sorting algorithms like Merge Sort, and build voter runoff algorithms.',
    tags: ['Algorithms', 'Big O', 'Sorting', 'Recursion'],
    whatYouLearn: [
      'Quantify computational complexity with Big O, Omega, and Theta',
      'Implement linear search and logarithmic binary search',
      'Compare quadratic O(n^2) sorts vs linearithmic O(n log n) sorts',
      'Master recursion and divide-and-conquer paradigms',
    ],
    sections: [
      {
        title: 'Module 1: Search & Complexity',
        lessons: [
          { title: 'Linear Search vs. Binary Search on Sorted Data', duration: '20:45', preview: true, type: 'video' },
          { title: 'Big O, Omega, and Theta Notations Explained', duration: '24:30', preview: true, type: 'video' },
          { title: 'Custom Data Structs (typedef struct) in C', duration: '18:15', preview: false, type: 'video' },
        ],
      },
      {
        title: 'Module 2: Sorting & Recursion',
        lessons: [
          { title: 'Selection Sort & Bubble Sort Step-by-Step', duration: '25:00', preview: false, type: 'video' },
          { title: 'Recursion: Base Cases & Call Stack Frames', duration: '22:15', preview: false, type: 'video' },
          { title: 'Merge Sort: Divide, Conquer, and Merge in O(n log n)', duration: '29:40', preview: false, type: 'video' },
        ],
      },
    ],
  },
  {
    slug: 'cs50-week-4-memory',
    title: 'CS50 - Week 4: Memory',
    tagline: 'Pointers, Hexadecimal, Heap vs. Stack & Dynamic Memory Allocation',
    category: 'saas',
    level: 'Advanced',
    seriesOrder: 4,
    nextCourseSlug: 'cs50-week-5-data-structures',
    duration: '6h 30m',
    totalHours: 6.5,
    price: 0,
    originalPrice: 89,
    image: '/assets/pri-gsap.jpg',
    description: 'Demystify pointers, memory addresses in hexadecimal, dynamic allocation with malloc/free, and binary file I/O.',
    longDescription: 'Peek under the hood of RAM. Learn how pointers point to bytes in memory, the difference between stack and heap allocation, buffer overflows, and how to recover forensic images from raw memory cards.',
    tags: ['Pointers', 'Memory Management', 'malloc', 'Forensics'],
    whatYouLearn: [
      'Understand hexadecimal memory addressing and pointer references',
      'Safely allocate and deallocate heap memory with malloc() and free()',
      'Detect memory leaks and buffer overruns with Valgrind',
      'Read and write binary files like BMP images and raw data cards',
    ],
    sections: [
      {
        title: 'Module 1: Pointers & Addresses',
        lessons: [
          { title: 'Hexadecimal & Memory Architecture in RAM', duration: '22:00', preview: true, type: 'video' },
          { title: 'Pointers: & (Address-of) and * (Dereference)', duration: '26:30', preview: true, type: 'video' },
          { title: 'String Pointers & char * Behind the Curtain', duration: '20:15', preview: false, type: 'video' },
        ],
      },
      {
        title: 'Module 2: Dynamic Allocation & File I/O',
        lessons: [
          { title: 'Heap Allocation with malloc(), free() & Valgrind', duration: '27:45', preview: false, type: 'video' },
          { title: 'The Call Stack, Stack Overflow & Pass-by-Reference', duration: '23:10', preview: false, type: 'video' },
          { title: 'Binary File I/O: Recovering Deleted JPEGs', duration: '31:00', preview: false, type: 'video' },
        ],
      },
    ],
  },
  {
    slug: 'cs50-week-5-data-structures',
    title: 'CS50 - Week 5: Data Structures',
    tagline: 'Linked Lists, Binary Search Trees, Hash Tables & Tries',
    category: 'saas',
    level: 'Advanced',
    seriesOrder: 5,
    nextCourseSlug: 'cs50-week-6-python',
    duration: '7h 00m',
    totalHours: 7.0,
    price: 0,
    originalPrice: 99,
    image: '/assets/w-rc.jpg',
    description: 'Build custom data structures from scratch: singly & doubly linked lists, binary search trees, hash tables, and tries.',
    longDescription: 'Graduate from simple fixed-size arrays to custom dynamic data structures. Learn pointer linking, tree traversals, hash collision resolution with separate chaining, and high-speed dictionary lookup with prefix tries.',
    tags: ['Data Structures', 'Hash Tables', 'Trees', 'Tries'],
    whatYouLearn: [
      'Design dynamic nodes with pointers in C',
      'Build singly and doubly linked lists with O(1) insertions',
      'Implement Binary Search Trees for O(log n) lookups',
      'Create Hash Tables and Trie prefix trees for instant dictionary search',
    ],
    sections: [
      {
        title: 'Module 1: Linked Lists & Trees',
        lessons: [
          { title: 'Array Resizing Limitations & Linked List Architecture', duration: '24:00', preview: true, type: 'video' },
          { title: 'Inserting, Traversing & Freeing a Linked List in C', duration: '28:15', preview: true, type: 'video' },
          { title: 'Binary Search Trees & Recursive Traversal', duration: '26:00', preview: false, type: 'video' },
        ],
      },
      {
        title: 'Module 2: Hash Tables & Tries',
        lessons: [
          { title: 'Hash Functions & Collision Chaining', duration: '25:30', preview: false, type: 'video' },
          { title: 'Tries (Prefix Trees) & Constant-Time O(1) Lookups', duration: '27:10', preview: false, type: 'video' },
          { title: 'Building a 100k-Word High-Speed Spell Checker', duration: '33:00', preview: false, type: 'video' },
        ],
      },
    ],
  },
  {
    slug: 'cs50-week-6-python',
    title: 'CS50 - Week 6: Python',
    tagline: 'Modern High-Level Programming, Pythonic Syntax & Data Structures',
    category: 'saas',
    level: 'Intermediate',
    seriesOrder: 6,
    nextCourseSlug: 'cs50-week-7-sql',
    duration: '5h 30m',
    totalHours: 5.5,
    price: 0,
    originalPrice: 79,
    image: '/assets/pri-js.jpg',
    description: 'Transition from low-level C to high-level Python. Write concise, powerful scripts with built-in data types and libraries.',
    longDescription: 'Experience the productivity of Python after mastering C. Re-implement previous problem sets in a fraction of lines, manipulate lists and dictionaries, and write real-world automation scripts.',
    tags: ['Python', 'Automation', 'Scripting', 'OOP'],
    whatYouLearn: [
      'Write clean Python code with indentation-based syntax',
      'Leverage powerful built-in collections: lists, dicts, sets, tuples',
      'Interact with third-party modules and APIs via pip',
      'Build DNA sequence matching and facial recognition scripts',
    ],
    sections: [
      {
        title: 'Module 1: Pythonic Foundations',
        lessons: [
          { title: 'Comparing C and Python: Why Python is So Expressive', duration: '21:00', preview: true, type: 'video' },
          { title: 'Data Types, Slicing & List Comprehensions', duration: '23:30', preview: true, type: 'video' },
          { title: 'Dictionaries & Set Operations', duration: '19:45', preview: false, type: 'video' },
        ],
      },
      {
        title: 'Module 2: Real-World Scripts & Libraries',
        lessons: [
          { title: 'File Handling: Reading CSVs & JSON Parsing', duration: '22:15', preview: false, type: 'video' },
          { title: 'Object-Oriented Python & Classes', duration: '24:00', preview: false, type: 'video' },
          { title: 'Solving DNA Forensic Matching in Python', duration: '27:00', preview: false, type: 'video' },
        ],
      },
    ],
  },
  {
    slug: 'cs50-week-7-sql',
    title: 'CS50 - Week 7: SQL',
    tagline: 'Relational Databases, Normalization, Query Optimization & SQLite',
    category: 'saas',
    level: 'Intermediate',
    seriesOrder: 7,
    nextCourseSlug: 'cs50-week-8-html-css-javascript',
    duration: '5h 45m',
    totalHours: 5.75,
    price: 0,
    originalPrice: 89,
    image: '/assets/Build202620Launch20Your20SaaS20in20Under20720Days.png',
    description: 'Harness the power of relational databases. Model schemas, run complex JOINs, optimize queries with indexes, and prevent SQL injection.',
    longDescription: 'Learn how modern applications store and retrieve persistent records. Use SQLite and Python, normalize schemas into 1st, 2nd, and 3rd normal forms, and run analytical queries over millions of rows.',
    tags: ['SQL', 'SQLite', 'Databases', 'Relational Modeling'],
    whatYouLearn: [
      'Model relational databases with primary and foreign keys',
      'Execute CRUD queries with SELECT, INSERT, UPDATE, DELETE',
      'Write multi-table JOINs and nested subqueries',
      'Speed up database searches with B-Tree indexes and prevent SQL injection',
    ],
    sections: [
      {
        title: 'Module 1: Relational Modeling & SQL Queries',
        lessons: [
          { title: 'Why Flat Files Fail: The Need for Relational Databases', duration: '19:00', preview: true, type: 'video' },
          { title: 'Core SQL Syntax: SELECT, WHERE, ORDER BY, GROUP BY', duration: '25:30', preview: true, type: 'video' },
          { title: 'Aggregate Functions: COUNT, AVG, MIN, MAX', duration: '18:45', preview: false, type: 'video' },
        ],
      },
      {
        title: 'Module 2: Normalization, Joins & Security',
        lessons: [
          { title: 'Database Normalization & Foreign Key Relations', duration: '24:15', preview: false, type: 'video' },
          { title: 'Multi-Table JOINs: INNER, LEFT & FULL OUTER', duration: '26:00', preview: false, type: 'video' },
          { title: 'Indexes, Query Optimization & Preventing SQL Injection', duration: '28:30', preview: false, type: 'video' },
        ],
      },
    ],
  },
  {
    slug: 'cs50-week-8-html-css-javascript',
    title: 'CS50 - Week 8: HTML, CSS, JavaScript',
    tagline: 'Web Architecture, Semantic HTML5, Modern CSS & DOM Manipulation',
    category: 'frontend',
    level: 'Beginner',
    seriesOrder: 8,
    nextCourseSlug: 'cs50-week-9-flask',
    duration: '6h 00m',
    totalHours: 6.0,
    price: 0,
    originalPrice: 79,
    image: '/assets/The20Ultimate20Next.png',
    description: 'Learn how the World Wide Web operates: DNS, TCP/IP, HTTP/HTTPS, semantic HTML5, modern CSS layouts, and DOM manipulation.',
    longDescription: 'Build the frontend foundation of the web. Understand HTTP request-response cycles, write responsive CSS layouts with Flexbox/Grid, and make web pages interactive with client-side JavaScript and event listeners.',
    tags: ['HTML5', 'CSS3', 'JavaScript', 'Web Standards'],
    whatYouLearn: [
      'Understand client-server architecture, HTTP headers, and status codes',
      'Structure semantic web content with HTML5 elements and forms',
      'Style responsive web pages with modern CSS and Flexbox',
      'Manipulate the Document Object Model (DOM) dynamically with JavaScript',
    ],
    sections: [
      {
        title: 'Module 1: Web Architecture & Markup',
        lessons: [
          { title: 'How the Web Works: TCP/IP, DNS & HTTP/S Protocols', duration: '22:30', preview: true, type: 'video' },
          { title: 'Semantic HTML5 Elements, Attributes & Accessibility', duration: '20:15', preview: true, type: 'video' },
          { title: 'HTML Forms, Input Validation & Data Submission', duration: '18:45', preview: false, type: 'video' },
        ],
      },
      {
        title: 'Module 2: Styling & Client-Side Interactivity',
        lessons: [
          { title: 'CSS Box Model, Selectors & Modern Flexbox Layouts', duration: '26:00', preview: false, type: 'video' },
          { title: 'JavaScript in the Browser: querySelector & Event Listeners', duration: '24:30', preview: false, type: 'video' },
          { title: 'Interactive Web Apps: Trivia Game & DOM Manipulation', duration: '29:00', preview: false, type: 'video' },
        ],
      },
    ],
  },
  {
    slug: 'cs50-week-9-flask',
    title: 'CS50 - Week 9: Flask',
    tagline: 'Full-Stack Web Development, MVC Pattern, REST APIs & Sessions',
    category: 'saas',
    level: 'Intermediate',
    seriesOrder: 9,
    nextCourseSlug: 'cs50-week-10-cybersecurity',
    duration: '7h 15m',
    totalHours: 7.25,
    price: 0,
    originalPrice: 99,
    image: '/assets/pri-js.jpg',
    description: 'Build complete full-stack web applications with Python Flask, Jinja template inheritance, authentication sessions, and SQL databases.',
    longDescription: 'Connect frontend interfaces with backend servers. Build dynamic routes, handle POST requests, validate form data, hash user passwords, and create a full stock trading application with live market data.',
    tags: ['Flask', 'Full-Stack', 'APIs', 'Authentication'],
    whatYouLearn: [
      'Architect full-stack web applications following the MVC pattern',
      'Render dynamic HTML with Jinja template inheritance and context',
      'Implement user authentication with secure password hashing and cookies',
      'Build C$50 Finance: A live stock trading web platform with SQL persistence',
    ],
    sections: [
      {
        title: 'Module 1: Flask Routing & Templates',
        lessons: [
          { title: 'Introduction to Flask & Microframework Architecture', duration: '23:00', preview: true, type: 'video' },
          { title: 'Routes, HTTP Methods (GET vs POST) & Request Objects', duration: '26:45', preview: true, type: 'video' },
          { title: 'Jinja Templating Engine & Layout Inheritance', duration: '21:30', preview: false, type: 'video' },
        ],
      },
      {
        title: 'Module 2: Authentication & Capstone Project',
        lessons: [
          { title: 'Sessions, Cookies & Password Hashing with Werkzeug', duration: '28:00', preview: false, type: 'video' },
          { title: 'Integrating SQLite Databases with Flask', duration: '25:15', preview: false, type: 'video' },
          { title: 'Capstone: C$50 Finance Portfolio & Stock Transactions', duration: '34:00', preview: false, type: 'video' },
        ],
      },
    ],
  },
  {
    slug: 'cs50-week-10-cybersecurity',
    title: 'CS50 - Week 10: Cybersecurity',
    tagline: 'Threat Modeling, Cryptography, Defensive Engineering & Safe Systems',
    category: 'career',
    level: 'Advanced',
    seriesOrder: 10,
    nextCourseSlug: null,
    duration: '6h 30m',
    totalHours: 6.5,
    price: 0,
    originalPrice: 109,
    image: '/assets/Build202620Launch20Your20SaaS20in20Under20720Days.png',
    description: 'Master defensive engineering principles: threat modeling, authentication security, cryptography, and defenses against modern cyberattacks.',
    longDescription: 'Complete your CS journey by learning to protect software. Study symmetric/asymmetric cryptography, public key infrastructure, defenses against XSS, CSRF, and SQL injection, and how to build resilient systems.',
    tags: ['Cybersecurity', 'Security', 'Cryptography', 'Ethical Hacking'],
    whatYouLearn: [
      'Apply the CIA Triad (Confidentiality, Integrity, Availability) to system design',
      'Understand symmetric (AES) vs asymmetric (RSA) public-key cryptography',
      'Harden web apps against OWASP Top 10 vulnerabilities (XSS, CSRF, Injections)',
      'Design secure authorization workflows and multi-factor authentication systems',
    ],
    sections: [
      {
        title: 'Module 1: Principles of Security & Cryptography',
        lessons: [
          { title: 'The Security Mindset, CIA Triad & Threat Modeling', duration: '24:00', preview: true, type: 'video' },
          { title: 'Cryptographic Hashes, Rainbow Tables & Salting', duration: '27:15', preview: true, type: 'video' },
          { title: 'Public Key Infrastructure (PKI), TLS & Digital Certificates', duration: '23:45', preview: false, type: 'video' },
        ],
      },
      {
        title: 'Module 2: Application Security & Defense',
        lessons: [
          { title: 'Web Exploits: Cross-Site Scripting (XSS) & Content Security Policy', duration: '26:30', preview: false, type: 'video' },
          { title: 'CSRF Tokens, Cookie Flags (HttpOnly, SameSite) & Session Hijacking', duration: '25:00', preview: false, type: 'video' },
          { title: 'Secure Engineering: Building Systems That Fail Safely', duration: '30:00', preview: false, type: 'video' },
        ],
      },
    ],
  },
];

async function seedCS50Series() {
  console.log(`🌱 Seeding 11 CS50 courses for series: "${CS50_SERIES_NAME}"...`);

  const instructor = await prisma.instructor.findFirst();
  const instructorId = instructor ? instructor.id : 'yahye';
  const instructorName = instructor ? instructor.name : 'Yahye Baron';

  for (const c of CS50_COURSES) {
    const totalLessons = c.sections.reduce((acc, s) => acc + s.lessons.length, 0);

    await prisma.course.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        tagline: c.tagline,
        category: c.category,
        level: c.level,
        seriesName: CS50_SERIES_NAME,
        seriesOrder: c.seriesOrder,
        nextCourseSlug: c.nextCourseSlug,
        duration: c.duration,
        totalHours: c.totalHours,
        price: c.price,
        originalPrice: c.originalPrice,
        image: c.image,
        description: c.description,
        longDescription: c.longDescription,
        tags: c.tags,
        totalLessons,
        whatYouLearn: c.whatYouLearn,
        isPublished: true,
        hasCertificate: true,
      },
      create: {
        slug: c.slug,
        title: c.title,
        tagline: c.tagline,
        category: c.category,
        level: c.level,
        seriesName: CS50_SERIES_NAME,
        seriesOrder: c.seriesOrder,
        nextCourseSlug: c.nextCourseSlug,
        duration: c.duration,
        totalHours: c.totalHours,
        price: c.price,
        originalPrice: c.originalPrice,
        image: c.image,
        description: c.description,
        longDescription: c.longDescription,
        tags: c.tags,
        totalLessons,
        includes: ['Lifetime Access', '11-Course CS50 Roadmap Badge', 'Accredited Certificate'],
        whatYouLearn: c.whatYouLearn,
        instructorId,
        instructors: [instructorName],
        rating: 4.98,
        reviews: 1250,
        students: 18400,
        lastUpdated: 'Sep 2026',
        isPublished: true,
        hasCertificate: true,
      },
    });

    await prisma.curriculumSection.deleteMany({
      where: { courseId: c.slug },
    });

    for (let sIdx = 0; sIdx < c.sections.length; sIdx++) {
      const sec = c.sections[sIdx];
      await prisma.curriculumSection.create({
        data: {
          courseId: c.slug,
          title: sec.title,
          order: sIdx + 1,
          lessons: {
            create: sec.lessons.map((les, lIdx) => ({
              id: `${c.slug}-s${sIdx + 1}-l${lIdx + 1}`,
              title: les.title,
              duration: les.duration,
              type: les.type,
              preview: les.preview,
              order: lIdx + 1,
            })),
          },
        },
      });
    }

    console.log(`  ✅ Week ${c.seriesOrder}: ${c.title} seeded (${totalLessons} lessons)`);
  }

  console.log(`🎉 Successfully seeded all 11 courses in the "${CS50_SERIES_NAME}" series!`);
}

seedCS50Series()
  .catch((e) => {
    console.error('❌ Error seeding CS50 series:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
