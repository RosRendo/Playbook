# 📋 Guide 09 — Templates & Launch Checklists

> 📍 **Where you are**: Guide 09/15 — Templates · ⬅️ [08 Prompt Library](08_PROMPT_LIBRARY_AND_RECIPES.md) · [🗺️ Full Journey Map](WHERE_AM_I.md) · ➡️ [10 Testing](10_TESTING_AND_QA_STRATEGY.md)

**🎯 After this page you can**: produce any project document in minutes (not the format — the content), and gate a launch behind a real checklist.
**⏱ Use as**: copy-paste source · **📄 Templates**: 4 + the 15-point launch gate

---

## 💡 The Big Picture (30 seconds)

Docs fail by being too elaborate and unused. These 4 templates are deliberately one page each: fill in an evening, keep in the repo, update when reality changes. The 15-point checklist at the bottom is the final gate — nothing ships until every box is ticked.

## ⚡ Quick Answer — When to Use What

| Template | Phase | File to create |
| :--- | :--- | :--- |
| 1 — Product Brief | Guide 00 Phase 1 | `PRODUCT_BRIEF.md` |
| 2 — Architecture Spec | Guide 00 Phase 2 | `ARCHITECTURE.md` |
| 3 — Test Plan | Guide 10 | `TEST_PLAN.md` |
| 4 — Type-safe env | Guide 04 Step 5 | `src/env.ts` |
| 15-Point Checklist | Guide 00 Phase 6 (launch) | run as review |

---

## 📄 Template 1 — `PRODUCT_BRIEF.md` (one page!)

```markdown
# Product Brief: [Name]

## 1. Problem & Target User
- Target user: [freelance designers? local restaurant owners?]
- Core problem: [invoices across currencies take 4 hrs/week]
- Alternative today: [spreadsheets, clunky ERPs]

## 2. Core Value Proposition
- [One-click localized invoices, paid via Stripe/ABA KHQR in 30 seconds]

## 3. Business Model
- Model: [subscription / one-time / take-rate]
- Pricing: [Free up to 3 invoices/mo, Pro $15/mo unlimited]

## 4. Primary User Journey (happy path)
1. Lands on homepage → "Get Started"
2. Signs up (Clerk/Better Auth)
3. Creates first invoice (line items + client email)
4. Sends link → client pays (Stripe/KHQR)
5. Payment notification → funds update

## 5. Scope (v1.0)
In: [auth, invoice create + PDF, checkout, transaction list]
Out (non-goals): ❌ recurring multi-year plans ❌ accounting sync (Xero/QuickBooks)
❌ team permission matrix ❌ multi-language ❌ custom domain mapping
```

## 🏗️ Template 2 — `ARCHITECTURE.md`

```markdown
# Architecture: [Name]

## 1. Delivery Level
- Tier: Level 1 (MVP) / Level 2 — rationale: [pre-revenue; monolith for iteration speed]

## 2. Stack (one line each — fill during Guide 01 Step 2)
Frontend: Next.js 15 App Router + CSS tokens | Backend: Next.js route handlers
Database: Supabase/Neon Postgres | ORM: Drizzle | Auth: Clerk/Better Auth
Payments: Stripe/LemonSqueezy/ABA | Hosting: Vercel + Neon | Monitoring: Sentry + PostHog

## 3. Tables (JIT — only what's needed)
- users (id, email, name, stripe_customer_id, created_at)
- items (id, user_id FK→users CASCADE, title, status, created_at)
- orders (id, user_id, provider, external_id, amount_cents, status, created_at)

## 4. API surface
- POST /api/items (auth + Zod) · GET /api/items (own only)
- POST /api/checkout · POST /api/webhooks/payment (signed + idempotent)
```

## 🧪 Template 3 — `TEST_PLAN.md`

```markdown
# Test Plan: [Name]

## 1. Static: [ ] tsc --noEmit clean  [ ] eslint zero warnings

## 2. Integration (Vitest + real DB)
| Endpoint | Case | Expected |
| POST /api/items | valid + auth | 201, scoped to userId |
| POST /api/items | empty name | 400 |
| DELETE /api/items/:id | user B's item | 404/403 |
| POST /api/webhooks/payment | valid signature | 200, upgraded |
| POST /api/webhooks/payment | duplicate replay | 200, no double credit |

## 3. E2E smoke (Playwright)
[ ] land → signup → create 1 item → see it on /dashboard

## 4. Manual smoke gate
[ ] mobile viewport test  [ ] slow 3G (loading state + disabled button)
```

## 🔒 Template 4 — Type-safe `src/env.ts`

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid env vars:', parsed.error.flatten().fieldErrors);
  throw new Error('Missing or invalid environment variables.');
}
export const env = parsed.data;   // crashes at BUILD time, not at 3am runtime
```

---

## 🚀 The 15-Point Production Readiness Gate

### 📦 Product & UX
- [ ] **1** Primary journey tested in incognito, zero console errors
- [ ] **2** Mobile 375px: no horizontal scroll, no cut-off buttons
- [ ] **3** Empty states everywhere (no blank screens)
- [ ] **4** Loading + error states on every async action (spinner + retry)

### 🛡️ Security & Integrity
- [ ] **5** Tenant isolation: URL/ID tampering returns 403/404
- [ ] **6** Zod validation on every POST/PUT
- [ ] **7** Zero secrets in code; `.env` gitignored
- [ ] **8** Rate limits on login / forgot-password / checkout

### 💳 Payments
- [ ] **9** Unsigned webhook → 400
- [ ] **10** Duplicate webhook replay → no double credit
- [ ] **11** Declined cards / expired sessions → friendly notices

### ⚙️ Operations
- [ ] **12** Production migrations applied
- [ ] **13** Connection pooling configured (PgBouncer / Neon pooler)
- [ ] **14** Sentry receiving a test error
- [ ] **15** DB backups / PITR verified

**✅ Done when**: 15/15. Any unticked box = not ready, no matter how good the product feels.

## ❌ Common Mistakes

- Briefs with 10 pages of "vision" but no non-goals — scope creep fuel.
- The 15-point checklist "roughly done" — every unticked box is a 3am incident in stock.
- env.ts skipped → production crash on a missing var name typo, at scale.

---
> ➡️ **Next**: [10 Testing & QA](10_TESTING_AND_QA_STRATEGY.md) — the 4 tests that give 95% confidence for 10% effort.
