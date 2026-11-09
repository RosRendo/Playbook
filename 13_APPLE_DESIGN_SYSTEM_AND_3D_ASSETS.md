# 🍎 Guide 13 — Apple Design System & 3D Assets

> 📍 **Where you are**: Guide 13/15 — Apple Design · ⬅️ [12 SEO & Analytics](12_SEO_METADATA_AND_ANALYTICS.md) · [🗺️ Full Journey Map](WHERE_AM_I.md) · ➡️ [14 UI Patterns](14_PROVEN_UI_PATTERNS_AND_MICRO_INTERACTIONS.md)

**🎯 After this page you can**: build the "looks like Apple" look — frosted glass, spring motion, bento grids — purely by pasting, plus generate cohesive 3D stickers with AI prompts.
**⏱ Read time**: 12 min · **💻 Copy-paste blocks**: 4 + 3 image prompts

---

## 💡 The Big Picture (30 seconds)

"I want it to look like Apple" = four ingredients, not a design team:
1. **Frosted glass** — translucent, blurred surfaces ("frosted window") with a 1px light edge
2. **Spring motion** — animations that settle like a pushed-then-released spring, never stopping dead
3. **Bento grid** — the keynote card of boxes: a clean, varied-size card layout for features
4. **3D stickers** — matte clay / glass illustrations for empty states and badges (AI-generated, not modeled)

## ⚡ Quick Answer

Skip Blender, skip paid assets. Tokens + the 4 blocks below + 3 AI prompts. Complementary foundation: [plain-English primer in guide 02](02_UX_UI_DESIGN_SYSTEM.md) and the finished spec in [UX_UI_SPEC.md](UX_UI_SPEC.md).

## 🦶 Step by Step

### Step 1 — Add the glass material tokens
```css
:root {
  --apple-glass-bg: rgba(255,255,255,0.05);
  --apple-glass-bg-hover: rgba(255,255,255,0.08);
  --apple-glass-border: rgba(255,255,255,0.12);
  --apple-glass-blur: blur(24px) saturate(190%);
  --apple-shadow-subtle: 0 4px 20px -2px rgba(0,0,0,0.4);
  --apple-shadow-lifted: 0 20px 40px -15px rgba(0,0,0,0.6), 0 0 1px 1px rgba(255,255,255,0.08);
  --apple-spring: cubic-bezier(0.32, 0.72, 0, 1);        /* iOS sheet/modal curve */
  --apple-spring-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}

.apple-card {
  background: var(--apple-glass-bg);
  backdrop-filter: var(--apple-glass-blur);
  -webkit-backdrop-filter: var(--apple-glass-blur);
  border: 1px solid var(--apple-glass-border);
  border-radius: 20px;                       /* squircle feel */
  box-shadow: var(--apple-shadow-subtle);
  position: relative; overflow: hidden;
  transition: transform 0.4s var(--apple-spring), box-shadow 0.4s var(--apple-spring);
}
.apple-card::before {                        /* 1px specular top edge */
  content: ''; position: absolute; inset: 0 0 auto 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
}
.apple-card:hover { transform: translateY(-2px); box-shadow: var(--apple-shadow-lifted); }
```

### Step 2 — The tactile button (weight on press)
```css
.apple-btn {
  display:inline-flex; align-items:center; gap:8px; padding:12px 24px;
  border-radius:9999px; font-size:14px; font-weight:500; letter-spacing:-0.01em;
  background:#fff; color:#000; border:none; cursor:pointer; user-select:none;
  transition: transform 0.25s var(--apple-spring), filter 0.2s ease;
}
.apple-btn:hover  { filter: brightness(1.08); }
.apple-btn:active { transform: scale(0.95); transition-duration: 0.1s; }
```

### Step 3 — Bento grid (the keynote card)
```css
.apple-bento-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; max-width:1200px; margin:0 auto; padding:40px 20px; }
.bento-span-2   { grid-column: span 2; }
.bento-badge    { font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; color:#a1a1aa; margin-bottom:12px; }
@media (max-width:768px) { .apple-bento-grid { grid-template-columns:1fr; } .bento-span-2 { grid-column: span 1; } }
```
```html
<div class="apple-bento-grid">
  <div class="apple-card bento-span-2"><div class="bento-badge">Intelligence</div><h2>Automated Vertical Slices</h2><p>API, DB and UI in lockstep.</p></div>
  <div class="apple-card"><div class="bento-badge">Speed</div><h3>Sub-second Deploys</h3></div>
  <div class="apple-card"><div class="bento-badge">Security</div><h3>Tenant Isolation</h3></div>
</div>
```

### Step 4 — Generate 3D stickers with these prompts (Midjourney / DALL·E 3 / Gemini)
| Use case | Prompt |
| :--- | :--- |
| Empty state / onboarding | `A sleek 3D sticker icon of an open minimalist document folder with floating glowing geometric shapes, Apple design aesthetic, visionOS style. Made of frosted translucent glass and smooth matte white porcelain clay. Soft violet and warm amber subtle rim lighting, diffuse global illumination, octane render, 8k, isometric view, clean pure transparent PNG background, no shadows on ground.` |
| Success / upgrade badge | `A floating 3D minimalist metallic and frosted glass trophy emblem, Apple Keynote product style. Brushed titanium finish, soft iridescent translucent glass ribbon, ambient neon indigo glow, depth of field, raytraced octane render, clean transparent background, centered composition.` |
| Feature / metric asset | `A floating 3D credit card with a glowing microchip and floating holographic coins, Apple Card aesthetic. Matte titanium finish, translucent frosted acrylic layers, ambient studio softbox lighting, ultra-minimalist, isometric angle, isolated on transparent background.` |

**✅ Done when**: your landing/hero cards render the glass look and one sticker sits in an empty state.

## 🎁 Finishing touch — micro audio (optional, 5 min)
A tiny synthesized click makes CTAs feel physical — no MP3 files needed:
```typescript
export function playAppleClick() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(320, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.012);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.012);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.012);
}
// <button onClick={() => { playAppleClick(); submitOrder(); }}>
```

## 📦 Free asset libraries

- [Lucide icons](https://lucide.dev/) — SF-Symbols-like geometric icons
- [LottieFiles / DotLottie](https://lottiefiles.com/) — smooth micro-animations
- [Shapefest](https://www.shapefest.com/) — 100k free 3D clay/glass shapes
- Inter / SF Pro — the typography standard

## ❌ Common Mistakes

- `backdrop-filter` without the 1px specular border → flat grey, not glass.
- Linear `ease` everywhere → feels cheap; springs or nothing.
- 3D stickers with baked-in shadows on white backgrounds → impossible to place on glass cards; demand transparent backgrounds in the prompt.
- Bento cards with 10 features each — 1 idea per card, keynote discipline.
- Desktop-only glass — verify `backdrop-filter` fallback (solid `--bg-surface`) on older browsers.

---
> ➡️ **Next**: [14 Proven UI Patterns](14_PROVEN_UI_PATTERNS_AND_MICRO_INTERACTIONS.md) — sound synthesis, slide-to-confirm, guardrails.
