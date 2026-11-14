# UpBit Academy — Enterprise Infrastructure Migration Playbook (Phase 4)

This playbook details the step-by-step operational procedures for scaling **UpBit Academy** beyond serverless boundaries to dedicated worker daemons and dedicated managed PostgreSQL.

---

## 1. Operational Migration Triggers

Execute the actions in this playbook when any of the following SLA boundaries are reached:

| Metric / Symptom | Threshold Trigger | Action |
| :--- | :--- | :--- |
| **Serverless Task Timeouts** | Background jobs > 10s timeout on Vercel | Deploy Dedicated Worker Daemon ([`Dockerfile.worker`](file:///c:/Users/ADMIN/Videos/E-learning/Dockerfile.worker)) |
| **Database Connection Exhaustion** | > 100 concurrent DB connections or `P2024` errors | Deploy PgBouncer Proxy Sidecar ([`docker-compose.enterprise.yml`](file:///c:/Users/ADMIN/Videos/E-learning/docker-compose.enterprise.yml)) |
| **Sustained Database Query Latency** | p95 query latency > 200ms despite indexes | Migrate from Neon Serverless to Managed Dedicated Postgres (AWS RDS) |

---

## 2. Part 1: Deploying the Dedicated Worker Service

### Option A: Render / Fly.io Container Deployment

1. **Build Container Image**:
   ```bash
   docker build -f Dockerfile.worker -t upbit-academy-worker:latest .
   ```
2. **Deploy to Render / Fly.io**:
   * Set process command: `npx ts-node --transpile-only scripts/standalone-worker.ts`
   * Inject Environment Variables:
     * `DATABASE_URL` (PgBouncer connection endpoint)
     * `DIRECT_URL` (Direct database endpoint)
     * `RESEND_API_KEY`
     * `SIFALO_PAY_API_KEY`
     * `SIFALO_WEBHOOK_SECRET`
3. **Verify Worker Health**:
   Inspect stdout logs for heartbeat signal:
   ```text
   [Worker Daemon] Starting UpBit Academy Dedicated Worker (ID: worker-prod-01)
   [Worker Daemon Heartbeat] Total DB Queries: 42 | p95: 12ms
   ```

---

## 3. Part 2: Zero-Downtime Database Migration to AWS RDS

### Step 1: Provision Target Infrastructure
* Provision AWS RDS PostgreSQL 16 instance (db.r6g.xlarge with Multi-AZ replication).
* Deploy PgBouncer proxy instance or container sidecar using [`docker/pgbouncer/pgbouncer.ini`](file:///c:/Users/ADMIN/Videos/E-learning/docker/pgbouncer/pgbouncer.ini).

### Step 2: Extract & Restore Database Dump
```bash
# 1. Export schema and data from serverless source database
pg_dump "$DIRECT_URL" \
  --clean --create --if-exists --no-owner --no-privileges \
  --file=academy_backup.sql

# 2. Restore schema and data into RDS target database
psql "postgresql://aws_user:secret@rds-endpoint.amazonaws.com:5432/academy_db" \
  -f academy_backup.sql
```

### Step 3: Run Prisma Migrations Validation
```bash
# Run migration status check on target DB
DIRECT_URL="postgresql://aws_user:secret@rds-endpoint.amazonaws.com:5432/academy_db" \
npx prisma migrate status
```

### Step 4: Environment Variable Cutover
Update production environment configuration (`.env` or Vercel / Docker host):
```env
# Point application runtime to PgBouncer proxy
DATABASE_URL="postgresql://aws_user:secret@pgbouncer-host:6432/academy_db?sslmode=require&pgbouncer=true&connect_timeout=5"

# Point direct migrations to target RDS instance
DIRECT_URL="postgresql://aws_user:secret@rds-endpoint.amazonaws.com:5432/academy_db?sslmode=require"
```

---

## 4. Verification & Operational Health Auditing

After cutover, verify live telemetry at `/api/db-metrics`:

```json
{
  "timestamp": "2026-08-09T14:11:00.000Z",
  "dbPerformance": {
    "totalQueries": 1250,
    "slowQueries": 0,
    "slowQueryRate": "0.00%",
    "p50Ms": 4,
    "p95Ms": 18,
    "p99Ms": 35,
    "coldStartCount": 0
  },
  "infrastructure": {
    "redisDistributed": true,
    "prismaExtensionActive": true,
    "slowQueryThresholdMs": 200
  }
}
```
