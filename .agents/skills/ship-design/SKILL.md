---
name: ship-design
description: >-
  Designs Apple-grade UI systems with frosted glass (vibrancy), spring physics, Bento grids,
  3D claymorphism/acrylic stickers, and the 7 mandatory UI states. Use when the user says
  "/ship-design", "/design", "/apple-design", "/ui", "design the app", "make it look like apple", or "bento grid".
---

# /ship-design: Apple-Grade UI & 3D Asset System

Your job is to provide Cupertino-level visual polish, tactile micro-animations, and 3D asset generation prompts so the product looks like a $50M venture-backed app.

Reads: `PRODUCT_BRIEF.md`
Writes: `UX_UI_SPEC.md` and design tokens in CSS.

---

## 💎 The 4 Apple HIG Pillars

### 1. Frosted Glass Material (Vibrancy)
```css
.apple-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.4);
}
```

### 2. Apple Spring Physics
- Sheet / Modal Spring: `cubic-bezier(0.32, 0.72, 0, 1)`
- Tactile Pill Button:
```css
.apple-btn {
  border-radius: 9999px;
  transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}
.apple-btn:active { transform: scale(0.95); transition-duration: 0.1s; }
```

### 3. Apple Bento Grid Layout
- 2-column wide Hero card for main feature with interactive graphic.
- 1-column detail cards for secondary metrics and controls.
- Responsive single-column collapse for `<768px`.

### 4. 3D Sticker AI Generation Prompts
Always provide copy-paste prompts for AI image generation (claymorphism + frosted glass):
- **Empty State**: *"A sleek 3D sticker icon of [object], Apple design aesthetic, visionOS style. Made of frosted translucent glass and smooth matte white porcelain clay. Soft rim lighting, octane render, clean transparent PNG background, isometric view."*
- **Success / Upgrade**: *"A floating 3D minimalist metallic and frosted glass trophy emblem, Apple Keynote product style. Brushed titanium, ambient neon indigo glow, clean transparent background."*

### 5. Physical Micro-Audio & Gestures (Native Web Audio)
- **Zero-Asset Sound**: Use native `AudioContext` for 880Hz scan blips, C-major arpeggiated success chords, and error buzzes.
- **Slide to Confirm**: Use swipe pan-responders for high-stakes irreversible actions (payments, deletions).
- **Category Colors**: Frontend (Pink), Backend (Emerald), Database (Sky), Auth (Violet), Payments (Yellow), AI (Purple).

---

## 🛡️ The 7 Mandatory UI States
Every screen must define all 7 states:
1. **Populated**: Clean card layout.
2. **Loading**: Skeleton shimmer loader (no layout shift).
3. **Empty**: 3D sticker illustration + friendly headline + CTA button.
4. **Validation Error**: Inline red feedback under input fields.
5. **Server Error**: Card with human error message + "Try Again" retry button.
6. **Success**: Auto-dismissing toast (3s) with haptic audio feedback.
7. **Mobile**: Stacked cards, bottom navigation, touch targets $\ge 44\times 44\text{px}$.

**Exit Condition**: Design tokens, component specs, and 3D prompts are written in `UX_UI_SPEC.md`.
