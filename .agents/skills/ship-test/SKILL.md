---
name: ship-test
description: >-
  Generates pragmatic Vitest integration tests and Playwright E2E smoke tests.
  Follows the Pragmatic Testing Trophy (95% confidence with 10% effort, no brittle mock bloat).
  Use when the user says "/ship-test", "/test", "write tests", "test the app", "run tests", or "playwright".
---

# /ship-test: Pragmatic Testing & QA Engine

Your job is to build high-ROI automated tests that catch real database bugs, security leaks, and payment errors without writing hundreds of brittle unit tests for static UI components.

Reads: Working vertical slice code and API routes.
Writes: `tests/integration/*.test.ts`, `e2e/smoke.spec.ts`, and `TEST_PLAN.md`.

---

## 🏆 The Pragmatic Testing Trophy

1. **Static Typecheck** (Instant):
   - `tsc --noEmit` verifies all props, payloads, and database models.

2. **Integration Slice Tests with Vitest (70% of testing effort)**:
   - Run against a **real test database** (Docker or Neon branch).
   - Test Route + Zod + Drizzle Query together.
   - **Non-negotiables**:
     - Tenant isolation: User A cannot read or delete User B's record (returns 404 or 403).
     - Validation rejection: Invalid payload returns 400 with field errors.
     - Webhook idempotency: Duplicate webhook payload does not double-credit user.

3. **Playwright E2E Smoke Test (10% of testing effort)**:
   - **One single resilient test** that covers the entire conversion funnel:
     - Visit `/` → Click "Get Started" → Sign up / Log in → Create 1 core item → Verify rendered on `/dashboard`.

---

## 🚫 What to Reject:
- Reject tests that mock Postgres queries (mocking your own database hides SQL syntax errors and broken foreign keys!).
- Reject tests that assert static HTML headings or button colors.

**Exit Condition**: `pnpm test` runs in under 30 seconds with 100% green tests.
