# 📑 Guide 08 — Master Prompt Library

> 📍 **Where you are**: Guide 08/15 — Prompt Library · ⬅️ [07 Bug Fixing](07_BUG_FIXING_AND_HARDENING.md) · [🗺️ Full Journey Map](WHERE_AM_I.md) · ➡️ [09 Templates](09_TEMPLATES_AND_CHECKLISTS.md)

**🎯 After this page you can**: paste the right scoped prompt for any phase instead of vague "build me an Airbnb clone" prompts that produce 40 broken files.
**⏱ Read time**: use as lookup table · **💻 copy-paste prompts**: 9 (A–I)

---

## 💡 The Big Picture (30 seconds)

AIs build exactly the scope you feed them. One giant prompt → disconnected half-files, fake mocks, broken deps. One scoped prompt per phase with explicit deliverables → shippable increments. This page = your menu: pick by phase, paste, go.

## ⚡ Quick Answer — Find Your Prompt (menu)

| Prompt | Use when | Looks like |
| :--- | :--- | :--- |
| **System prompt** | Every new project (one time) | Permanent rules for the AI |
| **A — Brief** | Phase 1: starting an idea | → `PRODUCT_BRIEF.md` |
| **B — UX/UI spec** | Phase 2: before styling | → `UX_UI_SPEC.md` |
| **C — Schema contract** | Phase 2: data design | → `DATA_MODEL.md` + `API_SPEC.md` |
| **D — Vertical slice** | Phase 4: each feature | → working feature end-to-end |
| **E — Payments/webhooks** | Phase 5: money wiring | → verified idempotent webhooks |
| **F — Security audit** | Phase 5→6: pre-launch | → [BLOCKER]/[HIGH] report + patches |
| **G — Bug fixer** | Anything breaks | → surgical patch, no refactoring |
| **H — Test generator** | Before merge | → Vitest integration + 1 Playwright E2E |
| **I — Apple UI builder** | Landing page / empty states | → frosted-glass + 3D sticker components |

## 👑 The System Prompt (set once per project)

```markdown
ROLE: Senior Product Architect & Shipping Orchestrator
Goal: SHIP a working product, not endlessly customize architecture.

RULES:
- Simplest architecture that satisfies current needs (default Level 1: modular monolith + managed Postgres + managed Auth).
- No speculative abstractions, microservices, or premature Redis/tables.
- Build complete VERTICAL SLICES (UI + API + DB + validation + tests) — one feature at a time.
- Strict server-side authorization: User A can NEVER access User B's resources.
- Every screen handles 7 states: populated, loading, empty, validation error, server error, success, mobile.
- Webhooks: cryptographically verified + processed idempotently.
- Bug fixes: smallest surgical change; never refactor unrelated files.
- Ask questions only when missing info changes architecture decisions; otherwise state assumptions and proceed.
```

## 🎯 Stage Prompts

### Prompt A — Discovery & Brief *(before any code)*
```markdown
Analyze this product idea: [INSERT RAW IDEA]
Define:
1. Target user & core problem
2. Core value proposition (single primary outcome)
3. Business model (free / subscription / one-time / fee)
4. Primary user journey (step-by-step to core value)
5. MVP scope vs. NON-GOALS: v1 must-haves + ≥5 explicit exclusions
6. Architecture tier: Level 1 / 2 / 3 with rationale
Do NOT write code. Output: concise PRODUCT_BRIEF.md.
```

### Prompt B — UX/UI Blueprint *(locks visual rules)*
```markdown
Based on the approved PRODUCT_BRIEF.md, design the UX/UI spec:
1. Information hierarchy & page map: routes, navigation, ONE primary CTA per screen
2. Design system: dark-first palette, typography scale, 8pt spacing tokens, radii, shadows
3. Purposeful motion: button hover/press, modal enter, skeleton shimmer
4. State coverage per screen: loading / empty (icon + CTA) / inline validation / server error retry / mobile
Output: unified UX_UI_SPEC.md. No disconnected screen mockups.
```

### Prompt C — Schema & API Contract *(no over-engineering)*
```markdown
Based on PRODUCT_BRIEF.md + UX_UI_SPEC.md:
1. Tables: exact column types, UUIDv7/cuid2 PKs, timestamps
2. FKs with ON DELETE CASCADE/RESTRICT + unique constraints
3. Index strategy: FKs and filtered status columns
4. API routes: method, path, Zod input schema, response shape
5. Over-engineering audit: REMOVE anything not required by MVP scope
Output: DATA_MODEL.md + API_SPEC.md.
```

### Prompt D — Implement One Vertical Slice *(the workhorse)*
```markdown
Implementing Vertical Slice #[X]: [FEATURE NAME, e.g. "Project Creation & Listing"]
Scope: user lists projects; modal form creates project; saved scoped to authenticated user.
Requirements:
1. UI: responsive card list + modal form with loading/empty/validation states, our design tokens
2. API: route with Zod validation + session user extraction
3. DB: Drizzle/Prisma query with tenant isolation (WHERE user_id = session.userId)
4. Tests: assert user A cannot see/edit user B's project
Smallest complete working slice; verify the journey in the browser.
```

### Prompt E — Payments & Webhooks
```markdown
Integrate [Stripe / Paddle / Lemon Squeezy / ABA PAYWAY]:
1. Backend endpoint creating hosted checkout with plan metadata
2. Webhook handler: verify signature, IDEMPOTENCY via processed_webhooks table,
   handle checkout.session.completed / payment_succeeded / payment_failed / subscription_deleted
3. Immutable ledger row in `orders`
4. Access granted ONLY by verified webhooks (never redirect params)
5. Include Stripe CLI commands + payload examples to test locally
```

### Prompt F — Security & Hardening Audit *(pre-launch)*
```markdown
Audit this repository and report findings:
1. Tenant isolation/IDOR: every mutation scoped to user_id?
2. All routes Zod-validated?
3. Rate limits on login / forgot-password / checkout?
4. Secrets: none committed, none exposed to client bundle?
5. Errors: no stack traces or SQL leaks in production responses?
Classify: [BLOCKER] / [HIGH] / [POST-LAUNCH]. Give exact patches for blockers.
```

### Prompt G — Surgical Bug Fixer
```markdown
Fix this bug: [PASTE ERROR / STACK TRACE / UNEXPECTED BEHAVIOR]
Protocol: 1) expected vs actual  2) root cause with evidence
3) minimal regression test that fails  4) SMALLEST safe patch  5) verify no unrelated files touched.
Do NOT refactor, rename, or upgrade dependencies.
```

### Prompt H — Pragmatic Test Suite
```markdown
Pragmatic tests for: [FEATURE / ROUTE, e.g. "Project Creation & Billing Webhook"]
1. Vitest integration: route + real DB together; tenant isolation (403/404); invalid payload → 400
2. Webhook: same payload twice → no duplicate credits
3. ONE Playwright E2E: happy path form → visible result; accessible locators only
No brittle unit tests for static DOM or library internals. Business logic + data integrity only.
```

### Prompt I — Apple-Grade UI Component
```markdown
Design an Apple-grade component: [e.g. "Feature Bento Grid" / "Empty State with 3D Sticker"]
1. Materials: frosted glass backdrop-filter blur(24px) saturate(190%), 1px specular top border, layered shadows
2. Motion: spring cubic-bezier(0.32,0.72,0,1); press = scale(0.95) with spring recovery
3. 3D asset prompt: matte-porcelain + frosted acrylic claymorphism, octane lighting, transparent PNG
4. Layout: responsive bento (2-col hero + 1-col cards → 1 col mobile)
Output: semantic HTML/React with scoped CSS tokens.
```

## ❌ Common Mistakes

- "Build me a full app" — the AI will invent half the schema; feed one prompt per phase instead.
- Accepting speculative code without saying "remove anything not in MVP scope".
- Pasting error text mid-argument with the AI — Prompt G exists for exactly that moment.
- Skipping the system prompt — every session starts dumb without it.

---
> ➡️ **Next**: [09 Templates & Checklists](09_TEMPLATES_AND_CHECKLISTS.md) — the documents the prompts ask for, ready to fill.
