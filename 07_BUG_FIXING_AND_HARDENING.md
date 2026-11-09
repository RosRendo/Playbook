# 🐛 Guide 07 — Surgical Bug Fixing & Hardening

> 📍 **Where you are**: Guide 07/15 — Bug Fixing · ⬅️ [06 Scaling & DevOps](06_SCALING_AND_DEVOPS.md) · [🗺️ Full Journey Map](WHERE_AM_I.md) · ➡️ [08 Prompt Library](08_PROMPT_LIBRARY_AND_RECIPES.md)

**🎯 After this page you can**: fix any bug in ≤15 minutes with a <20-line patch, a regression test, and zero collateral damage.
**⏱ Read time**: 8 min · **💻 Copy-paste blocks**: 2

---

## 💡 The Big Picture (30 seconds)

When bugs appear, devs (and AIs) make a lethal move: rewrite the whole module, upgrade 6 libraries, refactor folders. A 10-line bug becomes 400 lines of change and 3 new bugs. The protocol: **reproduce → isolate → failing test → smallest patch → check blast radius.** Nothing else touched.

## ⚡ Quick Answer — the never-refactor rule

> When fixing a bug: NO renamed variables, NO upgraded libraries, NO moved imports, NO "while I'm in here" cleanups. Smallest correct patch only.

## 🦶 Step by Step

### Step 1 — Reproduce & document (you cannot fix what you can't see)
- **Steps**: "go to `/billing` → Cancel Subscription → confirm modal"
- **Expected**: status → `canceling`, toast appears
- **Actual**: HTTP 500, modal freezes

**✅ Done when**: you can trigger it on demand.

### Step 2 — Isolate the root cause with evidence
Backend stack trace (server.log / Sentry) → network tab payload/status → DB state before/after. Prime suspects in fullstack apps:

| Suspect | Typical smell |
| :--- | :--- |
| Unchecked null | `user.stripe.subscriptionId` when `stripe` is null |
| Missing `await` | DB mutation fired without await; unhandled promise |
| Timezone | `Date.now()` saved without UTC offset |
| Stale state/closure | React `useState` not updated inside the event loop |

### Step 3 — Write the failing test FIRST
```typescript
it('marks subscription canceled without crashing when stripe_id is missing', async () => {
  const user = await createTestUser({ stripeCustomerId: null });
  const response = await request(app)
    .post('/api/billing/cancel').set('Authorization', `Bearer ${user.token}`);

  expect(response.status).toBe(200);
  expect(response.body.status).toBe('canceled');
});
```
Run it — **it must fail** before you touch the source.

### Step 4 — Apply the smallest patch
```diff
- const customer = await stripe.customers.retrieve(user.stripeCustomerId);
+ if (!user.stripeCustomerId) {
+   await db.update(users).set({ subscriptionTier: 'free' }).where(eq(users.id, user.id));
+   return res.json({ status: 'canceled' });
+ }
+ const customer = await stripe.customers.retrieve(user.stripeCustomerId);
```

### Step 5 — Verify the blast radius
```bash
pnpm test        # full suite green?
git diff         # review every single line — unrelated files?
```
Ask: "could this patch break users with different DB records?"

**✅ Done when**: test green, suite green, diff is 1–2 files.

## 🛡️ Production Hardening Shields

| Failure mode | How it shows | Shield |
| :--- | :--- | :--- |
| Race conditions | Double-click "Submit" → charged twice | Unique DB constraint + disable button on first click |
| Silent API failures | Stripe/Resend/OpenAI down → blank screen forever | 5s timeout + catch with friendly fallback |
| Unbounded queries | `SELECT * FROM logs` → 500k rows → OOM | `LIMIT 50` pagination on every list endpoint |
| Wrong Content-Type | Backend crash on `req.body` | Strict Zod parse + explicit error handler |

## ❌ Common Mistakes

- Fixing before reproducing → patching the wrong layer.
- "Refactor while fixing" → regression roulette.
- Patching symptoms (re-rendering to hide the null crash) instead of the cause.
- No regression test → identical bug returns next sprint.
- Debugging blind without Sentry/logs — evidence before theory.

---
> ➡️ **Next**: [08 Prompt Library](08_PROMPT_LIBRARY_AND_RECIPES.md) — the copy-paste prompt that enforces this protocol on any AI.
