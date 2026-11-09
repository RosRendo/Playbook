# 🎛️ Guide 14 — Proven UI Patterns & Micro-Interactions

> 📍 **Where you are**: Guide 14/15 — UI Patterns (final reference) · ⬅️ [13 Apple Design](13_APPLE_DESIGN_SYSTEM_AND_3D_ASSETS.md) · [🗺️ Full Journey Map](WHERE_AM_I.md) · 🏁 [09 Launch Checklist](09_TEMPLATES_AND_CHECKLISTS.md)

**🎯 After this page you can**: add production-proven craft details — synthesized sounds, slide-to-confirm, semantic colors, guardrail UX, AI-driven UI — all copy-paste.
**⏱ Read time**: 10 min · **💻 Copy-paste blocks**: 2 + 2 mini-patterns

---

## 💡 The Big Picture (30 seconds)

These patterns are distilled from real shipping products (Apex POS, StackGen, Journex, Service Finder, EstateX) — not hypothetical. Each solves one specific UX failure with ~50 lines. Beginner decode: *"Web Audio synthesis" = make click/success sounds in code instead of shipping MP3s · "Slide-to-confirm" = a slider instead of a button so critical taps can't be accidental · "Guardrail UX" = small checks that stop users making expensive mistakes.*

## ⚡ Quick Answer — Find Your Pattern

| When you need | Jump to |
| :--- | :--- |
| Click/success/error sounds with zero audio files | § 1 SoundEngine |
| Category colors across a dashboard | § 2 Color Matrix |
| Payment/delete can never be mis-pressed | § 3 Slide to Confirm |
| Users making expensive, regrettable actions | § 4 Guardrails |
| AI assistant that controls the UI | § 5 AI Dispatcher |

---

## 🔊 1. Zero-Asset Sound Synthesis (`lib/sound.ts`)

MP3s = latency + CORS + lag. Synthesize in the browser instead:

```typescript
let audioCtx: AudioContext | null = null;
function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

export const SoundEngine = {
  blip: (freq = 880, duration = 0.07) => {        // snappy click / scan blip
    try {
      const ctx = getContext(); if (!ctx) return;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + duration);
    } catch {}
  },

  success: () => {                                 // C-major arpeggio (rewarding chime)
    try {
      const ctx = getContext(); if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const t = ctx.currentTime + idx * 0.06;
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.35);
      });
    } catch {}
  },

  error: () => {                                   // descending buzz (warnings)
    try {
      const ctx = getContext(); if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.2);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.2);
    } catch {}
  },
};
```
Full React slider wiring uses this engine together with §3.

## 🎨 2. Semantic Category Color Matrix

Consistent category colors across every screen → instant subconscious recognition:

| Category | Tailwind text | Border / glow |
| :--- | :--- | :--- |
| Frontend / UI | `text-pink-400` | `border-pink-500/20 bg-pink-500/10` |
| Backend / API | `text-emerald-400` | `border-emerald-500/20 bg-emerald-500/10` |
| Database & cache | `text-sky-400` | `border-sky-500/20 bg-sky-500/10` |
| Auth & security | `text-violet-400` | `border-violet-500/20 bg-violet-500/10` |
| Payments | `text-yellow-400` | `border-yellow-500/20 bg-yellow-500/10` |
| Storage & files | `text-cyan-400` | `border-cyan-500/20 bg-cyan-500/10` |
| Queues / async | `text-indigo-400` | `border-indigo-500/20 bg-indigo-500/10` |
| AI / models | `text-purple-400` | `border-purple-500/20 bg-purple-500/10` |
| DevOps & deploy | `text-amber-400` | `border-amber-500/20 bg-amber-500/10` |
| Testing & QA | `text-rose-400` | `border-rose-500/20 bg-rose-500/10` |

## 📱 3. Slide to Confirm (irreversible actions)

Full React implementation (drag thumb 90% → success chime → onConfirm; release early → spring snap-back) lives in [UX_UI_SPEC.md §5](UX_UI_SPEC.md) and the original `SlideToConfirm.tsx` pattern. Use for: payments, workspace deletion, in-person job completion, trade execution. Trigger `SoundEngine.success()` on confirmation, `SoundEngine.error()` on drag-back.

## 🧠 4. Guardrails — protect users from permanent mistakes

| Context | Guardrail |
| :--- | :--- |
| Trading apps | 2-second reflective check: emotional tilt, loss streak, sleep — before big actions |
| SaaS deletion | Require **typing the workspace slug/email** (generic "Are you sure?" gets reflex-clicked) |
| Production deploys | Show the exact migration diff before allowing the push |

## 💬 5. AI assistant that drives the UI

Connect AI replies directly to app state, not just chat text:
```typescript
const AI_COMMAND_DISPATCHER: Record<string, (payload: any) => void> = {
  FILTER_MAP_MARKERS: (status: string) => mapStore.setFilter(status),
  APPLY_DISCOUNT: (percent: number) => cartStore.setDiscount(percent),
  SWITCH_VIEW_MODE: (mode: 'bento' | 'table') => uiStore.setViewMode(mode),
};
```
User asks *"show me properties with overdue rent"* → AI replies in text **and** emits `{ action: "FILTER_MAP_MARKERS", payload: "overdue" }` → the page visibly changes while the user watches.

## ❌ Common Mistakes

- Sounds on every hover → noise fatigue; reserve for confirm/error moments only.
- Slide-to-confirm on low-stakes buttons → tedious app; it's for irreversible actions.
- Random colors per tag → gives zero pattern recognition; stick to the matrix.
- AI chat that only *talks* — wire it to state or it's a gimmick.
- Guardrail = another "Are you sure?" popup — users click through reflexively; require effort instead (typing the name, viewing the diff).

---
🏁 **You've reached the end of the reference guides.** Return to the launch gate in [09 Templates & Checklists](09_TEMPLATES_AND_CHECKLISTS.md) or your [🗺️ journey map](WHERE_AM_I.md).
