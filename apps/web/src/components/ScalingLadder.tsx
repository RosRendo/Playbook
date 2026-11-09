"use client";

import React from "react";

interface ScaleLevel {
  level: number;
  name: string;
  trigger: string;
  action: string;
  capacity: string;
}

const SCALE_LEVELS: ScaleLevel[] = [
  {
    level: 1,
    name: "Single Host Monolith",
    trigger: "Initial launch up to early traction",
    action: "Co-locate application and database on single VPS instance.",
    capacity: "0 to 1,000 DAU ($5–$15/mo)",
  },
  {
    level: 2,
    name: "SQL Indexes & Connection Pool",
    trigger: "PostgreSQL query latency exceeding 100ms",
    action: "Run EXPLAIN ANALYZE, apply targeted composite indexes, deploy PgBouncer.",
    capacity: "1,000 to 10,000 DAU",
  },
  {
    level: 3,
    name: "Edge CDN & In-Memory Cache",
    trigger: "Repetitive static reads and read-heavy dashboard loads",
    action: "Configure Cloudflare edge cache rules and Redis for session cache.",
    capacity: "10,000 to 50,000 DAU",
  },
  {
    level: 4,
    name: "Async Queue & Background Workers",
    trigger: "Synchronous HTTP handlers delayed by emails, PDFs, or webhooks",
    action: "Enqueue jobs to BullMQ; return HTTP 202 Accepted immediately.",
    capacity: "50,000 to 100,000 DAU",
  },
  {
    level: 5,
    name: "Multi-Instance Compute Behind Load Balancer",
    trigger: "Single host CPU saturation (>75% sustained)",
    action: "Containerize app instances behind Nginx upstream or AWS ALB.",
    capacity: "100,000 to 500,000 DAU",
  },
  {
    level: 6,
    name: "Database Read Replicas",
    trigger: "Database read IOPS saturating write transactions",
    action: "Split database queries: writes to Primary, reads to Replica.",
    capacity: "500,000+ DAU",
  },
];

export function ScalingLadder() {
  return (
    <section id="scaling-ladder" className="panel-base p-6 md:p-8 space-y-6">
      <div className="border-b border-white/[0.06] pb-5">
        <div className="text-[11px] font-mono text-[var(--text-muted)] mb-1">
          Scaling Progression
        </div>
        <h3 className="text-xl font-medium text-white tracking-tight">
          System Scaling Ladder
        </h3>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Scale strictly based on measured telemetry bottlenecks, not hypothetical future load.
        </p>
      </div>

      <div className="space-y-2 font-mono text-xs">
        {SCALE_LEVELS.map((item) => (
          <div
            key={item.level}
            className="panel-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
          >
            <div className="flex items-start md:items-center gap-3">
              <span className="keycap shrink-0">
                {item.level}
              </span>
              <div>
                <div className="font-semibold text-white text-xs">{item.name}</div>
                <div className="text-slate-500 text-[11px]">
                  Trigger: {item.trigger}
                </div>
              </div>
            </div>

            <div className="text-left md:text-right space-y-0.5">
              <div className="text-slate-300 text-xs">{item.action}</div>
              <div className="text-slate-500 text-[10px]">{item.capacity}</div>
            </div>
          </div>
        ))}

        <div className="panel-inset p-3.5 text-xs text-slate-500 flex items-center justify-between">
          <span>Levels 7 &ndash; 8 (Database Partitioning &amp; Multi-Region) reserved for enterprise high-availability contracts.</span>
          <span className="font-mono text-[10px] text-slate-400">Enterprise Tier</span>
        </div>
      </div>
    </section>
  );
}
