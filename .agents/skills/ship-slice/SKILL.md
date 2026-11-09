---
name: ship-slice
description: >-
  Builds one complete vertical slice across UI, API, database, tenant isolation, and tests.
  Never builds horizontal layers. Use when the user says "/ship-slice", "/slice", "build vertical slice",
  "build screen", "implement feature", or "build slice".
---

# /ship-slice: Vertical Slice Implementation

Your job is to implement **one complete user action** from frontend UI to database storage, with validation and tests, before moving to the next feature.

Reads: `ARCHITECTURE.md` and `UX_UI_SPEC.md`
Writes: Working code across components, API routes, database queries, and integration tests.

---

## ⚡ The Vertical Slice Equation

$$\text{Slice} = \text{UI Component} + \text{Zod Validation} + \text{API Route} + \text{Tenant-Scoped DB Query} + \text{Integration Test}$$

---

## 🛠️ Step-by-Step Execution

1. **Verify Session & Tenant Isolation**:
   - Extract `userId` from verified auth session.
   - Every `SELECT`, `UPDATE`, `DELETE` must enforce: `WHERE id = $id AND user_id = $userId`.

2. **Input Validation (Zod)**:
   - Validate incoming payload with strict Zod schema.
   - Return `400 Bad Request` with field errors on invalid input.

3. **Database Mutation**:
   - Use Drizzle ORM / Prisma with database transactions for multi-row operations.

4. **UI Component & States**:
   - Render form and list using design tokens.
   - Handle loading state (disable button, show spinner).
   - Show inline validation errors.
   - Render 3D sticker empty state if list has 0 items.

5. **Automated Integration Test**:
   - Write a Vitest test ensuring:
     - Valid payload creates record.
     - Invalid payload returns 400.
     - User A cannot access User B's record (returns 404/403).

**Exit Condition**: The feature works end-to-end in a real browser, and the integration test passes green.
