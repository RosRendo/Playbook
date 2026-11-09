# 🎨 Guide 02 — UX/UI Design System (Plain English First)

> 📍 **Where you are**: Guide 02/15 — UX/UI Design · ⬅️ [01 Architecture](01_ARCHITECTURE_TIERS.md) · [🗺️ Full Journey Map](WHERE_AM_I.md) · ➡️ [03 Database](03_DATABASE_BACKEND_DISCIPLINE.md)

**🎯 After this page you can**: make any screen look premium and consistent without design skills — by copying tokens and following the 7-state checklist.
**👀 See, don't imagine**: open [showcase/playbook-ux-visual.html](showcase/playbook-ux-visual.html) — it renders every rule on this page as live UI (color swatches, 4-layer mock, all 7 states, interactive demos).
**⏱ Read time**: 15 min · **💻 Copy-paste blocks**: 4 (tokens, buttons, modal, skeleton)

---

## 💡 The Big Picture (30 seconds)

Apps look amateur from **inconsistency**: random hex colors, mismatched margins, broken state transitions — not from lacking complex graphics. The fix: define every color/size ONCE as a CSS token, use a fixed layout hierarchy, and pass the 7-state checklist on every screen.

## 🧒 Plain-English Dictionary (no design background needed)

| Designer word | Plain English | One rule |
| :--- | :--- | :--- |
| **Design token** | A saved nickname for a color/size reused everywhere (`--primary`) | Define once at the top; change one line, whole app updates |
| **Information hierarchy** | What the user sees 1st, 2nd, 3rd | Biggest = most important; ONE primary button per page |
| **App shell** | Frame that never changes (top bar, sidebar) | Build the frame first, content swaps inside |
| **State** | How a screen looks per situation | Every screen must handle all 7 (checklist below) |
| **Empty state** | Screen when there's nothing to show | Icon + friendly text + create-button. Never blank |
| **Skeleton loader** | Grey shimmer blocks shaped like content | Users hate spinners; skeletons feel 30% faster |
| **Motion / micro-animation** | Small useful movement | Only move things to COMMUNICATE — never for flash |
| **Toast** | Small auto-dismiss confirmation popup | Confirm success this way, not blocking dialogs |
| **Responsive** | Same screen rearranged for phone width | Tables → stacked cards; 44px touch targets |

### The 4 questions to ask on every new screen
1. What is the **one main action**? (make it the most visible button)
2. What shows **while loading**? (skeleton)
3. What with **zero data**? (empty state + CTA)
4. What if the **server fails**? (human message + Try Again)

> That's 80% of UX/UI. Everything below is the copy-paste implementation.

## ⚡ Quick Answer

- **Theme**: dark-first, `#090a0f` canvas · one accent color (`#6366f1` indigo default)
- **Font**: Inter (+ JetBrains Mono for code) · **Spacing**: 8pt grid only
- **Never build**: your own color system per screen, a spinner on slow data, a confirm-on-every-click dialog

## 🦶 Step by Step

### Step 1 — Paste the tokens into `globals.css`
```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --bg-canvas: #090a0f;      --bg-surface: #12141c;
  --bg-surface-hover: #191c28; --bg-surface-active: #222638;
  --border: rgba(255,255,255,0.08);
  --border-focus: rgba(99,102,241,0.5);

  --text-primary: #f8fafc;   --text-secondary: #94a3b8;
  --text-muted: #64748b;     --text-inverse: #090a0f;

  --primary: #6366f1;        --primary-hover: #4f46e5;
  --primary-glow: rgba(99,102,241,0.25);

  --success: #10b981;  --success-bg: rgba(16,185,129,0.12);
  --warning: #f59e0b;  --warning-bg: rgba(245,158,11,0.12);
  --danger: #ef4444;   --danger-bg: rgba(239,68,68,0.12);
  --info: #3b82f6;

  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px;

  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px; --radius-full: 9999px;

  --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.4);
  --shadow-md: 0 4px 12px -1px rgba(0,0,0,0.5), 0 2px 6px -1px rgba(0,0,0,0.3);
  --shadow-glow: 0 0 20px -2px var(--primary-glow);

  --transition-fast: 150ms cubic-bezier(0.16,1,0.3,1);
  --transition-normal: 250ms cubic-bezier(0.16,1,0.3,1);
}
```
**✅ Done when**: every color/spacing value in your app renders via `var(--...)`, no raw hex outside this block.

### Step 2 — Build every page with the 4-layer hierarchy
1. **App shell**: sticky nav / sidebar — logo, nav links, avatar menu.
2. **Page header**: `h1` title, breadcrumbs, ONE primary action button (`+ Create Project`).
3. **Primary content**: cards with `1px solid var(--border)`, the data table/editor.
4. **Level 4 — Drawers/modals**: only for focused tasks (create/edit/confirm delete).

### Step 3 — Copy the three mandatory motion snippets
```css
/* Tactile button */
.btn-primary { background: var(--primary); color:#fff; border-radius: var(--radius-md);
  padding:10px 18px; font-weight:500;
  transition: transform var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast);
  box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
.btn-primary:hover { background: var(--primary-hover); transform: translateY(-1px); box-shadow: var(--shadow-glow); }
.btn-primary:active { transform: translateY(1px); }

/* Modal entrance (never pop abruptly) */
@keyframes modalEnter { from { opacity:0; transform: scale(0.96) translateY(8px);} to { opacity:1; transform: scale(1) translateY(0);} }
.modal-content { animation: modalEnter var(--transition-normal) forwards; }

/* Skeleton shimmer (no layout shift) */
@keyframes shimmer { 0% { background-position:-200% 0;} 100% { background-position:200% 0;} }
.skeleton { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 37%, rgba(255,255,255,0.04) 63%);
  background-size:200% 100%; animation: shimmer 1.8s infinite linear; border-radius: var(--radius-sm); }
```

### Step 4 — Audit every screen against the 7 Mandatory UI States
| # | State | Requirement |
| :--- | :--- | :--- |
| 1 | Populated | Clean cards, clear hierarchy |
| 2 | Loading | Skeleton matching exact card size; buttons disabled + "Loading…" |
| 3 | Empty | Icon + "No projects yet" + helpful line + `+ Create` CTA |
| 4 | Validation error | Inline under the field, red border + "Please enter a valid email" |
| 5 | Server error | Human-readable card + **Try Again** (never raw JSON) |
| 6 | Success | Auto-dismiss toast ~3s, green check |
| 7 | Mobile (<768px) | Tables → stacked cards; nav → bottom bar/sheet; ≥44px targets |

**✅ Done when**: each screen has 7/7. **Want the premium Apple look?** → [guide 13](13_APPLE_DESIGN_SYSTEM_AND_3D_ASSETS.md). **Finished spec artifact to steal**: [UX_UI_SPEC.md](UX_UI_SPEC.md).

## ❌ Common Mistakes

- Picking colors per-screen instead of tokens → "redesign hell" rerouting everything later.
- `alert()` or full-page popups for success — use toasts.
- Spinners over skeletons (layout jumps, feels slow).
- Testing only the happy path — states 2–5 are where users judge your quality.
- Animating everything; motion illness makes apps feel broken.

---
> ➡️ **Next**: [03 Database Discipline](03_DATABASE_BACKEND_DISCIPLINE.md) — 3 tables, no paralysis, migrations in 30 seconds.
