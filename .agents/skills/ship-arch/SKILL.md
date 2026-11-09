---
name: ship-arch
description: >-
  Architects the stack, JIT database schema, and API contracts. Selects between Level 1 (MVP),
  Level 2 (Production), and Level 3 (Enterprise). Use when the user says "/ship-arch", "/architecture",
  "/arch", "/enterprise", "plan the architecture", "design the database", or "write the schema".
---

# /ship-arch: Architecture & Database Discipline

Your job is to select the simplest viable architecture and write the exact database schema and API contracts. You eliminate speculative over-engineering.

Reads: `PRODUCT_BRIEF.md`
Writes: `ARCHITECTURE.md` and `DATA_MODEL.md`

---

## 🏛️ Step 1: Delivery Level Selection

Select the appropriate tier and justify why:

| Tier | When to Choose | Core Stack |
| :--- | :--- | :--- |
| **Level 1 (MVP)** *(Default)* | New products, pre-revenue validation, small tools | Next.js/Vite Monolith + PostgreSQL (Supabase/Neon) + Clerk/Better Auth |
| **Level 2 (Production)** | Real paying customers, tasks >3s, $1k–$50k MRR | Modular Monolith + BullMQ Queue + Redis + PgBouncer |
| **Level 3 (Enterprise)** | SLA contracts, SAML SSO, SOC2, >500k MAUs | Multi-region DB, Read Replicas, WorkOS/SAML, Kafka/SQS |

---

## 🗄️ Step 2: The Just-In-Time (JIT) Schema Strategy

**Rule**: Only design tables needed for features approved in `PRODUCT_BRIEF.md`.
Never add speculative tables (`audit_logs`, `coupons`, `referrals`, `teams`).

### Unbreakable Schema Standards:
1. **IDs**: `id uuid primary key default gen_random_uuid()` or cuid2/UUIDv7.
2. **Audit Columns**: `created_at timestamptz not null default now()`, `updated_at`.
3. **Tenant Scoping**: An owner column (`user_id`) on every resource.
4. **Integrity**: `not null` by default; explicit `on delete cascade / restrict`.
5. **Foreign Key Indexes**: Every `user_id` and foreign key must have an explicit `CREATE INDEX`.
6. **Money**: Store as integer cents (`amount_in_cents integer not null`) + currency (`USD`).

---

## 📄 Output Template: `ARCHITECTURE.md`

```markdown
# 🏛️ Architecture Specification: [Product Name]

## 1. Delivery Tier: [Level 1 MVP / Level 2 Production / Level 3 Enterprise]
- **Rationale**: [1-sentence reason]

## 2. Technology Stack
- **Frontend & API**: Next.js 15 (App Router) / Node
- **Database**: PostgreSQL (Supabase / Neon)
- **ORM**: Drizzle ORM
- **Auth**: Clerk / Better Auth
- **Payments**: Stripe Checkout / Lemon Squeezy / ABA PAYWAY (Cambodia)
- **Deployment**: Vercel / Railway

## 3. Database Schema (Drizzle ORM)
```typescript
// users, core items, orders tables only
```

## 4. API Route Contracts & Zod Schemas
- `POST /api/[items]` (Create item, validated via Zod)
- `GET /api/[items]` (List items scoped to session user)
- `POST /api/webhooks/[payment]` (Cryptographically signed webhook)
```

**Exit Condition**: User approves the schema and API contract. Zero speculative tables exist.
