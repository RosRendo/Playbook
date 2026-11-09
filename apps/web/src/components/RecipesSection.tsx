"use client";

import React from "react";
import { Server, CreditCard } from "lucide-react";

export function RecipesSection() {
  return (
    <section id="recipes" className="panel-base p-6 md:p-8 space-y-6">
      <div className="border-b border-white/[0.06] pb-5">
        <div className="text-[11px] font-mono text-[var(--text-muted)] mb-1">
          Operational Runbooks
        </div>
        <h3 className="text-xl font-medium text-white tracking-tight">
          Production Deployment Runbooks
        </h3>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Deterministic execution procedures for infrastructure deployment and payment webhook verification.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
        {/* Runbook 1 */}
        <div className="panel-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <span className="font-semibold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-400" />
              <span>Ubuntu Host &bull; Docker &bull; Nginx &bull; TLS</span>
            </span>
            <span className="keycap">01</span>
          </div>

          <ol className="text-slate-400 space-y-2 list-decimal list-inside leading-relaxed">
            <li>
              Install Docker Engine: <code className="text-slate-200">curl -fsSL https://get.docker.com | sh</code>
            </li>
            <li>Clone repository into <code className="text-slate-300">/var/www/app</code></li>
            <li>Define production environment variables in <code className="text-slate-300">.env.production</code></li>
            <li>Launch stack: <code className="text-slate-200">docker compose up -d --build</code></li>
            <li>Automate TLS renewal: <code className="text-slate-200">sudo certbot --nginx -d yourdomain.com</code></li>
          </ol>
        </div>

        {/* Runbook 2 */}
        <div className="panel-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <span className="font-semibold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span>Payment Webhook Idempotency &bull; Stripe / KHQR</span>
            </span>
            <span className="keycap">02</span>
          </div>

          <ol className="text-slate-400 space-y-2 list-decimal list-inside leading-relaxed">
            <li>Preserve raw request buffer before JSON middleware parsing for HMAC validation</li>
            <li>Verify signature header: <code className="text-slate-200">stripe.webhooks.constructEvent(...)</code></li>
            <li>Check database idempotency table for event ID before processing</li>
            <li>If event ID already recorded, immediately return HTTP 200 to acknowledge delivery</li>
            <li>Execute account state mutation and insert event ID within single database transaction</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
