"use client";

import React from "react";
import { Check, Minus } from "lucide-react";
import { PlaybookTier } from "./HeaderNav";

interface ArchitectureTiersProps {
  currentTier: PlaybookTier;
}

export function ArchitectureTiers({ currentTier }: ArchitectureTiersProps) {
  const tierDirectives = {
    mvp: {
      title: "Level 1 · MVP modular monolith",
      desc: "Single Next.js runtime process, direct PostgreSQL transactions, HttpOnly sessions. No message queues, no read replicas, no microservices.",
      badge: "No speculative additions",
      border: "border-emerald-500/40",
      bg: "bg-emerald-950/20",
      text: "text-emerald-300",
      dot: "bg-emerald-400",
      badgeStyle: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    },
    prod: {
      title: "Level 2 · Decoupled resilience",
      desc: "Nginx reverse proxy with TLS termination, Redis in-memory rate limiting, BullMQ worker queue for async jobs, Sentry telemetry, and automated DB backups.",
      badge: "Measured telemetry scaling",
      border: "border-amber-500/40",
      bg: "bg-amber-950/20",
      text: "text-amber-300",
      dot: "bg-amber-400",
      badgeStyle: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
    ent: {
      title: "Level 3 · Enterprise high availability",
      desc: "Cloudflare Anycast with AWS ALB load balancers, Multi-AZ compute nodes, primary/replica PostgreSQL with point-in-time recovery, SAML 2.0 / SSO, and 99.99% SLA.",
      badge: "No single point of failure",
      border: "border-rose-500/40",
      bg: "bg-rose-950/20",
      text: "text-rose-300",
      dot: "bg-rose-400",
      badgeStyle: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    },
  };

  const directive = tierDirectives[currentTier] || tierDirectives.mvp;

  return (
    <section className="panel-base p-6 md:p-8 space-y-6">
      <div className="border-b border-white/[0.06] pb-5">
        <div className="text-[11px] font-mono text-[var(--text-muted)] mb-1">
          Topology visualizer
        </div>
        <h3 className="text-xl font-medium text-white tracking-tight">
          Architecture tiers
        </h3>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Match the architecture to measured load and risk. Complexity must be earned, never assumed.
        </p>
      </div>

      {/* Active directive */}
      <div className={`panel-inset p-3.5 border ${directive.border} ${directive.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${directive.dot} shrink-0`} />
          <div className="min-w-0">
            <div className={`font-mono text-xs font-medium ${directive.text}`}>
              {directive.title}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
              {directive.desc}
            </div>
          </div>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${directive.badgeStyle} w-fit shrink-0`}>
          {directive.badge}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Tier 1 */}
        <div
          className={`panel-card p-5 space-y-4 transition-colors ${
            currentTier === "mvp"
              ? "border-emerald-500/50 bg-[#16211a]"
              : "opacity-50 hover:opacity-100"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-mono text-xs font-medium text-white">Level 1 · MVP</span>
                {currentTier === "mvp" && (
                  <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono rounded">
                    Active
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">Modular monolith</span>
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)] tabular-nums">$0 – $15/mo</span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Minimal surface area. Single deployment pipeline with direct database transactions.
          </p>

          <div className="panel-inset p-3 font-mono text-xs text-center space-y-1.5 text-slate-300">
            <div className="py-1 px-2 rounded bg-white/[0.04] border border-white/[0.06]">
              Client &amp; server (Next.js app)
            </div>
            <div className="text-[var(--text-muted)] text-[10px]">&darr; direct Prisma client</div>
            <div className="py-1 px-2 rounded bg-white/[0.04] border border-white/[0.06]">
              PostgreSQL (single container)
            </div>
          </div>

          <ul className="text-xs space-y-2 text-[var(--text-secondary)]">
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={2} />
              <span>Single runtime process / serverless actions</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={2} />
              <span>HttpOnly session cookie authorization</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={2} />
              <span>Direct database queries without caching</span>
            </li>
            <li className="flex items-center gap-2 text-[var(--text-muted)]">
              <Minus className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
              <span>No message queues or read replicas</span>
            </li>
          </ul>
        </div>

        {/* Tier 2 */}
        <div
          className={`panel-card p-5 space-y-4 transition-colors ${
            currentTier === "prod"
              ? "border-amber-500/50 bg-[#211d16]"
              : "opacity-50 hover:opacity-100"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="font-mono text-xs font-medium text-white">Level 2 · Production</span>
                {currentTier === "prod" && (
                  <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-mono rounded">
                    Active
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">Decoupled resilience</span>
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)] tabular-nums">$50 – $150/mo</span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Asynchronous background workers, error telemetry, and in-memory rate limiting.
          </p>

          <div className="panel-inset p-3 font-mono text-xs text-center space-y-1.5 text-slate-300">
            <div className="py-1 px-2 rounded bg-white/[0.04] border border-white/[0.06]">
              Nginx gateway (TLS + reverse proxy)
            </div>
            <div className="text-[var(--text-muted)] text-[10px]">&darr; forward :3000</div>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <div className="py-1 px-1.5 rounded bg-white/[0.04] border border-white/[0.06] text-[11px]">
                PostgreSQL
              </div>
              <div className="py-1 px-1.5 rounded bg-white/[0.04] border border-white/[0.06] text-[11px]">
                Redis + BullMQ
              </div>
            </div>
          </div>

          <ul className="text-xs space-y-2 text-[var(--text-secondary)]">
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={2} />
              <span>Redis caching and session rate limiting</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={2} />
              <span>BullMQ queue for async email &amp; webhooks</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={2} />
              <span>S3/R2 presigned object storage uploads</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={2} />
              <span>Container health checks &amp; Sentry</span>
            </li>
          </ul>
        </div>

        {/* Tier 3 */}
        <div
          className={`panel-card p-5 space-y-4 transition-colors ${
            currentTier === "ent"
              ? "border-rose-500/50 bg-[#211619]"
              : "opacity-50 hover:opacity-100"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="font-mono text-xs font-medium text-white">Level 3 · Enterprise</span>
                {currentTier === "ent" && (
                  <span className="px-1.5 py-0.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[9px] font-mono rounded">
                    Active
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">High availability</span>
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)] tabular-nums">$1,000+/mo</span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            No single point of failure. Multi-AZ compute, read replicas, and compliance audits.
          </p>

          <div className="panel-inset p-3 font-mono text-xs text-center space-y-1.5 text-slate-300">
            <div className="py-1 px-2 rounded bg-white/[0.04] border border-white/[0.06] text-[11px]">
              Cloudflare Anycast + AWS ALB
            </div>
            <div className="text-[var(--text-muted)] text-[10px]">&darr; round-robin cluster</div>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <div className="py-1 px-1.5 rounded bg-white/[0.04] border border-white/[0.06] text-[10px]">
                Primary (write)
              </div>
              <div className="py-1 px-1.5 rounded bg-white/[0.04] border border-white/[0.06] text-[10px]">
                Replica (read)
              </div>
            </div>
          </div>

          <ul className="text-xs space-y-2 text-[var(--text-secondary)]">
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" strokeWidth={2} />
              <span>SAML 2.0 / SSO &amp; granular RBAC</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" strokeWidth={2} />
              <span>Immutable audit logs &amp; row level security</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" strokeWidth={2} />
              <span>Blue-green deployment with rollback</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" strokeWidth={2} />
              <span>Continuous backup with PITR</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
