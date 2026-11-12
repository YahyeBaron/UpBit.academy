# ════════════════════════════════════════════════════════════════
# EraySame Tech Academy — Multi-Stage Production Dockerfile
# Base: node:22-alpine | Pattern: deps → builder → runner
# ════════════════════════════════════════════════════════════════

# ─── Stage 1: Install Dependencies ───────────────────────────────
FROM node:22-alpine AS deps

RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json* pnpm-lock.yaml* ./
COPY prisma ./prisma

# Install all deps (including devDeps for build)
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    npm install -g pnpm && pnpm install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  else \
    npm install; \
  fi

# ─── Stage 2: Build Application ──────────────────────────────────
FROM node:22-alpine AS builder

RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client inside builder context
RUN npx prisma generate

# Next.js build — standalone output for minimal container footprint
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_STANDALONE=true

RUN npm run build

# ─── Stage 3: Production Runtime ─────────────────────────────────
FROM node:22-alpine AS runner

RUN apk add --no-cache openssl curl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root system user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy standalone server artifacts
COPY --from=builder /app/public          ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma generated client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

# Container health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
