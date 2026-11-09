"use client";

import React from "react";
import { PlaybookTier } from "./HeaderNav";

interface CostArchitectureProps {
  currentTier?: PlaybookTier;
}

export function CostArchitecture({ currentTier = "mvp" }: CostArchitectureProps) {
  const tiers = [
    {
      id: "mvp" as const,
      tierDots: "bg-emerald-400",
      label: "MVP tier",
      dau: "0 – 1,000 DAU",
      price: "$5 – $15",
      active: "border-emerald-500/50 bg-[#16211a]",
      badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      items: [
        { label: "Frontend (Vercel / Cloudflare)", cost: "$0" },
        { label: "Compute (VPS 2GB RAM)", cost: "$5 – $10" },
        { label: "Managed PostgreSQL", cost: "$0 free tier" },
        { label: "Transactional email (Resend)", cost: "$0" },
      ],
    },
    {
      id: "prod" as const,
      tierDots: "bg-amber-400",
      label: "Production tier",
      dau: "1,000 – 50,000 DAU",
      price: "$65 – $150",
      active: "border-amber-500/50 bg-[#211d16]",
      badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      items: [
        { label: "Compute (2x 4GB VPS)", cost: "$30 – $40" },
        { label: "Managed DB with backups", cost: "$25 – $45" },
        { label: "In-memory Redis (Upstash)", cost: "$10 – $20" },
        { label: "Storage & CDN (R2 / S3)", cost: "$10 – $25" },
      ],
    },
    {
      id: "ent" as const,
      tierDots: "bg-rose-400",
      label: "Enterprise tier",
      dau: "50,000+ DAU",
      price: "$800 – $2,500+",
      active: "border-rose-500/50 bg-[#211619]",
      badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      items: [
        { label: "Multi-AZ ECS / ALB cluster", cost: "$400 – $800" },
        { label: "Aurora Multi-AZ + replica", cost: "$350 – $700" },
        { label: "Datadog APM & observability", cost: "$150 – $300" },
        { label: "Compliance, WAF & SLA guard", cost: "$500+" },
      ],
    },
  ];

  return (
    <section className="panel-base p-6 md:p-8 space-y-6">
      <div className="border-b border-white/[0.06] pb-5">
        <div className="text-[11px] font-mono text-[var(--text-muted)] mb-1">
          Unit economics
        </div>
        <h3 className="text-xl font-medium text-white tracking-tight">
          Infrastructure costs
        </h3>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Monthly infrastructure brackets from day 1 to 50,000 active users. The active tier is highlighted.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {tiers.map((t) => {
          const isActive = currentTier === t.id;
          return (
            <div
              key={t.id}
              className={`panel-card p-5 space-y-3 transition-colors ${
                isActive ? t.active : "opacity-50 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${t.tierDots}`} />
                  <span className="font-medium text-white text-xs">{t.label}</span>
                  {isActive && (
                    <span className={`px-1.5 py-0.5 border text-[9px] font-mono rounded ${t.badge}`}>
                      Active
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[var(--text-muted)] tabular-nums">{t.dau}</span>
              </div>
              <div className="text-2xl font-medium text-white tabular-nums">
                {t.price} <span className="text-xs font-normal text-[var(--text-muted)]">/ mo</span>
              </div>
              <ul className="text-[var(--text-secondary)] space-y-1.5 text-[11px] pt-1">
                {t.items.map((item) => (
                  <li key={item.label} className="flex justify-between items-baseline gap-2">
                    <span className="truncate">{item.label}</span>
                    <span className="text-slate-300 tabular-nums shrink-0">{item.cost}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
