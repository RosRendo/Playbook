# 🌐 Guide 12 — SEO, OpenGraph & Product Analytics

> 📍 **Where you are**: Guide 12/15 — SEO & Analytics · ⬅️ [11 Files & Emails](11_FILES_STORAGE_AND_EMAILS.md) · [🗺️ Full Journey Map](WHERE_AM_I.md) · ➡️ [13 Apple Design](13_APPLE_DESIGN_SYSTEM_AND_3D_ASSETS.md)

**🎯 After this page you can**: make any link you post render a rich 1200×630 card in feeds, and see exactly where the funnel loses people.
**⏱ Read time**: 10 min · **💻 Copy-paste blocks**: 3 (metadata, sitemap, 4 events)

---

## 💡 The Big Picture (30 seconds)

When you post your link on X/LinkedIn/Discord/Reddit you have **1.2 seconds**. A broken grey preview cuts click-through by ~80% — the OG card IS your first impression. Second: heavy analytics scripts slow pages and bury the 4 numbers that matter. Lightweight events on the 4 key moments beat dashboards of noise.

## ⚡ Quick Answer

- OG image: **1200×630 px**, text centered (mobile feeds crop edges)
- Next.js: `metadata` export in `layout.tsx` handles OG/Twitter automatically
- Sitemap + robots.txt: search-engine permission slip
- PostHog / Plausible over Google Analytics (cookie banner, +600ms, dashboard paralysis)

## 🦶 Step by Step

### Step 1 — Metadata (Next.js App Router)
```typescript
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://yourapp.com'),
  title: { default: 'SaaS Name — The Modern Operating System', template: '%s | SaaS Name' },
  description: 'Ship products faster without getting stuck in architecture loops.',
  openGraph: {
    title: 'SaaS Name — The Modern Operating System',
    description: 'Ship products faster without getting stuck in architecture loops.',
    url: 'https://yourapp.com',
    siteName: 'SaaS Name',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'SaaS Name Preview' }],
    type: 'website', locale: 'en_US',
  },
  twitter: { card: 'summary_large_image', creator: '@yourhandle' },
  robots: { index: true, follow: true },
};
```

**✅ Done when**: pasting your URL into the Twitter/X compose box shows the card (use opengraph.xyz to preview all platforms).

### Step 2 — robots.txt + sitemap
```text
# app/robots.txt — equivalent config
User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /settings/
Sitemap: https://yourapp.com/sitemap.xml
```
```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://yourapp.com';
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ];
}
```
**Never index** auth/dashboard/settings pages — private content leaking to Google is an SEO incident and a security smell.

### Step 3 — Track exactly 4 events (the whole funnel)
```typescript
import posthog from 'posthog-js';

posthog.capture('cta_clicked',  { location: 'hero_section' });          // 1. landing CTA
posthog.identify(user.id, { email: user.email });
posthog.capture('user_registered');                                     // 2. signed up
posthog.capture('checkout_initiated', { plan: 'pro_monthly', price: 19 }); // 3. started checkout
posthog.capture('first_item_created', { category: 'marketing' });       // 4. reached core value
```

**✅ Done when**: the PostHog funnel shows `Visitors → Signups → Activated → Paid` and you can see the drop-off %:

```text
Visitors ──12%──> Signups ──35%──> Activated ──8%──> Paid
```

## ⚖️ Rules of Thumb

| Situation | Do |
| :--- | :--- |
| OG image per dynamic page | Use `@vercel/og` / satori or per-page metadata export |
| Analytics choice | PostHog (funnels + session replay + flags) or Plausible (pure lightweight) |
| Private pages | `robots: { index: false }` on the dashboard layout |

## ❌ Common Mistakes

- Designing the OG image at wrong size (4:3, square) → cropped text in feeds.
- Same title on every page — use the `template` so each page gets a distinct title.
- Dashboard URLs indexable by Google → leaks private data into search results.
- Tracking 47 vanity events on day 1 — 4 events with a funnel is a decision tool; 47 is noise.
- GA-class scripts before launch: consent banner + slower Lighthouse killing your ranking.

---
> ➡️ **Next**: [13 Apple Design System](13_APPLE_DESIGN_SYSTEM_AND_3D_ASSETS.md) — when "make it look like Apple" is a requirement.
