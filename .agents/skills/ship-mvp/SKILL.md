---
name: ship-mvp
description: >-
  Defines the product brief, target user, core value proposition, single primary user journey,
  and explicit non-goals for an MVP. Use when the user says "/ship-mvp", "/mvp", "plan the product",
  "product brief", "scope the mvp", "what should I build first", or gives a raw product idea.
---

# /ship-mvp: Product Discovery & MVP Scope Gate

Your job is to define the **minimum viable product** that can be shipped and monetized in days, not months. You prevent feature creep before writing a single line of code.

Reads: User's raw product idea or existing brief.
Writes: `PRODUCT_BRIEF.md`

---

## 🎯 Step 1: Extract the 5 Pillars

Ask or infer the answers to these 5 questions:
1. **Target User**: Who specifically experiences the pain? (Be concrete: "Freelance web designers", not "everyone").
2. **Core Problem**: What painful, frequent, or expensive problem are they facing?
3. **Primary User Journey (The 1 Happy Path)**:
   - Step 1: User lands on page
   - Step 2: Signs up
   - Step 3: Performs the ONE core value action
   - Step 4: Receives value / pays
4. **Monetization Model**: Subscription SaaS ($X/mo), one-time payment ($Y), usage-based, or marketplace fee.
5. **Target Delivery Level**:
   - **Level 1 (MVP)** by default.

---

## 🚫 Step 2: Enforce the 5 Non-Goals

Every MVP must list at least **5 things we explicitly will NOT build in v1**:
- ❌ No multi-organization / team workspaces (single-user first)
- ❌ No custom domain mapping
- ❌ No multi-language localization
- ❌ No advanced automated accounting sync
- ❌ No speculative features before customer validation

---

## 📄 Output Template: `PRODUCT_BRIEF.md`

Generate `PRODUCT_BRIEF.md` in the project root:

```markdown
# 🚀 Product Brief: [Product Name]

## 1. Problem & Target User
- **Target User**: [Specific ICP]
- **Core Problem**: [Pain point]
- **Current Alternative**: [What they use today]

## 2. Core Value Proposition
- [The 1-sentence value statement]

## 3. The 1 Primary User Journey
1. Landing Page → 2. Auth → 3. Core Action → 4. Value Delivered / Payment

## 4. MVP Scope vs Non-Goals
### In Scope (v1.0)
- [ ] Essential Auth & Profile
- [ ] Core Feature Workflow
- [ ] Payment Checkout & Webhook
- [ ] Responsive Dashboard

### Out of Scope (Frozen for Post-Launch)
- ❌ [Non-goal 1]
- ❌ [Non-goal 2]
- ❌ [Non-goal 3]
- ❌ [Non-goal 4]
- ❌ [Non-goal 5]
```

**Exit Condition**: You can explain the MVP in 3 sentences, and the user approves the non-goals before moving to `/ship-arch`.
