"use client";

import React, { useState } from "react";
import { Check, AlertCircle, Ban } from "lucide-react";
import { PlaybookTier } from "./HeaderNav";

interface PhaseData {
  doNow: string;
  doDesc: string;
  badge: string;
  blocker: string;
  blockerDesc: string;
  blockerBadge: string;
  kills: string[];
}

const PHASES: Record<string, PhaseData> = {
  discovery: {
    doNow: "Define Single Core Pain & Primary Journey",
    doDesc:
      "Interview potential users or document the exact manual workflow being replaced. Validate why a customer will pay on Day 1.",
    badge: "Scope: Problem validation only",
    blocker: "Unvalidated customer pain",
    blockerDesc: "Do not write code until the target user and single value proposition fit in 2 plain sentences.",
    blockerBadge: "Gate: 1-sentence value statement",
    kills: [
      "Selecting secondary database engines",
      "Drafting frontend component libraries",
      "Designing brand logos or custom themes",
    ],
  },
  prompting: {
    doNow: "Execute Stage 1 Product Architect AI Prompt",
    doDesc:
      "Constrain the coding agent strictly to functional boundaries, user journeys, and the explicit 5-feature kill list.",
    badge: "Scope: Architecture boundaries",
    blocker: "Undefined problem parameters",
    blockerDesc: "The agent requires rigid problem inputs before generating technical blueprints.",
    blockerBadge: "Gate: Approved problem brief",
    kills: [
      "Requesting full application generation in one prompt",
      "Permitting microservices or distributed queues in MVP specs",
    ],
  },
  prd: {
    doNow: "Formalize Scope & Lock Kill List",
    doDesc:
      "Explicitly document features deferred to subsequent versions. Draft acceptance criteria for the primary user flow.",
    badge: "Scope: Anti-scope-creep enforcement",
    blocker: "Feature backlog expansion",
    blockerDesc: "Eliminate 50% of drafted features until only the non-negotiable core transaction remains.",
    blockerBadge: "Gate: Trimmed backlog",
    kills: [
      "Native mobile app development (use responsive web)",
      "Dark/light theme switchers",
      "Multi-tier referral or affiliate logic",
    ],
  },
  schema: {
    doNow: "Draft Minimal JIT Database Schema (<6 Tables)",
    doDesc:
      "Define User, Project/Entity, and Payment tables. Apply foreign keys, query indexes, and run migrations locally.",
    badge: "Scope: JIT schema discipline",
    blocker: "Unsettled entity relationships",
    blockerDesc: "Never write migrations before confirming exact query patterns and relationship cardinalities.",
    blockerBadge: "Gate: Entity cardinality review",
    kills: [
      "Speculative audit log tables",
      "Premature tenant database partitioning",
    ],
  },
  backend: {
    doNow: "Construct Primary Mutation Vertical Slice",
    doDesc:
      "Implement the core API endpoint or Server Action. Apply Zod input validation, session authorization, and atomic DB transaction.",
    badge: "Scope: 1 Contract, 1 Transaction",
    blocker: "Pending database migration",
    blockerDesc: "Ensure schema migrations execute without error and local seed records exist.",
    blockerBadge: "Gate: Verified DB state",
    kills: [
      "Empty abstraction layers or empty services",
      "GraphQL configuration when REST/Actions suffice",
    ],
  },
  frontend: {
    doNow: "Implement 7 Mandatory UI States",
    doDesc:
      "Connect client view to the API mutation. Handle Loading, Error, Empty, Success feedback, and responsive layout.",
    badge: "Scope: 1 Screen, 7 UI States",
    blocker: "Incomplete API contract",
    blockerDesc: "Confirm the exact JSON response and error shapes before constructing view components.",
    blockerBadge: "Gate: Locked API schema",
    kills: [
      "Multi-day color palette adjustments",
      "Building unreachable secondary sub-pages",
    ],
  },
  networking: {
    doNow: "Configure Nginx Reverse Proxy & Firewall (UFW)",
    doDesc:
      "Map domain A-record to server IP. Allow ports 80/443 on UFW. Route requests to internal Docker container on :3000.",
    badge: "Scope: Port binding & TLS",
    blocker: "Unverified local container response",
    blockerDesc: "Verify the application responds to 'curl localhost:3000' before configuring proxy pass.",
    blockerBadge: "Gate: Local port health",
    kills: ["Exposing Postgres port 5432 or Redis 6379 to public internet"],
  },
  deployment: {
    doNow: "Issue Let's Encrypt SSL & Verify Webhook Handlers",
    doDesc:
      "Execute Certbot automated TLS renewal. Configure Docker Compose restart policies or GitHub Actions deployment hook.",
    badge: "Scope: Production launch gate",
    blocker: "Pending DNS propagation",
    blockerDesc: "Certbot challenge validation fails if global DNS does not resolve to the host IP.",
    blockerBadge: "Gate: DNS verified",
    kills: ["Configuring multi-stage canary pipelines for early MVP traffic"],
  },
  scaling: {
    doNow: "Analyze Query Telemetry & Introduce Redis",
    doDesc:
      "Inspect slow query logs (>100ms) and add targeted compound indexes. Offload asynchronous tasks to BullMQ workers.",
    badge: "Scope: Evidence-based tuning",
    blocker: "Absence of telemetry data",
    blockerDesc: "Never introduce caching layers without confirmed p95 latency bottlenecks.",
    blockerBadge: "Gate: Production metrics",
    kills: [
      "Rewriting codebase in alternate languages",
      "Premature microservice decomposition",
    ],
  },
};

interface DecisionEngineProps {
  currentTier?: PlaybookTier;
}

export function DecisionEngine({ currentTier = "mvp" }: DecisionEngineProps) {
  const [selectedPhase, setSelectedPhase] = useState("frontend");
  const current = PHASES[selectedPhase];

  const tierDirectives = {
    mvp: {
      title: "Level 1 · MVP modular monolith",
      desc: "Strict single-process monolith. 1 vertical slice. No message queues, no read replicas, no microservices.",
      badge: "No speculative additions",
      border: "border-emerald-500/40",
      bg: "bg-emerald-950/20",
      text: "text-emerald-300",
      dot: "bg-emerald-400",
      badgeStyle: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    },
    prod: {
      title: "Level 2 · Decoupled resilience",
      desc: "Asynchronous BullMQ worker queues, in-memory Redis cache, UFW firewall, Sentry telemetry, and Vitest test suites.",
      badge: "Measured telemetry scaling",
      border: "border-amber-500/40",
      bg: "bg-amber-950/20",
      text: "text-amber-300",
      dot: "bg-amber-400",
      badgeStyle: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
    ent: {
      title: "Level 3 · Enterprise high availability",
      desc: "Multi-AZ application load balancers, PostgreSQL read/write replicas, immutable audit logs, SSO/SAML, and 99.99% uptime.",
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <div className="text-[11px] font-mono text-[var(--text-muted)] mb-1">
            Decision engine
          </div>
          <h3 className="text-xl font-medium text-white tracking-tight">
            Stage-gate execution
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Select the current phase to view mandatory tasks, blockers and restricted scope.
          </p>
        </div>

        {/* Phase select */}
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="phase-select" className="text-xs font-mono text-[var(--text-muted)]">
            Phase
          </label>
          <select
            id="phase-select"
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            className="bg-[var(--surface-inset)] text-xs font-mono text-white px-3 py-1.5 rounded-md border border-white/10 focus:outline-none focus:border-[var(--accent-border)] cursor-pointer"
          >
            <option value="discovery">Discovery &amp; validation</option>
            <option value="prompting">Concept prompting</option>
            <option value="prd">Scope &amp; PRD lite</option>
            <option value="schema">JIT database schema</option>
            <option value="backend">Backend vertical slice</option>
            <option value="frontend">Frontend UI states</option>
            <option value="networking">Server, Docker &amp; nginx</option>
            <option value="deployment">TLS &amp; webhook deployment</option>
            <option value="scaling">Telemetry &amp; scale ladder</option>
          </select>
        </div>
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

      {/* Phase cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="panel-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
            <Check className="w-3.5 h-3.5 text-[var(--accent)]" strokeWidth={2} />
            <span>Current objective</span>
          </div>
          <h4 className="text-sm font-medium text-white">{current.doNow}</h4>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{current.doDesc}</p>
          <div className="pt-1">
            <span className="inline-block px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[var(--text-secondary)] text-[11px] font-mono">
              {current.badge}
            </span>
          </div>
        </div>

        <div className="panel-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400/90" strokeWidth={1.5} />
            <span>Blocking prerequisite</span>
          </div>
          <h4 className="text-sm font-medium text-white">{current.blocker}</h4>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{current.blockerDesc}</p>
          <div className="pt-1">
            <span className="inline-block px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[var(--text-secondary)] text-[11px] font-mono">
              {current.blockerBadge}
            </span>
          </div>
        </div>

        <div className="panel-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
            <Ban className="w-3.5 h-3.5 text-rose-400/90" strokeWidth={1.5} />
            <span>Restricted scope</span>
          </div>
          <ul className="text-xs text-[var(--text-secondary)] space-y-1.5">
            {current.kills.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-400/70 mt-0.5 shrink-0">&times;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="text-[10px] text-[var(--text-muted)] font-mono pt-1">
            Enforced to prevent premature abstraction
          </div>
        </div>
      </div>
    </section>
  );
}
