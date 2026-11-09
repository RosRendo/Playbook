"use client";

import React, { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";

interface PromptTab {
  id: string;
  label: string;
  title: string;
  code: string;
}

const PROMPTS: PromptTab[] = [
  {
    id: "stage1",
    label: "Product architect",
    title: "Stage 1: Functional Scope & Boundary Prompt",
    code: `Analyze this product concept: [INSERT RAW PRODUCT IDEA]

Generate:
1. Target Customer Profile (who experiences this bottleneck daily?)
2. Core Problem & Unfair Alternative (how is this solved today in spreadsheets/manual tasks?)
3. Single Primary Journey (1 unbroken happy path from sign-in to core value)
4. MVP Scope & The Kill List (5 specific features strictly EXCLUDED from V1)
5. Validation Metric (the single verifiable metric confirming customer demand)

STRICT RULE: Do not generate code, schemas, or tech stack recommendations. Output the functional brief only.`,
  },
  {
    id: "stage2",
    label: "Technical architect",
    title: "Stage 2: Monolith-First Topology & Schema Design",
    code: `Based on the approved Product Brief: [ATTACH BRIEF]

Design:
1. Stack Selection (monolith-first, justified strictly by team size and throughput)
2. Minimal JIT Database Schema (<6 tables, Prisma/Drizzle format with foreign keys and query indexes)
3. API Contracts (REST endpoints, HTTP methods, exact request/response JSON schemas)
4. Session & Auth Strategy (HttpOnly session cookies vs JWT, RBAC roles)
5. Host Architecture (VPS Docker Compose or serverless targets)

STRICT RULE: Prioritize simplicity. Do not include microservices, Kafka, Kubernetes, or caching unless required by confirmed MVP load.`,
  },
  {
    id: "stage3",
    label: "Vertical slice",
    title: "Stage 3: Vertical Slice Implementation Prompt",
    code: `Implement ONLY this single feature slice: [INSERT FEATURE NAME]

Execution Sequence:
1. List all affected files before touching code
2. Define API contract and server-side Zod validation schema
3. Write database migration if schema modifications are required
4. Implement all 7 mandatory UI states:
   - Initial Loading Skeleton
   - Populated Success State
   - Empty State
   - Server-side Error Feedback
   - Client-side Form Validation
   - Mobile Viewport Reflow
   - Unauthorized / Forbidden Guard

STRICT RULE: Do not refactor files outside this feature's explicit scope boundary.`,
  },
  {
    id: "stage4",
    label: "Bug isolation",
    title: "Stage 4: Surgical Bug Fixing Protocol",
    code: `Isolate and resolve this defect: [PASTE ERROR MESSAGE OR STACK TRACE]

Surgical Protocol:
1. Root Cause: State WHY the failure occurred in 2 clear sentences.
2. Minimal Safe Patch: Provide the fix modifying the fewest lines possible (<20 lines changed).
3. Regression Test: Write 1 automated test reproducing the failure condition before applying the fix.

STRICT RULE: Do not re-architect or refactor surrounding services.`,
  },
];

export function PromptMatrix() {
  const [activeTab, setActiveTab] = useState("stage1");
  const [copied, setCopied] = useState(false);

  const current = PROMPTS.find((p) => p.id === activeTab) || PROMPTS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section id="prompt-matrix" className="panel-base p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <div className="text-[11px] font-mono text-[var(--text-muted)] mb-1">
            Agent Prompting Framework
          </div>
          <h3 className="text-xl font-medium text-white tracking-tight">
            Staged Prompt Library
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Prompt coding agents in rigid sequential gates to prevent hallucinations and uncontrolled refactoring.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-white/[0.06] pb-3 font-mono text-xs">
        {PROMPTS.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveTab(p.id)}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === p.id
                ? "bg-[#1d222b] text-white border border-white/10 font-medium"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Code Card */}
      <div className="panel-inset p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <span className="font-mono text-xs font-medium text-slate-200">
            {current.title}
          </span>
          <button
            onClick={handleCopy}
            className="font-mono text-xs px-2.5 py-1 rounded bg-[#181b23] hover:bg-[#20242f] text-[var(--text-secondary)] border border-white/10 flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Prompt</span>
              </>
            )}
          </button>
        </div>
        <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-72 selection:bg-white/20">
          {current.code}
        </pre>
      </div>
    </section>
  );
}
