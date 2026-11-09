# 🔄 Guide 00 — The Lifecycle & Operating Rules

> 📍 **Where you are**: Guide 00/15 — Lifecycle Map · ⬅️ [README](README.md) · [🗺️ Full Journey Map](WHERE_AM_I.md) · ➡️ [01 Architecture](01_ARCHITECTURE_TIERS.md)

**🎯 After this page you can**: name which of the 6 phases you're in, and know exactly what must be true before moving to the next.
**⏱ Read time**: 10 min · **💻 Command blocks**: 1

---

## 💡 The Big Picture (30 seconds)

Solo devs don't fail at coding — they fail at **drifting**: spending 2 weeks on Docker with 0 users, redesigning schemas 4 times, polishing dashboards when checkout doesn't exist. The cure is a fixed pipeline with **Gates**: you cannot advance until the current phase's exit condition is real. Gates are your save points.

## ⚡ Quick Answer

**The 6 phases and their gates:**

| Phase | You do | Gate to pass (✅ = allowed to continue) | Max time |
| :--- | :--- | :--- | :--- |
| 1. Discovery & Scope | Define user, problem, journey, non-goals | Can pitch it in 3 sentences + ≥5 non-goals written | 2–4 h |
| 2. Architecture & UX | Pick tier, design schema, map routes, tokens | Schema documented with types, no speculative tables | 4–8 h |
| 3. Foundation Scaffold | Repo, DB connection, layout shell | `pnpm dev` runs, DB connects, zero console errors | 4 h |
| 4. Vertical Slices | Build feature by feature (UI+API+DB+test) | Real human completes the primary journey end-to-end | days |
| 5. Hardening | Webhooks, RBAC, validation, all 7 UI states | Sandbox payment works; duplicate webhook ≠ double credit; ID tampering = 403 | 1–2 days |
| 6. Launch | Deploy, DNS, SSL, smoke test, telemetry | Real signup + purchase on the live domain, zero critical errors | 1 day |

```bash
npx create-next-app@latest . --typescript --app --tailwind --src-dir
```

## 🦶 Step by Step (using this guide)

### Step 1 — Answer the 5 Mandatory Questions
1. Who is the target user?
2. What is the single painful problem?
3. Business model? (free / subscription / pay-per-use / fee)
4. The **one primary journey** — "lands on page → submits → pays → receives download"
5. **non-Goals for v1.0** — at least 5 things you decided NOT to build.

**✅ Done when**: your non-goal list has 5+ entries. [Template](09_TEMPLATES_AND_CHECKLISTS.md).

### Step 2 — Classify every new idea that comes mid-project
New feature requests? → they go to `ICEBOX.md`. Scope freezes when Phase 2 starts. Requests do not resurrect before Phase 6.

### Step 3 — Respect the gate, every time
Before starting Phase N+1, literally re-read the gate row above. If a checkbox isn't true, that's your current task.

## ⚖️ The Anti-Pattern Law (what to never allow)

| Forbidden sentence | Why it kills you | Enforced rule |
| :--- | :--- | :--- |
| "Let's write a custom auth system" | Hashing/session bugs for months | Clerk, Supabase Auth, or Better Auth — always |
| "We might need microservices later" | 10x deploy complexity now | Modular monolith; split only for distinct compute (e.g. video encoding) |
| "Add Redis caching on day 1" | Invalidation bugs, stale data | Cache when DB CPU > 70% for real |
| "We need Kubernetes" | Weeks on Helm charts | Vercel / Railway / Render / Coolify |
| "Trust the frontend payment redirect" | Users forge success URLs | Paid status ONLY from verified server-side webhooks |

## ❌ Common Mistakes

- Building all DB tables in week 1 → drift. Schemas are JIT (see [03](03_DATABASE_BACKEND_DISCIPLINE.md)).
- Skipping Phase 1 because the idea "is obvious" → non-goals undocumented → scope creep week 3.
- Treating gates as formality — the gate IS the product safety belt.
- Adding "we'll need this later" columns — you won't; migrations are cheap.

## 📚 Reference: Why Vertical Slices Beat Horizontal Layers

```text
HORIZONTAL (drift):  Week1 tables → Week2 controllers → Week3 pages
                     Day 20: nothing works together.

VERTICAL (ships):    Day1: signup -> working. Day2: create item -> working.
                     Day3: view/edit -> working. Day4: checkout -> working.
                     Every day you hold a deployable product.
```

A **vertical slice** = UI + form validation + API route + service logic + DB mutation + test, for one user action. Detailed as [Prompt D in guide 08](08_PROMPT_LIBRARY_AND_RECIPES.md).

---
> ➡️ **Next**: [01 Architecture Tiers](01_ARCHITECTURE_TIERS.md) — pick Level 1/2/3 and fill the tech stack table.
