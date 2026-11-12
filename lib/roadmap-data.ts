import type { Course } from './data';

export type MilestoneStatus = 'completed' | 'in-progress' | 'next' | 'upcoming';
export type MilestoneDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type PhaseId = 'phase-1' | 'phase-2' | 'phase-3' | 'phase-4';

export interface CodeSnippet {
  language: string;
  filename: string;
  code: string;
}

export interface ProblemSetItem {
  title: string;
  description: string;
  type: 'Lab' | 'Problem Set' | 'Practice';
}

export interface RoadmapMilestone {
  id: string;
  weekNumber: number;
  title: string;
  tagline: string;
  slug: string;
  phaseId: PhaseId;
  phaseTitle: string;
  phaseSubtitle: string;
  difficulty: MilestoneDifficulty;
  estimatedHours: number;
  totalLessons: number;
  description: string;
  concepts: string[];
  codeSnippet?: CodeSnippet;
  problemSets: ProblemSetItem[];
  keyTakeaway: string;
  status: MilestoneStatus;
  progressPct: number;
  isAvailable: boolean;
  isComingSoon: boolean;
  course?: Course;
}

export interface RoadmapPhase {
  id: PhaseId;
  phaseNumber: number;
  title: string;
  subtitle: string;
  description: string;
  weeksRange: string;
  milestones: RoadmapMilestone[];
  completedCount: number;
  totalCount: number;
  progressPct: number;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}

export interface RoadmapViewModel {
  milestones: RoadmapMilestone[];
  phases: RoadmapPhase[];
  totalMilestones: number;
  completedMilestones: number;
  completionPercentage: number;
  totalEstimatedHours: number;
  currentPhase: RoadmapPhase;
  nextMilestone: RoadmapMilestone | null;
  continueMilestone: RoadmapMilestone | null;
}

export interface UserEnrollmentRef {
  courseId: string;
  progress: number;
  paymentStatus?: string;
}

// ─── Canonical Academic Curriculum Definitions ───────────
export const CS50_CURRICULUM_DATA: Record<
  number,
  {
    title: string;
    tagline: string;
    phaseId: PhaseId;
    difficulty: MilestoneDifficulty;
    estimatedHours: number;
    defaultSlug: string;
    description: string;
    concepts: string[];
    codeSnippet: CodeSnippet;
    problemSets: ProblemSetItem[];
    keyTakeaway: string;
  }
> = {
  0: {
    title: 'Computational Thinking & Scratch',
    tagline: 'Deconstruct problems algorithmically using visual logic blocks and state representation.',
    phaseId: 'phase-1',
    difficulty: 'Beginner',
    estimatedHours: 6,
    defaultSlug: 'cs50-week-0-scratch',
    description:
      'Week 0 introduces computational thinking: approaching problems methodically and constructing step-by-step algorithms. Explore binary representation (bits and bytes), ASCII character mapping, and build interactive programs in MIT Scratch without syntax anxiety.',
    concepts: [
      'Binary System & State Representation (0s and 1s)',
      'ASCII & Unicode character encoding systems',
      'Algorithmic inputs, deterministic processing, and outputs',
      'Boolean expressions, conditional branching & event loops',
      'Event-driven programming and message broadcasting',
    ],
    codeSnippet: {
      language: 'scratch-pseudocode',
      filename: 'scratch_algorithm.txt',
      code: `when green flag clicked
set [counter v] to [0]
repeat until <(counter) = [10]>
    say (join [Count: ] (counter)) for (1) secs
    change [counter v] by (1)
broadcast [completed v] and wait`,
    },
    problemSets: [
      {
        title: 'Scratch Interactive Project',
        description: 'Design an interactive game or animated story containing at least two sprites, loops, and custom conditions.',
        type: 'Problem Set',
      },
      {
        title: 'Binary Guessing Game',
        description: 'Implement binary search logic to demonstrate logarithmic algorithmic complexity (O(log n)).',
        type: 'Practice',
      },
    ],
    keyTakeaway: 'Syntax varies across languages, but algorithmic problem decomposition remains universal in all software engineering.',
  },
  1: {
    title: 'C Programming Fundamentals',
    tagline: 'Enter systems programming with strict static typing, memory limits, and the Clang compiler.',
    phaseId: 'phase-1',
    difficulty: 'Beginner',
    estimatedHours: 8,
    defaultSlug: 'cs50-week-1-c',
    description:
      'Transition from visual blocks to textual systems programming in C. Master the 4 stages of compilation (preprocess, compile, assemble, link), primitive memory types, integer overflow constraints, and terminal I/O.',
    concepts: [
      'The 4 compilation stages: Preprocessing, Compiling, Assembling, Linking',
      'Primitive data types: int (32-bit), float, double, char, long (64-bit)',
      'Integer overflow (Y2K, Boeing 787, 2038 Unix epoch issue)',
      'Loops: for, while, and do-while with lexical scope rules',
      'Modular code design and forward function declarations',
    ],
    codeSnippet: {
      language: 'c',
      filename: 'mario.c',
      code: `#include <stdio.h>
#include <cs50.h>

void print_pyramid(int height);

int main(void) {
    int height;
    do {
        height = get_int("Pyramid Height (1-8): ");
    } while (height < 1 || height > 8);

    print_pyramid(height);
    return 0;
}`,
    },
    problemSets: [
      {
        title: 'Mario (Less & More)',
        description: 'Print adjacent half-pyramids of hashes (#) aligned to the right like in Super Mario Bros.',
        type: 'Problem Set',
      },
      {
        title: 'Credit / Cash (Greedy Algorithm)',
        description: 'Implement Luhn’s algorithm to validate Visa, MasterCard, and Amex credit card numbers.',
        type: 'Problem Set',
      },
    ],
    keyTakeaway: 'Computers are finite physical machines; explicit types define exact memory bounds and overflow hazards.',
  },
  2: {
    title: 'Arrays, Strings & Cryptography',
    tagline: 'Explore contiguous memory blocks, ASCII offsets, and command-line argument vectors.',
    phaseId: 'phase-1',
    difficulty: 'Intermediate',
    estimatedHours: 8,
    defaultSlug: 'cs50-week-2-arrays',
    description:
      'Learn how sequential variables live in hardware RAM. Inspect how strings are null-terminated (\\0) byte arrays, manipulate ASCII values with math, and implement classical cryptographic ciphers using command-line arguments (argc, argv).',
    concepts: [
      'Contiguous memory allocation for 1D arrays',
      'Strings as null-terminated (\\0) character arrays',
      'Command-line arguments: argc count and argv string vector',
      'ASCII offset arithmetic and Caesar/Vigenère shifting',
      'Defensive bounds checking and buffer overrun vulnerabilities',
    ],
    codeSnippet: {
      language: 'c',
      filename: 'caesar.c',
      code: `#include <stdio.h>
#include <cs50.h>
#include <ctype.h>
#include <string.h>

char rotate(char c, int key) {
    if (isupper(c)) return (c - 'A' + key) % 26 + 'A';
    if (islower(c)) return (c - 'a' + key) % 26 + 'a';
    return c;
}`,
    },
    problemSets: [
      {
        title: 'Readability',
        description: 'Compute Coleman-Liau readability index to calculate the reading grade level of any given text.',
        type: 'Problem Set',
      },
      {
        title: 'Caesar & Substitution Cipher',
        description: 'Encrypt plaintext messages using numeric rotation keys and custom 26-character substitution alphabets.',
        type: 'Problem Set',
      },
    ],
    keyTakeaway: 'A string is merely an array of bytes ending with a null terminator; memory bounds must always be validated.',
  },
  3: {
    title: 'Algorithms & Computational Complexity',
    tagline: 'Measure efficiency with Big O, Big Omega, and master recursive sorting algorithms.',
    phaseId: 'phase-2',
    difficulty: 'Intermediate',
    estimatedHours: 9,
    defaultSlug: 'cs50-week-3-algorithms',
    description:
      'Analyze algorithmic performance with asymptotic notation. Compare linear search O(n) against binary search O(log n). Trace bubble sort, selection sort, and merge sort O(n log n) using divide-and-conquer recursion.',
    concepts: [
      'Asymptotic notation: Big O (upper bound) and Big Omega (lower bound)',
      'Linear Search O(n) vs Binary Search O(log n)',
      'Quadratic sorting: Bubble Sort O(n²) and Selection Sort O(n²)',
      'Divide and Conquer: Merge Sort O(n log n)',
      'Recursive function call stacks and base termination cases',
    ],
    codeSnippet: {
      language: 'c',
      filename: 'binary_search.c',
      code: `int binary_search(int arr[], int low, int high, int target) {
    if (low > high) return -1; // Base case: not found
    int mid = low + (high - low) / 2;
    if (arr[mid] == target) return mid;
    if (arr[mid] > target)
        return binary_search(arr, low, mid - 1, target);
    return binary_search(arr, mid + 1, high, target);
}`,
    },
    problemSets: [
      {
        title: 'Sort Performance Lab',
        description: 'Determine which mystery binary uses Bubble, Selection, or Merge Sort by timing performance over large datasets.',
        type: 'Lab',
      },
      {
        title: 'Runoff & Tideman (Ranked Choice)',
        description: 'Implement instant runoff voting and Tideman ranked-pairs election systems avoiding cyclical graphs.',
        type: 'Problem Set',
      },
    ],
    keyTakeaway: 'Algorithmic efficiency compounds: O(log n) operates in 30 steps for 1 billion items, while O(n) requires 1 billion operations.',
  },
  4: {
    title: 'Memory, Pointers & Forensics',
    tagline: 'Direct hardware addresses, stack vs heap, dynamic malloc/free, and file I/O.',
    phaseId: 'phase-2',
    difficulty: 'Advanced',
    estimatedHours: 10,
    defaultSlug: 'cs50-week-4-memory',
    description:
      'Uncover the core mechanism of systems engineering: pointers. Learn how addresses are stored in hexadecimal, manage heap memory with malloc() and free(), diagnose memory leaks with Valgrind, and reconstruct corrupted forensic JPEG images from binary disk streams.',
    concepts: [
      'Pointers, memory addresses (&), and dereference operators (*)',
      'Virtual memory architecture: Text, Globals, Heap, Stack',
      'Dynamic memory allocation: malloc(), calloc(), realloc(), free()',
      'Valgrind memory leak and illegal read/write diagnostics',
      'File pointers (FILE*): fopen, fread, fwrite, and header analysis',
    ],
    codeSnippet: {
      language: 'c',
      filename: 'pointers.c',
      code: `int *ptr = malloc(sizeof(int) * 3);
if (ptr == NULL) return 1; // Out of memory defense

ptr[0] = 10;
ptr[1] = 20;
ptr[2] = 30;

// Always prevent heap leaks
free(ptr);
ptr = NULL;`,
    },
    problemSets: [
      {
        title: 'Filter (Image Processing)',
        description: 'Implement grayscale, reflection, blur (box blur kernel), and edge detection algorithms on 24-bit BMP image pixels.',
        type: 'Problem Set',
      },
      {
        title: 'Recover (Digital Forensics)',
        description: 'Scan raw FAT memory card blocks to identify 512-byte JPEG magic signatures and carve out 50 lost photos.',
        type: 'Problem Set',
      },
    ],
    keyTakeaway: 'Pointers eliminate memory copying overhead, but require absolute discipline to prevent leaks and segmentation faults.',
  },
  5: {
    title: 'Data Structures & Dynamic Trees',
    tagline: 'Engineer custom linked lists, hash tables, binary search trees, and tries.',
    phaseId: 'phase-2',
    difficulty: 'Advanced',
    estimatedHours: 10,
    defaultSlug: 'cs50-week-5-data-structures',
    description:
      'Build dynamic data structures in C from scratch. Implement singly linked lists, resolve collisions in chained hash tables, traverse binary search trees, and engineer retrieval tries (prefix trees) for constant-time O(k) dictionary spellchecking.',
    concepts: [
      'Singly and doubly linked lists with node pointer chaining',
      'Chained hash tables: collision handling and load factors',
      'Binary Search Trees (BST): logarithmic search and balanced trees',
      'Tries (Prefix Trees): O(k) retrieval independent of dataset size',
      'Data structure space vs time trade-offs',
    ],
    codeSnippet: {
      language: 'c',
      filename: 'hash_table.c',
      code: `typedef struct node {
    char word[46];
    struct node *next;
} node;

// Hash table bucket array
node *table[26];

unsigned int hash(const char *word) {
    return toupper(word[0]) - 'A';
}`,
    },
    problemSets: [
      {
        title: 'Inheritance Lab',
        description: 'Simulate genetic blood type inheritance (alleles A, B, O) down 3 generations using recursive tree allocations.',
        type: 'Lab',
      },
      {
        title: 'Speller (Dictionary Engine)',
        description: 'Build a spell checker loading 140,000 words into a hash table or trie, optimizing for sub-second execution.',
        type: 'Problem Set',
      },
    ],
    keyTakeaway: 'Choosing the optimal data structure turns an intractable computational problem into an instantaneous query.',
  },
  6: {
    title: 'Python & Modern Scripting',
    tagline: 'Expressive syntax, dynamic typing, automated memory management, and libraries.',
    phaseId: 'phase-3',
    difficulty: 'Beginner',
    estimatedHours: 8,
    defaultSlug: 'cs50-week-6-python',
    description:
      'Revisit prior computational concepts through modern Python. Experience garbage-collected memory, dynamic typing, list comprehensions, slicing, dictionary mapping, and standard library modules (sys, csv, re).',
    concepts: [
      'Python runtime, bytecode interpretation, and dynamic typing',
      'Built-in data structures: lists, dicts, sets, and tuples',
      'List comprehensions, generators, and Pythonic idioms',
      'File streaming with context managers (with open)',
      'Regular expressions for rigorous data extraction',
    ],
    codeSnippet: {
      language: 'python',
      filename: 'dna_match.py',
      code: `import csv
import sys

def longest_match(sequence, subsequence):
    # Dynamic sequence counter for STR repeats
    count = 0
    while subsequence * (count + 1) in sequence:
        count += 1
    return count`,
    },
    problemSets: [
      {
        title: 'Sentimental Problem Set',
        description: 'Port Mario, Cash, Credit, Readability, and Caesar from low-level C into idiomatic, concise Python.',
        type: 'Problem Set',
      },
      {
        title: 'DNA Profiling',
        description: 'Identify individuals from forensic DNA sequences by matching Short Tandem Repeats (STR) against CSV database records.',
        type: 'Problem Set',
      },
    ],
    keyTakeaway: 'High-level languages sacrifice low-level memory control to achieve massive developer ergonomics and rapid iteration.',
  },
  7: {
    title: 'SQL, Relational Schemas & Indexing',
    tagline: 'Query relational tables, perform multi-table joins, and optimize query indexes.',
    phaseId: 'phase-3',
    difficulty: 'Intermediate',
    estimatedHours: 9,
    defaultSlug: 'cs50-week-7-sql',
    description:
      'Master relational databases with SQLite and PostgreSQL. Learn relational algebra, primary/foreign keys, one-to-many and many-to-many schemas, aggregate queries (GROUP BY, HAVING), nested subqueries, and B-tree index optimizations.',
    concepts: [
      'Relational modeling: Primary keys, foreign keys, and referential integrity',
      'CRUD operations: SELECT, INSERT, UPDATE, DELETE',
      'Multi-table relational JOINs (INNER, LEFT, CROSS)',
      'Subqueries, aggregate calculations (COUNT, AVG, SUM)',
      'Database indexing (B-Tree) and eliminating full table scans (EXPLAIN QUERY PLAN)',
      'Race conditions and ACID transactional guarantees',
    ],
    codeSnippet: {
      language: 'sql',
      filename: 'schema.sql',
      code: `-- Relational Query with Index Optimization
CREATE INDEX idx_movies_year ON movies(year);

SELECT title, rating FROM movies
JOIN ratings ON movies.id = ratings.movie_id
WHERE year = 2026 AND rating >= 9.0
ORDER BY rating DESC;`,
    },
    problemSets: [
      {
        title: 'Songs & Spotify Analytics',
        description: 'Analyze top Billboard audio features (danceability, tempo, energy) using SQL aggregate functions.',
        type: 'Lab',
      },
      {
        title: 'Fiftyville Mystery',
        description: 'Crack a simulated crime using relational SQL forensics across flight manifests, ATM logs, and call records.',
        type: 'Problem Set',
      },
    ],
    keyTakeaway: 'Data integrity and indexing design determine whether queries complete in 2 milliseconds or freeze a production system.',
  },
  8: {
    title: 'HTML, CSS & JavaScript Web Stack',
    tagline: 'Modern frontend engineering: DOM manipulation, asynchronous fetch, and responsive layouts.',
    phaseId: 'phase-4',
    difficulty: 'Beginner',
    estimatedHours: 7,
    defaultSlug: 'cs50-week-8-html-css-javascript',
    description:
      'Learn the foundations of the World Wide Web: TCP/IP, DNS resolution, HTTP protocols, semantic HTML5, CSS Flexbox/Grid, and client-side JavaScript DOM manipulation and event handlers.',
    concepts: [
      'Client-server architecture: DNS, TCP/IP, and HTTP/HTTPS methods',
      'Semantic HTML5 markup and accessibility best practices',
      'Modern CSS: Box model, Flexbox, Grid, and media queries',
      'JavaScript event loop, DOM querying, and state manipulation',
      'Asynchronous programming with fetch() and JSON parsing',
    ],
    codeSnippet: {
      language: 'javascript',
      filename: 'trivia.js',
      code: `async function fetchQuestion() {
    const res = await fetch('/api/questions/random');
    const data = await res.json();
    document.querySelector('#question-text').textContent = data.prompt;
}
document.querySelector('#btn-check').addEventListener('click', checkAnswer);`,
    },
    problemSets: [
      {
        title: 'Trivia Interactive Game',
        description: 'Create an interactive quiz site using JavaScript DOM manipulation to give real-time color feedback on answers.',
        type: 'Problem Set',
      },
      {
        title: 'Homepage Portfolio',
        description: 'Author a responsive 4-page personal site with modern CSS layouts and interactive components.',
        type: 'Problem Set',
      },
    ],
    keyTakeaway: 'The modern web is built on standard open protocols; declarative markup and reactive scripting power user experiences.',
  },
  9: {
    title: 'Full-Stack Flask & Web Services',
    tagline: 'Build dynamic MVC applications with Python, Jinja2 templating, and secure authentication.',
    phaseId: 'phase-4',
    difficulty: 'Intermediate',
    estimatedHours: 10,
    defaultSlug: 'cs50-week-9-flask',
    description:
      'Connect backend servers with relational databases and frontend templates. Master the Model-View-Controller (MVC) pattern with Flask, handle user sessions, implement password hashing (bcrypt/pbkdf2), and process HTTP POST forms safely.',
    concepts: [
      'MVC Architecture: Routes (Controller), Templates (View), SQL (Model)',
      'Jinja2 templating: Inheritance (extends, block), filters, and loops',
      'Stateful user sessions: HTTP Cookies, session tokens, and security',
      'Cryptographic password hashing (werkzeug.security)',
      'Defensive form handling: preventing duplicate submissions and SQL injection',
    ],
    codeSnippet: {
      language: 'python',
      filename: 'app.py',
      code: `from flask import Flask, render_template, request, session, redirect

app = Flask(__name__)

@app.route("/trade", methods=["POST"])
def trade():
    symbol = request.form.get("symbol").upper()
    shares = int(request.form.get("shares"))
    user_id = session.get("user_id")
    # Execute trade logic in transaction
    return redirect("/portfolio")`,
    },
    problemSets: [
      {
        title: 'Birthdays Database App',
        description: 'Build a full-stack Flask application that stores, edits, and displays birthdays using SQL persistence.',
        type: 'Problem Set',
      },
      {
        title: 'C$50 Finance Trading Platform',
        description: 'Build a production stock trading portfolio application allowing users to register, buy, and sell stocks with live quotes.',
        type: 'Problem Set',
      },
    ],
    keyTakeaway: 'Full-stack engineering unites backend business logic, secure relational persistence, and clean frontend rendering into a cohesive product.',
  },
  10: {
    title: 'Cybersecurity Principles & Defense',
    tagline: 'Defend web applications against OWASP vulnerabilities, injections, and auth exploits.',
    phaseId: 'phase-4',
    difficulty: 'Advanced',
    estimatedHours: 8,
    defaultSlug: 'cs50-week-10-cybersecurity',
    description:
      'The capstone milestone of the computer science path. Adopt the mindset of security auditor and defensive engineer. Understand how software vulnerabilities are discovered and exploited, and master defensive counter-measures against the OWASP Top 10 web security threats.',
    concepts: [
      'Cross-Site Scripting (XSS): Stored, Reflected, and DOM-based attacks',
      'SQL Injection (SQLi) and parameterized query defenses',
      'Cross-Site Request Forgery (CSRF) and anti-forgery tokens',
      'Cryptographic hashing (SHA-256), salts, and timing attack resistance',
      'Authentication security: multi-factor auth (MFA) and JWT verification',
      'Secure socket layer (TLS/HTTPS) and public key infrastructure',
    ],
    codeSnippet: {
      language: 'python',
      filename: 'security_defense.py',
      code: `# Defensive Coding: Parameterized Query vs SQL Injection
# ❌ VULNERABLE: db.execute(f"SELECT * FROM users WHERE user = '{username}'")

# ✅ SECURE: Parameterized placeholder prevents injection
db.execute("SELECT * FROM users WHERE user = ?", (username,))`,
    },
    problemSets: [
      {
        title: 'Security Audit Lab',
        description: 'Analyze a vulnerable web application, identify authorization holes, and write verified patch commits.',
        type: 'Lab',
      },
      {
        title: 'Final Capstone Project',
        description: 'Design, architect, and deploy an original software application synthesizing all 11 milestones of computer science education.',
        type: 'Problem Set',
      },
    ],
    keyTakeaway: 'Security is not an afterthought; it must be designed into architecture, data schemas, and inputs from line one.',
  },
};

// ─── 4 Official Phases Metadata ──────────────────────────
export const ROADMAP_PHASES_META: Array<{
  id: PhaseId;
  phaseNumber: number;
  title: string;
  subtitle: string;
  description: string;
  weeksRange: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}> = [
  {
    id: 'phase-1',
    phaseNumber: 1,
    title: 'Foundations',
    subtitle: 'Scratch, C & Memory Mechanics',
    description: 'Deconstruct computation from binary representation to systems programming in C, pointers, and arrays.',
    weeksRange: 'Weeks 0–2',
    accentColor: '#10b981', // emerald
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
  {
    id: 'phase-2',
    phaseNumber: 2,
    title: 'Systems & Complexity',
    subtitle: 'Algorithms & Dynamic Data Structures',
    description: 'Master asymptotic complexity (Big O), dynamic memory allocation on the heap, linked lists, and search trees.',
    weeksRange: 'Weeks 3–5',
    accentColor: '#3b82f6', // blue
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-400',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 'phase-3',
    phaseNumber: 3,
    title: 'Python & Databases',
    subtitle: 'High-Level Scripting & Relational SQL',
    description: 'Transition to modern high-level scripting with Python, relational data modeling, and query index optimization.',
    weeksRange: 'Weeks 6–7',
    accentColor: '#f59e0b', // amber
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    borderColor: 'border-amber-500/30',
  },
  {
    id: 'phase-4',
    phaseNumber: 4,
    title: 'Web Architecture & Defense',
    subtitle: 'Full-Stack Engineering & Cybersecurity',
    description: 'Construct full-stack web applications with Flask, secure APIs, and defend systems against OWASP Top 10 exploits.',
    weeksRange: 'Weeks 8–10',
    accentColor: '#8b5cf6', // violet
    badgeBg: 'bg-violet-500/10',
    badgeText: 'text-violet-400',
    borderColor: 'border-violet-500/30',
  },
];

// ─── Normalizer & View Model Builder ─────────────────────
export function buildRoadmapViewModel(
  catalogCourses: Course[],
  userEnrollments: UserEnrollmentRef[] = [],
  clientCompletedWeeks: number[] = []
): RoadmapViewModel {
  // Map courses by seriesOrder or by week slug
  const courseByWeek = new Map<number, Course>();

  catalogCourses.forEach((c) => {
    if (typeof c.seriesOrder === 'number' && c.seriesOrder >= 0 && c.seriesOrder <= 10) {
      courseByWeek.set(c.seriesOrder, c);
    } else {
      // Check slug matching cs50-week-X
      const match = c.slug.match(/cs50-week-(\d+)/i);
      if (match) {
        const weekNum = parseInt(match[1], 10);
        if (weekNum >= 0 && weekNum <= 10 && !courseByWeek.has(weekNum)) {
          courseByWeek.set(weekNum, c);
        }
      }
    }
  });

  // Map user enrollments by slug
  const enrollmentMap = new Map<string, UserEnrollmentRef>();
  userEnrollments.forEach((e) => {
    enrollmentMap.set(e.courseId, e);
  });

  const clientCompletedSet = new Set(clientCompletedWeeks);

  // Build 11 milestones
  const milestones: RoadmapMilestone[] = [];
  let foundFirstIncomplete = false;

  for (let week = 0; week <= 10; week++) {
    const meta = CS50_CURRICULUM_DATA[week];
    const course = courseByWeek.get(week);
    const slug = course?.slug || meta.defaultSlug;
    const enrollment = enrollmentMap.get(slug);

    const enrollmentProgress = enrollment?.progress ?? 0;
    const isManuallyCompleted = clientCompletedSet.has(week);
    const isDbCompleted = enrollmentProgress >= 100;
    const isCompleted = isDbCompleted || isManuallyCompleted;

    let status: MilestoneStatus;
    let progressPct: number;

    if (isCompleted) {
      status = 'completed';
      progressPct = 100;
    } else if (enrollmentProgress > 0) {
      status = 'in-progress';
      progressPct = enrollmentProgress;
      foundFirstIncomplete = true;
    } else if (!foundFirstIncomplete) {
      status = 'next';
      progressPct = 0;
      foundFirstIncomplete = true;
    } else {
      status = 'upcoming';
      progressPct = 0;
    }

    const phaseMeta = ROADMAP_PHASES_META.find((p) => p.id === meta.phaseId)!;

    milestones.push({
      id: `milestone-week-${week}`,
      weekNumber: week,
      title: course?.title || `Week ${week}: ${meta.title}`,
      tagline: course?.tagline || meta.tagline,
      slug,
      phaseId: meta.phaseId,
      phaseTitle: phaseMeta.title,
      phaseSubtitle: phaseMeta.subtitle,
      difficulty: meta.difficulty,
      estimatedHours: course?.totalHours ? Number(course.totalHours) : meta.estimatedHours,
      totalLessons: course?.totalLessons || 6,
      description: course?.longDescription || course?.description || meta.description,
      concepts: course?.whatYouLearn && course.whatYouLearn.length > 0 ? course.whatYouLearn : meta.concepts,
      codeSnippet: meta.codeSnippet,
      problemSets: meta.problemSets,
      keyTakeaway: meta.keyTakeaway,
      status,
      progressPct,
      isAvailable: Boolean(course),
      isComingSoon: Boolean(course?.isComingSoon),
      course,
    });
  }

  // Group milestones into the 4 official phases
  const phases: RoadmapPhase[] = ROADMAP_PHASES_META.map((meta) => {
    const phaseMilestones = milestones.filter((m) => m.phaseId === meta.id);
    const completedCount = phaseMilestones.filter((m) => m.status === 'completed').length;
    const totalCount = phaseMilestones.length;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      ...meta,
      milestones: phaseMilestones,
      completedCount,
      totalCount,
      progressPct,
    };
  });

  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const totalMilestones = milestones.length;
  const completionPercentage = Math.round((completedMilestones / totalMilestones) * 100);
  const totalEstimatedHours = milestones.reduce((sum, m) => sum + m.estimatedHours, 0);

  // Determine current active phase and next/continue milestone
  const inProgressMilestone = milestones.find((m) => m.status === 'in-progress');
  const nextIncompleteMilestone = milestones.find((m) => m.status === 'next');
  const continueMilestone = inProgressMilestone || nextIncompleteMilestone || milestones[0];

  const currentPhase =
    phases.find((p) => p.id === (continueMilestone?.phaseId || 'phase-1')) || phases[0];

  return {
    milestones,
    phases,
    totalMilestones,
    completedMilestones,
    completionPercentage,
    totalEstimatedHours,
    currentPhase,
    nextMilestone: nextIncompleteMilestone || null,
    continueMilestone,
  };
}
