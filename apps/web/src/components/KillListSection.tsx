"use client";

import React from "react";
import { Ban } from "lucide-react";

export function KillListSection() {
  const killedFeatures = [
    {
      feature: "Native Mobile App",
      rationale: "Responsive web meets 99% of early customer needs without App Store review delays.",
    },
    {
      feature: "Microservices / Kubernetes",
      rationale: "Introduces distributed latency and network failure modes before single-host CPU saturates.",
    },
    {
      feature: "Predictive AI Recommendations",
      rationale: "Requires substantial user data volume to be statistically meaningful.",
    },
    {
      feature: "Multi-Tenant Custom Domains",
      rationale: "Requires complex dynamic TLS proxy infrastructure (Caddy / Cloudflare for SaaS).",
    },
    {
      feature: "Multi-Currency Dynamic Conversion",
      rationale: "Introduces foreign exchange reconciliation overhead before validating single-currency pricing.",
    },
    {
      feature: "Granular Team Role Matrices",
      rationale: "Simple Owner / Member permissions suffice for initial company accounts.",
    },
  ];

  return (
    <section id="kill-list" className="panel-base p-6 md:p-8 space-y-6">
      <div className="border-b border-white/[0.06] pb-5">
        <div className="text-[11px] font-mono text-[var(--text-muted)] mb-1">
          Scope Discipline
        </div>
        <h3 className="text-xl font-medium text-white tracking-tight">
          Kill list
        </h3>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Features strictly prohibited prior to product-market validation and initial paying customers.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 font-mono text-xs">
        {killedFeatures.map((item, idx) => (
          <div
            key={idx}
            className="panel-card p-4 space-y-2 border-l-2 border-l-rose-500/40"
          >
            <div className="font-semibold text-white text-xs">
              {item.feature}
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {item.rationale}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
