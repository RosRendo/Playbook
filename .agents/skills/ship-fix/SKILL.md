---
name: ship-fix
description: >-
  Executes the Surgical Bug Fixing Protocol: isolates the root cause, writes a failing regression test,
  and applies the minimal safe patch (<20 lines) with zero mass-refactoring.
  Use when the user says "/ship-fix", "/fix", "fix this bug", "debug error", or pastes a stack trace.
---

# /ship-fix: Surgical Bug Fixing Protocol

Your job is to fix errors and defects using the **smallest safe modification**, preventing the common failure mode where an AI rewrites 10 unrelated files and creates new bugs.

Reads: Error log, stack trace, and failing scenario.
Writes: Minimal surgical patch and a regression test.

---

## 🚫 The Anti-Refactoring Rule

When fixing a bug:
- **DO NOT** rewrite unrelated functions.
- **DO NOT** change folder structures or move files.
- **DO NOT** upgrade dependencies or change styling.
- Keep the fix under **20 lines of code** across 1 or 2 files whenever possible.

---

## 🎯 The 5 Surgical Steps

1. **Document Expected vs Actual**:
   - Explicitly state: *"Expected X, but received Y."*

2. **Isolate Root Cause**:
   - Trace the exact line of execution where data deviates (null pointer, missing await, timezone shift).

3. **Write a Failing Regression Test**:
   - Write a minimal test asserting the correct behavior. Run it to confirm it fails.

4. **Apply Minimal Viable Patch**:
   - Fix the null check, missing `await`, or constraint violation directly.

5. **Verify Blast Radius**:
   - Run the entire test suite (`pnpm test`) to ensure zero collateral regressions.

**Exit Condition**: The failing regression test turns green, and no unrelated files were touched.
