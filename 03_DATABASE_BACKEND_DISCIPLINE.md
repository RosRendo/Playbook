# 🗄️ Guide 03 — Database & Backend Discipline

> 📍 **Where you are**: Guide 03/15 — Database · ⬅️ [02 UX/UI Design](02_UX_UI_DESIGN_SYSTEM.md) · [🗺️ Full Journey Map](WHERE_AM_I.md) · ➡️ [04 Auth & Security](04_AUTH_AND_SECURITY.md)

**🎯 After this page you can**: create a working schema + migrations in ~1 hour, with zero speculative tables and transactions where money moves.
**⏱ Read time**: 12 min · **💻 Copy-paste blocks**: 3 (schema, commands, transaction)

---

## 💡 The Big Picture (30 seconds)

The #1 production-killer for solo devs is **Database Paralysis**: 14 empty tables, 800 lines of migration, zero users, three weeks gone. The cure is the **JIT rule** — build only the tables THIS WEEK's features need. Postgres makes adding later cheap; building ahead of need is what's expensive.

## ⚡ Quick Answer

**Rule: never create a table or column for a feature not in the current week's sprint.**

```
❌ WRONG (speculative):   users, organizations, roles, permissions, audit_logs,
                          coupons, referrals, tags, item_tags, notification_prefs
✅ RIGHT (Level 1 MVP):   users + items(1 feature table) + orders   = 3 tables, 2 days
```

When a customer *asks* for organizations 3 months later? Add the table then — 30 seconds of migration.

## 🦶 Step by Step

### Step 1 — List entities for THIS week's slice only
Typical Level-1 answer: `users`, `projects`/`items`, `orders`.

### Step 2 — Write `schema.ts` (Drizzle starter — copy the whole block)
```typescript
import { pgTable, text, timestamp, integer, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),                     // matches Clerk/auth-provider ID
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  stripeCustomerId: text('stripe_customer_id'),
  subscriptionTier: text('subscription_tier').default('free').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),           // 'stripe' | 'paddle' | 'aba_payway'
  externalOrderId: text('external_order_id').notNull().unique(), // webhook idempotency key
  amountInCents: integer('amount_in_cents').notNull(),
  currency: text('currency').default('USD').notNull(),
  status: text('status').notNull(),               // 'pending'|'succeeded'|'failed'|'refunded'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

**✅ Done when**: compiles; every column is needed by a real screen.

### Step 3 — Turn the schema into real tables
```bash
npx drizzle-kit generate      # create migration SQL files
npx drizzle-kit push          # dev: fast apply to the DB
npx drizzle-kit studio        # free visual browser of your data
```
(edits later = edit `schema.ts`, re-run generate+push — 30 seconds)

### Step 4 — Wrap every money mutation in a transaction
```typescript
await db.transaction(async (tx) => {
  const [order] = await tx.update(orders)
    .set({ status: 'paid' })
    .where(eq(orders.id, orderId))
    .returning();

  await tx.insert(auditLedger).values({ orderId: order.id, amount: order.amount, action: 'PAYMENT_RECEIVED' });
});
```
Second step fails → everything rolls back. No half-paid zombie states.

**✅ Done when**: you can create + list rows in `drizzle-kit studio`.

## ⚖️ The 6 Unbreakable Standards (checklist)

| # | Standard | Why |
| :--- | :--- | :--- |
| 1 | IDs: **UUIDv7 / cuid2**, never sequential ints | `order/104` leaks volume & invites enumeration |
| 2 | Every table: `created_at` + `updated_at` (TIMESTAMPTZ) | You WILL debug "when did this happen" |
| 3 | Integrity in the DB, not JS: `NOT NULL`, `UNIQUE(user_id, slug)`, `ON DELETE CASCADE/RESTRICT` | App code can crash mid-write |
| 4 | **Index every FK + filtered column** — Postgres doesn't auto-index FKs | `CREATE INDEX idx_orders_user_id ON orders(user_id);` unindexed = seq scan (45ms vs 0.4ms per query) |
| 5 | Transactions for any money/balance/status change | Atomic or nothing |
| 6 | No soft deletes (`deleted_at`) unless legally required | Poisons every query with `WHERE deleted_at IS NULL` + breaks unique indexes |

## 🧱 The Lean 3-Layer Backend Pattern

```text
HTTP route (validate via Zod, extract session user, status codes)
  → Service function (business rules, permissions, transactions)
    → DB query (Drizzle/Prisma)
```
Full route + service code examples are in the [visual showcase](showcase/fullstack-playbook-visual.html); the shape is always: validate → authorize → transact → return typed result. Never 7 layers (Controller→Facade→Service→Repository→...).

## ❌ Common Mistakes

- Adding "we might need" columns/tables → dead weight forever.
- Relying on app-layer uniqueness only → duplicates under race conditions.
- Money math with floats — store `amount_in_cents` as INTEGER.
- `SELECT *` without `LIMIT` on lists → memory crashes when tables grow.
- Building repositories/dto layers before having one working feature.

---
> ➡️ **Next**: [04 Auth & Security](04_AUTH_AND_SECURITY.md) — bank-grade sessions in an afternoon + the one query pattern that stops IDOR.
