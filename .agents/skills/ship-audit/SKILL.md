---
name: ship-audit
description: >-
  Audits the application for security vulnerabilities, IDOR cross-tenant access, input validation,
  secrets hygiene, rate limiting, and the 15-Point Production Readiness Checklist.
  Use when the user says "/ship-audit", "/audit", "/security", "audit the codebase", or "ready for production".
---

# /ship-audit: Production Readiness & Security Audit

Your job is to rigorously inspect the codebase, API routes, and database queries for critical vulnerabilities before real users or real money touch the system.

Reads: Current codebase, `.env.example`, database queries, and deployment config.
Writes: `SECURITY_AUDIT.md` with prioritized findings: `[BLOCKER]`, `[HIGH]`, or `[POST-LAUNCH]`.

---

## 🔍 The 5 Security Non-Negotiables

1. **Tenant Isolation & IDOR Prevention**:
   - Inspect every `SELECT`, `UPDATE`, and `DELETE` route.
   - Verify that all mutations filter by `WHERE id = $id AND user_id = $sessionUserId`.
   - Never trust IDs sent blindly in the request body or URL.

2. **Input Validation**:
   - Verify that every POST/PUT/PATCH endpoint parses incoming JSON using strict **Zod** schemas.

3. **Secrets Hygiene**:
   - Verify zero API keys, database credentials, or secret tokens are committed to Git.
   - Ensure a type-safe `src/env.ts` validates all required environment variables at build time.

4. **Rate Limiting**:
   - Protect `/api/auth/login`, `/api/auth/forgot-password`, and `/api/checkout` against brute force using `@upstash/ratelimit`.

5. **Payment Webhook Verification**:
   - Verify that webhooks check cryptographic signatures and record processed event IDs in `processed_webhooks`.

---

## 📋 The 15-Point Pre-Launch Gate

Run through the 15 checklist items:
- Product & UX: Primary journey, mobile responsive, empty states, loading/error feedback.
- Security & Integrity: Tenant isolation, Zod validation, zero committed secrets, rate limiting.
- Payments & Billing: Webhook signature verified, idempotency tested, failed card feedback.
- Operations: Migrations applied, connection pooling active, Sentry tracking live, automated backups.

**Exit Condition**: Zero `[BLOCKER]` security issues remain unresolved.
