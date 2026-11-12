# 🎓 EraySame Tech Academy — E-Learning Platform

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.7-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.1-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Clerk Auth](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk)](https://clerk.com/)
[![Mux Video](https://img.shields.io/badge/Mux-Video_Streaming-FF2D55?style=for-the-badge)](https://mux.com/)
[![Sifalo Pay](https://img.shields.io/badge/Sifalo_Pay-Mobile_Gateway-00C853?style=for-the-badge)](https://sifalopay.com/)

A modern, full-featured, enterprise-grade e-learning platform built with **Next.js 15 (App Router)**, **React 19**, **Prisma ORM**, **Clerk Authentication**, **Mux** adaptive HLS video streaming, and **Sifalo Pay** (ZAAD, E-Dahab, EVC Plus, Golis Sahal, Premier Wallet) as the primary mobile payment gateway — accompanied by an advanced **Super Admin Control Panel**, **CS50 Curriculum Tracks & Roadmaps**, **Faculty Management**, **Interactive Quizzes**, **Real-Time Discussions**, **Cryptographic Certificates**, and **Asynchronous Email Outbox & Job Queues**.

---

## 📑 Table of Contents

- [✨ Platform Features](#-platform-features)
  - [👨‍🎓 Student Experience](#-student-experience)
  - [🛣️ CS50 Tracks & Interactive Roadmaps](#️-cs50-tracks--interactive-roadmaps)
  - [👨‍🏫 Faculty & Instructors Directory](#-faculty--instructors-directory)
  - [🛡️ Super Admin Control Panel](#️-super-admin-control-panel-admin)
  - [⚡ Asynchronous Workers & Email Pipeline](#-asynchronous-workers--email-pipeline)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository](#1-clone-the-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Initialize & Seed Database](#4-initialize--seed-database)
  - [5. Provision Super Admin Account](#5-provision-super-admin-account)
  - [6. Run Development Server](#6-run-development-server)
- [🐳 Docker & Containerization](#-docker--containerization)
- [🧪 Testing & Quality Gates](#-testing--quality-gates)
- [🔗 API & Webhook Reference](#-api--webhook-reference)
- [🔒 Security & Architecture](#-security--architecture)
- [🗄️ Database Models](#️-database-models)
- [🚢 Production Deployment](#-production-deployment)
- [📄 License & Authors](#-license--authors)

---

## ✨ Platform Features

### 👨‍🎓 Student Experience
- 🔐 **Authentication & User Sync** — Passwordless, OAuth & session authentication powered by [Clerk](https://clerk.com) with database auto-sync via Svix webhooks.
- 🎥 **Adaptive Video Streaming** — High-definition, low-latency HLS video delivery via [Mux](https://mux.com) with playback position memory.
- 📊 **Real-Time Progress Tracking** — Sub-second tracking of watched percentage, completion checks, and curriculum progress bars.
- 📝 **Timestamped Notes** — Rich, searchable in-video note-taking with instant jump-to-time playback.
- 💬 **Course Discussions & Q&A** — Pinned threads, nested replies, locked discussions, and instructor interactions.
- ❓ **Interactive Quizzes** — Lesson knowledge checks with passing score enforcement and instant feedback.
- 📜 **Cryptographic Certificates** — Automated PDF/certificate generation with verifiable unique codes (`/certificates/[code]`).
- 💳 **Seamless Mobile Checkout** — Multi-provider payment options including Sifalo Pay (ZAAD, E-Dahab, EVC Plus, Premier Wallet) and Stripe cards.
- 🎟️ **Promo Codes & Discounts** — Instant discount calculations, fixed or percentage vouchers, usage caps, and expiration checks.
- 📁 **Cloud Resources** — Secure course attachment downloads via [UploadThing](https://uploadthing.com).
- 🎨 **3D Interactive Visuals** — Three.js & React Three Fiber canvas graphics and GSAP micro-animations.

### 🛣️ CS50 Tracks & Interactive Roadmaps
- 🗺️ **Dedicated Visual Roadmap (`/roadmap`)** — Step-by-step engineering tracks from CS50 Computer Science fundamentals to AI, Web, Game Dev, and Cyber Security.
- 🎯 **Prerequisite Chains & Next-Course Guidance** — Visual progression paths guiding students through curriculum series in structured sequence.
- ⏳ **Coming Soon & Waitlist Capture** — Upcoming course previews with zero-friction email waitlist subscriptions.

### 👨‍🏫 Faculty & Instructors Directory
- 👥 **Public Faculty Showcase (`/instructors`)** — Dedicated instructor profiles, expertise tags, social links, rating statistics, and published course catalogs.
- 🔄 **Multi-Instructor Assignment** — Direct instructor association per course with rich bio widgets on course landing pages.

### 🛡️ Super Admin Control Panel (`/admin`)
- 📈 **Live Platform Metrics** — Real-time KPIs for total revenue, active enrollments, course catalogs, student conversion, and payment distributions.
- 📚 **Course Studio & Curriculum Builder** — Multi-step wizard to create, edit, sort sections/lessons, attach Mux video IDs, manage pricing, and toggle publication/archival states.
- 👥 **User & Role Administration** — Searchable user roster with role promotion (`student` → `instructor` → `admin`).
- 👨‍🏫 **Instructor Management** — Comprehensive CRUD for platform faculty, bios, avatars, and social links.
- 💰 **Sales Ledger & Enrollment Manager** — Complete financial records, transaction audit trails, and manual enrollment grant/revoke actions.
- 🏷️ **Promo Code Center** — Create targeted course discounts, enforce maximum redemptions, per-user limits, and track usage.
- ❓ **Quiz Central Hub** — Create, update, and manage quizzes and multi-choice questions across lessons.
- ⚙️ **System Diagnostic & Health Audits** — Live database connection pool telemetry, environment variable validation, and deployment checklists.

### ⚡ Asynchronous Workers & Email Pipeline
- 📬 **Reliable Outbox & Idempotency** — Resilient email outbox with automatic retry policies, idempotency checks, and dead-letter safety.
- ✉️ **Branded Transactional Templates** — Welcome emails, purchase receipts, certificate issuance, and course announcements via Resend / Nodemailer.
- 🔄 **Inngest & Standalone Worker** — Asynchronous task orchestrator and standalone Node/Docker worker (`scripts/standalone-worker.ts`) for non-blocking operations.
- 📡 **Real-Time Push Updates** — Pusher WebSocket channels for instant notification dispatches and active learner updates.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Framework** | Next.js 15.1 (App Router, Server Actions, API Route Handlers) |
| **Frontend & UI** | React 19, Tailwind CSS v4, Framer Motion, GSAP, Lucide Icons |
| **3D & Canvas** | Three.js, React Three Fiber, React Three Drei |
| **Database & ORM** | PostgreSQL (Neon Serverless with PgBouncer) + Prisma ORM 6.19 |
| **Authentication** | Clerk (Student/Public) + Custom Bcrypt/Crypto Session (Super Admin) |
| **Video Infrastructure** | Mux Video Streaming API & Mux Player React |
| **File Storage** | UploadThing Cloud Storage |
| **Payments** | **Sifalo Pay** (ZAAD, E-Dahab, EVC Plus, Golis Sahal, Premier) & Stripe |
| **Background Jobs** | Inngest Serverless Workflows & Standalone Node Worker |
| **Real-Time & Cache** | Pusher Channels, Upstash Redis |
| **Email Delivery** | Resend API & Nodemailer with Email Outbox Pattern |
| **Monitoring & Logs** | PostHog Behavioral Analytics & Sentry Error Telemetry |
| **Validation & Security** | Zod v4, DOMPurify, Sanitize-HTML, Timing-Safe HMAC-SHA256 |
| **Package Manager** | pnpm |

---

## 📁 Project Structure

```
├── app/
│   ├── (auth)/                   # Public Clerk Sign-in / Sign-up flows
│   ├── (admin-auth)/             # Isolated Super Admin Login (/admin/login)
│   ├── admin/                    # 🛡️ Super Admin Control Panel
│   │   ├── page.tsx              #   Platform Executive Dashboard & KPIs
│   │   ├── courses/              #   Course Management & Curriculum Editor
│   │   ├── instructors/          #   Faculty CRUD & Profiles Hub
│   │   ├── users/                #   User Directory & Role Modifier
│   │   ├── enrollments/          #   Sales Ledger & Manual Grant
│   │   ├── promo-codes/          #   Discount & Voucher Center
│   │   ├── quizzes/              #   Quizzes Management Hub
│   │   ├── analytics/            #   Financial & Learner Analytics
│   │   └── settings/             #   System Health & Security Checklist
│   ├── certificates/             # 📜 Public Certificate Verification View
│   ├── checkout/                 # 💳 Sifalo Pay & Stripe Checkout Flow
│   ├── courses/                  # 📚 Public Course Catalog & Player
│   ├── dashboard/                # 📊 Student Learning Hub & Achievements
│   ├── instructors/              # 👨‍🏫 Public Instructors Directory & Bios
│   ├── roadmap/                  # 🛣️ Engineering Visual Tracks & Milestones
│   ├── api/                      # ⚡ REST & Webhook Route Handlers
│   │   ├── admin/                #   Admin CRUD Endpoints
│   │   ├── certificates/         #   Certificate Verification & Issuance
│   │   ├── checkout/             #   Order Creation & Sifalo Dispatch
│   │   ├── discussions/          #   Forum Threads & Replies
│   │   ├── inngest/              #   Inngest Event Dispatcher
│   │   ├── progress/             #   Lesson Completion Engine
│   │   ├── quiz/                 #   Quiz Submission & Grading
│   │   ├── webhooks/             #   Sifalo, Clerk, Stripe & Resend
│   │   └── db-metrics/           #   Database Pool Health Probe
│   ├── globals.css               # Design System & Tailwind Directives
│   ├── layout.tsx                # Root App Shell & Providers
│   └── page.tsx                  # High-Converting Hero Landing Page
├── components/                   # Modular React UI Components
│   ├── 3d/                       #   Three.js Interactive Canvas Elements
│   ├── admin/                    #   Admin Navigation, Cards & Modals
│   ├── course/                   #   Video Player, Curriculum Tree & Notes
│   ├── roadmap/                  #   Visual Roadmap Nodes & Connectors
│   └── ui/                       #   Buttons, Badges, Tabs & Form Controls
├── docker/                       # Container configs (worker & postgres)
├── docs/                         # Enterprise Migration & Architecture Docs
├── hooks/                        # Custom React Hooks (Debounce, Media, Auth)
├── lib/                          # Core Services & Utilities
│   ├── admin-auth.ts             #   Crypto-Safe Admin Session Manager
│   ├── email-service.ts          #   Resend/Nodemailer Delivery Engine
│   ├── inngest.ts                #   Inngest Event Client
│   ├── prisma.ts                 #   Resilient Connection Pooled Prisma Singleton
│   ├── sifalo.ts                 #   Sifalo Pay SDK & HMAC Verification
│   ├── stripe.ts                 #   Stripe API Client
│   └── validation-schemas.ts     #   Zod Input & Form Validation Schemas
├── prisma/
│   ├── schema.prisma             # Complete Database Models & Relations
│   ├── seed.ts                   # Comprehensive Platform Seed
│   └── create-admin.ts           # Super Admin Provisioning Script
├── scripts/
│   ├── seed-cs50-series.ts       # CS50 Track Seed Script
│   ├── standalone-worker.ts      # Outbox Background Worker Process
│   └── db-cleanup.ts             # Orphan Record Cleaner
├── tests/                        # Automated Test Suites (11 Specs)
├── Dockerfile                    # Multi-stage Web Next.js Dockerfile
├── Dockerfile.worker             # Lightweight Background Worker Dockerfile
├── docker-compose.yml            # Local Multi-Container Composition
└── package.json                  # Dependencies & Scripts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.18.0 or higher (v20+ recommended)
- **pnpm**: v9+ (`npm install -g pnpm`)
- **PostgreSQL**: Neon Serverless or standard PostgreSQL 15+

---

### 1. Clone the Repository

```bash
git clone https://github.com/YahyeBaron/E-learning.git
cd E-learning
```

---

### 2. Install Dependencies

```bash
pnpm install
```

---

### 3. Configure Environment Variables

Create your local `.env` file by copying `.env.example`:

```bash
cp .env.example .env
```

Fill in the required values:

```env
# ── Database ──
DATABASE_URL="postgresql://user:password@ep-host.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=5"
DIRECT_URL="postgresql://user:password@ep-host.us-east-2.aws.neon.tech/neondb?sslmode=require"

# ── Clerk Authentication ──
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

# ── Sifalo Pay (Primary Payment Gateway) ──
SIFALO_PAY_USERNAME=su_your_username
SIFALO_PAY_API_KEY=sp_your_api_key
SIFALO_PAY_API_URL=https://api.sifalopay.com/v1/payment
SIFALO_WEBHOOK_SECRET=whsec_your_hmac_secret
SIFALO_MERCHANT_ZAAD=+252634718722
SIFALO_MERCHANT_EDAHAB=+252654718722
SIFALO_MERCHANT_PREMIER_WALLET=+252634718722
SIFALO_MERCHANT_PREMIER_ACCOUNT=130146287001

# ── Super Admin ──
ADMIN_PASSWORD=YourSecureSuperAdminPassword!

# ── Email System (Resend) ──
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL="EraySame Tech Academy <onboarding@resend.dev>"

# ── Media & Storage ──
UPLOADTHING_TOKEN=eyJhcGlLZXkiOi...
NEXT_PUBLIC_MUX_ENV_KEY=your_mux_key
MUX_ENV_ID=your_mux_env_id
```

---

### 4. Initialize & Seed Database

```bash
# Generate Prisma Client
pnpm prisma generate

# Sync schema with database
pnpm prisma db push

# Seed core platform courses & instructors
pnpm db:seed

# Optional: Seed complete CS50 Series Track
npx tsx scripts/seed-cs50-series.ts
```

---

### 5. Provision Super Admin Account

Run the secure admin creation script:

```bash
# Windows PowerShell
$env:ADMIN_PASSWORD="YourSecurePassword!"; npx ts-node prisma/create-admin.ts

# Linux / macOS
ADMIN_PASSWORD="YourSecurePassword!" npx ts-node prisma/create-admin.ts
```

---

### 6. Run Development Server

```bash
pnpm dev
```

- **Student App**: [http://localhost:3000](http://localhost:3000)
- **Roadmap**: [http://localhost:3000/roadmap](http://localhost:3000/roadmap)
- **Instructors**: [http://localhost:3000/instructors](http://localhost:3000/instructors)
- **Admin Control Panel**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## 🐳 Docker & Containerization

The repository includes production-ready Dockerfiles and docker-compose configurations:

```bash
# Run web platform and database locally
docker compose up -d

# Run enterprise setup with standalone worker
docker compose -f docker-compose.enterprise.yml up -d
```

| Container | Description |
|---|---|
| `web` | Multi-stage Next.js standalone server (`Dockerfile`) |
| `worker` | Asynchronous Email Outbox & Job Worker (`Dockerfile.worker`) |
| `postgres` | Local PostgreSQL instance for offline development |

---

## 🧪 Testing & Quality Gates

The platform contains 11 comprehensive test suites verifying security policies, payment math, atomic order states, and progress calculations:

```bash
# Run all automated test suites
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Full Production Validation Gate (Lint + Types + Tests + Build)
pnpm validate
```

### Test Suite Overview

- 🛡️ `tests/auth-policy.test.ts` — Clerk webhook verification, admin session cryptographic validation, fail-closed auth.
- 💳 `tests/payment-audit.test.ts` — HMAC-SHA256 signature verification, replay protection, idempotent webhooks.
- ⚛️ `tests/phase4-5-atomic-checkout.test.ts` — Atomic order lifecycle (`PENDING` → `COMPLETED`/`FAILED`).
- 🎟️ `tests/promo-payment.test.ts` — Promo discount calculations, expiration constraints, and usage limits.
- 📈 `tests/progress-engine.test.ts` — Lesson progress calculation and certificate unlock triggers.
- 📬 `tests/email-automation.test.ts` — Outbox queuing, retry policies, and unsubscribe tokens.
- 📚 `tests/course-management.test.ts` — Course CRUD, curriculum ordering, and soft-delete protections.
- 🗺️ `tests/roadmap-model.test.ts` — CS50 series tracks and prerequisite link integrity.

---

## 🔗 API & Webhook Reference

### Student Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/checkout` | Create checkout order & initiate Sifalo/Stripe payment |
| `GET/POST` | `/api/progress` | Retrieve & update student lesson progress |
| `GET/POST/DELETE` | `/api/notes` | Manage timestamped video notes |
| `GET/POST` | `/api/discussions` | List and create discussion threads |
| `POST` | `/api/quiz` | Submit quiz attempt and calculate score |
| `GET` | `/api/certificates` | Retrieve earned course certificates |
| `POST` | `/api/subscribe` | Newsletter & course waitlist subscription |

### Super Admin Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/auth/login` | Super Admin login (Bcrypt verify + secure cookie) |
| `POST` | `/api/admin/auth/logout` | Invalidate admin cryptographic session |
| `GET/POST` | `/api/admin/courses` | List all courses and create new course |
| `GET/PUT/DELETE` | `/api/admin/courses/[slug]` | Update curriculum, publish, or soft-delete course |
| `GET/POST/PUT/DELETE` | `/api/admin/instructors` | Comprehensive instructor profile management |
| `GET/PATCH` | `/api/admin/users/[id]` | User role management (`student` / `instructor` / `admin`) |
| `GET/POST/DELETE` | `/api/admin/enrollments` | Enrollment auditing & manual access grants |
| `GET/POST/PATCH/DELETE` | `/api/admin/promo-codes` | Voucher creation, rules & deactivation |
| `GET` | `/api/admin/analytics` | Platform financial overview & KPIs |

### Webhook Handlers
| Endpoint | Provider | Verification Mechanism |
|---|---|---|
| `/api/webhooks/sifalo` | Sifalo Pay | HMAC-SHA256 signature + timing-safe comparison |
| `/api/webhooks/clerk` | Clerk Auth | Svix cryptographic signature validation |
| `/api/webhooks/stripe` | Stripe | Official Stripe webhook signature check |
| `/api/webhooks/resend` | Resend | Delivery event webhooks |

---

## 🔒 Security & Architecture

```mermaid
flowchart TD
    Client([Client Browser]) -->|HTTPS Request| MW[Next.js Middleware]
    MW -->|Public / Protected Route| AppRouter[App Router]
    MW -->|Admin Path /admin/*| AdminAuth[Admin Session Guard]

    subgraph Auth & Identity
        AppRouter -->|Student Auth| Clerk[Clerk Auth Provider]
        AdminAuth -->|32-byte Token + Bcrypt| AdminDB[(Admin Table)]
    end

    subgraph Payments & Webhooks
        AppRouter -->|Mobile Payment| SifaloAPI[Sifalo Pay Gateway]
        SifaloAPI -->|Webhook Event| SifaloHook[Sifalo Webhook Handler]
        SifaloHook -->|TimingSafe HMAC-SHA256| OrderEngine[Atomic Order Engine]
    end

    subgraph Core Database
        OrderEngine --> Prisma[(Neon PostgreSQL)]
        AppRouter --> Prisma
    end

    subgraph Background Services
        Prisma -->|Outbox Pattern| Outbox[(EmailOutbox Table)]
        Worker[Standalone Worker / Inngest] -->|Process Outbox| Outbox
        Worker -->|Dispatch| Resend[Resend Email API]
    end
```

- **Fail-Closed Admin Authentication**: Separate from Clerk; utilizes Bcrypt password hashing, 32-byte cryptographic random session tokens, and strict `httpOnly`, `secure`, `sameSite=strict` cookies.
- **Timing-Safe HMAC-SHA256 Signatures**: Protects payment webhooks against timing and replay attacks.
- **Decimal Precision**: All financial amounts (`price`, `amountPaid`, `discountValue`) use SQL `Decimal(12, 2)` to eliminate floating-point arithmetic errors.
- **Input Sanitization**: Content fields are sanitized using isomorphic DOMPurify and Sanitize-HTML to prevent XSS.
- **Database Pool Resiliency**: Pre-configured connection limits and retry mechanisms optimized for serverless Neon PostgreSQL.

---

## 🗄️ Database Models

Key entities declared in `prisma/schema.prisma`:

- 🎓 **`Course`** — Complete course schema, pricing, CS50 track sequence, certificate rules, and soft-delete states.
- 👨‍🏫 **`Instructor`** — Faculty profiles, biographies, rating averages, social links, and course relationships.
- 📑 **`CurriculumSection` & `Lesson`** — Hierarchical curriculum tree with Mux playback IDs and ordering.
- 👤 **`User`** — Synchronized user profile with role attributes (`student`, `instructor`, `admin`).
- 💳 **`CheckoutOrder` & `Enrollment`** — Atomic ledger linking payment providers, transaction references, and access.
- 🏷️ **`PromoCode` & `PromoCodeUsage`** — Granular voucher rules, limits, and redemption records.
- 📝 **`LessonProgress` & `Note`** — Real-time lesson watch states, completion timestamps, and synchronized notes.
- 📜 **`Certificate`** — Verified credentials with tamper-proof unique verification codes.
- 💬 **`DiscussionThread` & `DiscussionReply`** — Community engagement forum per course/lesson.
- 📬 **`EmailOutbox` & `EmailDelivery`** — Enterprise outbox queue with idempotency and audit history.

---

## 🚢 Production Deployment

### Recommended: Vercel + Neon PostgreSQL

1. **Deploy Repository to Vercel**: Connect your GitHub repository to [Vercel](https://vercel.com).
2. **Configure Environment Variables**: Add all production credentials in the Vercel Project Settings.
3. **Apply Database Migrations**:
   ```bash
   npx prisma migrate deploy
   ```
4. **Seed Production Data**:
   ```bash
   pnpm db:seed
   ```
5. **Provision Production Super Admin**:
   ```bash
   ADMIN_PASSWORD="YourSuperSecureProductionPassword!" npx ts-node prisma/create-admin.ts
   ```
6. **Register Webhook URLs**:
   - **Sifalo Pay**: `https://yourdomain.com/api/webhooks/sifalo`
   - **Clerk**: `https://yourdomain.com/api/webhooks/clerk`
   - **Stripe**: `https://yourdomain.com/api/webhooks/stripe`

---

## 📄 License & Authors

This project is proprietary software. All rights reserved.

Created and maintained with ❤️ by **[Yahye Baron](https://github.com/YahyeBaron)** — **EraySame Tech Academy**.
