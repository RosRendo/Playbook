"use client";

import React from "react";
import { PlaybookTier } from "./HeaderNav";

interface HeroBannerProps {
  currentTier: PlaybookTier;
}

export function HeroBanner({ currentTier }: HeroBannerProps) {
  const metaByTier = {
    mvp: {
      tag: "LEVEL 1 EXECUTION",
      speed: "3 to 7 Days",
      stack: "Next.js + Postgres Monolith",
      cost: "$0 – $15 / mo",
      discipline: "Single Vertical Slice • Kill List Active",
    },
    prod: {
      tag: "LEVEL 2 EXECUTION",
      speed: "2 to 4 Weeks",
      stack: "Docker + Nginx + Redis + BullMQ",
      cost: "$50 – $150 / mo",
      discipline: "Async Workers • Error Tracking • CI",
    },
    ent: {
      tag: "LEVEL 3 EXECUTION",
      speed: "Quarterly Audit",
      stack: "Multi-AZ ALB + Read Replicas + SSO",
      cost: "$1,000+ / mo",
      discipline: "SOC2 Compliance • PITR Backups • Canary",
    },
  };

  const current = metaByTier[currentTier];

  return (
    <section className="panel-base p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
            Product Architecture &bull; {current.tag}
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
            Systematic Full-Stack Delivery Protocol
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            From raw concept to production deployment. Clear mental models, explicit stage
            boundaries, copy-verified commands, and zero speculative over-engineering.
          </p>
        </div>

        <div className="font-mono text-xs text-slate-400 bg-[#0d0f13] border border-white/10 px-3 py-2 rounded-md shrink-0">
          <span className="text-slate-500 block text-[10px]">PHILOSOPHY</span>
          <span className="text-slate-200">Measure &rarr; Bottleneck &rarr; Minimal Fix</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="panel-inset p-3.5 space-y-1">
          <span className="text-slate-500 text-[11px] block">DELIVERY TARGET</span>
          <span className="text-white font-medium text-sm block">{current.speed}</span>
        </div>
        <div className="panel-inset p-3.5 space-y-1">
          <span className="text-slate-500 text-[11px] block">TOPOLOGY</span>
          <span className="text-white font-medium text-sm block">{current.stack}</span>
        </div>
        <div className="panel-inset p-3.5 space-y-1">
          <span className="text-slate-500 text-[11px] block">ESTIMATED RUNTIME COST</span>
          <span className="text-white font-medium text-sm block">{current.cost}</span>
        </div>
        <div className="panel-inset p-3.5 space-y-1">
          <span className="text-slate-500 text-[11px] block">GOVERNING RULE</span>
          <span className="text-white font-medium text-sm block">{current.discipline}</span>
        </div>
      </div>
    </section>
  );
}
