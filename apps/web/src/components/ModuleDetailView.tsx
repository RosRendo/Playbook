"use client";

import React, { useState } from "react";
import { PlaybookTopic } from "@/data/playbookModules";
import { TECH_STACK_DETAILS, TechStackDetail } from "@/data/techStackDetails";
import { TechIcon } from "./TechIcon";
import { PlaybookTier } from "./HeaderNav";
import {
  Copy,
  Check,
  Terminal,
  BookOpen,
  ListOrdered,
  Layers,
  AlertTriangle,
  X,
  ChevronRight,
} from "lucide-react";

interface ModuleDetailViewProps {
  topic: PlaybookTopic;
  currentTier?: PlaybookTier;
  onNext?: () => void;
  onPrev?: () => void;
  onOpenTechStack?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

type ModuleTab = "concept" | "prompt" | "setup" | "commands" | "tiers" | "triage";

export function ModuleDetailView({
  topic,
  currentTier = "mvp",
  onNext,
  onPrev,
  onOpenTechStack,
  isFirst,
  isLast,
}: ModuleDetailViewProps) {
  const [activeTab, setActiveTab] = useState<ModuleTab>("concept");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [inspectedTechKey, setInspectedTechKey] = useState<string | null>(null);
  const [copiedTechCode, setCopiedTechCode] = useState(false);

  const inspectedTech: TechStackDetail | undefined = inspectedTechKey
    ? TECH_STACK_DETAILS[inspectedTechKey]
    : undefined;

  const handleCopyTechCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedTechCode(true);
      setTimeout(() => setCopiedTechCode(false), 2000);
    });
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(topic.aiPrompt.prompt).then(() => {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    });
  };

  const handleCopyCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopiedCmd(cmd);
      setTimeout(() => setCopiedCmd(null), 2000);
    });
  };

  return (
    <div className="space-y-4">
      {/* Module Header Bar */}
      <div className="panel-base p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 border-b border-white/[0.06] pb-3 font-mono text-[11px] text-[var(--text-muted)]">
          <span className="keycap keycap-active">{topic.number}</span>
          <span className="truncate">{topic.category}</span>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-medium text-white tracking-tight">
            {topic.title}
          </h2>
          <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">
            {topic.summary}
          </p>
        </div>

        {/* Tech stack row */}
        {topic.techStack && topic.techStack.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {topic.techStack.map((tech, idx) => {
              const isActive = inspectedTechKey === tech.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    setInspectedTechKey(isActive ? null : tech.icon)
                  }
                  className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs font-mono transition-colors ${
                    isActive
                      ? "bg-[var(--surface-active)] border border-white/20 text-white"
                      : "bg-[var(--surface-card)] border border-white/[0.08] text-[var(--text-secondary)] hover:border-white/20 hover:text-white"
                  }`}
                  title="Inspect setup, commands and rules"
                >
                  <TechIcon name={tech.icon} className="w-3.5 h-3.5 shrink-0" />
                  <span>{tech.name}</span>
                </button>
              );
            })}
            <span className="text-[10px] font-mono text-[var(--text-muted)] ml-1 hidden md:inline">
              click to inspect
            </span>

            {/* Inline tech inspector panel */}
            {inspectedTech && (
              <div className="panel-card p-4 space-y-4 border-white/15 bg-[#141720]">
                <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-[var(--surface-inset)] border border-white/10 flex items-center justify-center shrink-0">
                      <TechIcon name={inspectedTech.id} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white text-sm">
                          {inspectedTech.name}
                        </span>
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                            inspectedTech.tier === "mvp"
                              ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                              : inspectedTech.tier === "prod"
                              ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                              : "text-rose-400 border-rose-500/30 bg-rose-500/10"
                          }`}
                        >
                          {inspectedTech.tier} tier
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)] hidden sm:inline">
                          {inspectedTech.category}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                        {inspectedTech.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onOpenTechStack && (
                      <button
                        onClick={onOpenTechStack}
                        className="text-[11px] font-mono text-[var(--text-secondary)] hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <span>All stacks</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setInspectedTechKey(null)}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Concept */}
                <div className="panel-inset p-3 space-y-1">
                  <span className="text-[11px] font-mono text-[var(--text-muted)] block">
                    How it works
                  </span>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-xs">
                    {inspectedTech.concept}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Left: setup */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-mono text-[var(--text-muted)] block">
                        Setup
                      </span>
                      <ol className="space-y-1.5 list-decimal list-inside text-[var(--text-secondary)] text-xs">
                        {inspectedTech.stepByStep.map((step, sIdx) => (
                          <li key={sIdx} className="leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-[var(--text-muted)]">
                          Snippet &middot; {inspectedTech.quickSetup.language}
                        </span>
                        <button
                          onClick={() =>
                            handleCopyTechCode(inspectedTech.quickSetup.code)
                          }
                          className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-white transition-colors"
                        >
                          {copiedTechCode ? (
                            <Check className="w-3 h-3 text-[var(--accent)]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedTechCode ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <pre className="panel-inset p-2.5 font-mono text-[11px] text-slate-200 overflow-x-auto whitespace-pre leading-relaxed">
                        <code>{inspectedTech.quickSetup.code}</code>
                      </pre>
                    </div>
                  </div>

                  {/* Right: commands, rules, pitfall */}
                  <div className="space-y-3">
                    {inspectedTech.commands && inspectedTech.commands.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-mono text-[var(--text-muted)] block">
                          Commands
                        </span>
                        <div className="space-y-1.5">
                          {inspectedTech.commands.map((cmdItem, cIdx) => (
                            <div
                              key={cIdx}
                              className="p-2 rounded bg-[var(--bg-canvas)] border border-white/[0.06] space-y-1 font-mono text-[11px]"
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded border ${
                                    cmdItem.level === "read"
                                      ? "text-emerald-400 border-emerald-500/30"
                                      : cmdItem.level === "write"
                                      ? "text-amber-400 border-amber-500/30"
                                      : "text-rose-400 border-rose-500/30"
                                  }`}
                                >
                                  {cmdItem.level}
                                </span>
                                <button
                                  onClick={() => handleCopyCmd(cmdItem.cmd)}
                                  className="text-[var(--text-muted)] hover:text-white transition-colors text-[10px]"
                                >
                                  {copiedCmd === cmdItem.cmd ? "Copied" : "Copy"}
                                </button>
                              </div>
                              <code className="text-slate-200 block truncate">
                                {cmdItem.cmd}
                              </code>
                              <div className="text-[10px] text-[var(--text-muted)] truncate">
                                {cmdItem.desc}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5 border-t border-white/[0.06] pt-2">
                      <span className="text-[11px] font-mono text-[var(--text-muted)] block">
                        Rules
                      </span>
                      <ul className="space-y-1 text-[var(--text-secondary)] text-xs">
                        {inspectedTech.productionRules.slice(0, 2).map((rule, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-1.5">
                            <Check className="w-3 h-3 text-[var(--accent)] shrink-0 mt-0.5" strokeWidth={2} />
                            <span className="leading-snug">{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1 border-t border-white/[0.06] pt-2">
                      <span className="text-[11px] font-mono text-rose-400/90 block">
                        Pitfall
                      </span>
                      <p className="text-[var(--text-secondary)] text-xs leading-snug">
                        {inspectedTech.pitfalls[0]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Module sub-tabs */}
        <div className="flex flex-wrap gap-1 pt-3 border-t border-white/[0.06] font-mono text-xs">
          {(
            [
              { id: "concept", label: "Concept", icon: BookOpen },
              { id: "prompt", label: "AI prompt", icon: Terminal },
              { id: "setup", label: "Setup", icon: ListOrdered },
              { id: "commands", label: "Commands", icon: Terminal },
              { id: "tiers", label: "Tiers", icon: Layers },
              { id: "triage", label: "Triage", icon: AlertTriangle },
            ] as { id: ModuleTab; label: string; icon: React.ElementType }[]
          ).map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={isActive}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  isActive
                    ? "bg-[var(--surface-active)] text-white border border-white/10"
                    : "text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: CONCEPT & MENTAL MODEL */}
      {activeTab === "concept" && (
        <div className="space-y-4">
          {/* Active tier directive */}
          <div
            className={`panel-inset p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              currentTier === "mvp"
                ? "border-emerald-500/40 bg-emerald-950/20"
                : currentTier === "prod"
                ? "border-amber-500/40 bg-amber-950/20"
                : "border-rose-500/40 bg-rose-950/20"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  currentTier === "mvp"
                    ? "bg-emerald-400"
                    : currentTier === "prod"
                    ? "bg-amber-400"
                    : "bg-rose-400"
                }`}
              />
              <div className="min-w-0">
                <span
                  className={`font-mono text-xs font-medium ${
                    currentTier === "mvp"
                      ? "text-emerald-300"
                      : currentTier === "prod"
                      ? "text-amber-300"
                      : "text-rose-300"
                  }`}
                >
                  {currentTier === "mvp"
                    ? "Level 1 · MVP modular monolith"
                    : currentTier === "prod"
                    ? "Level 2 · Decoupled resilience"
                    : "Level 3 · Enterprise high availability"}
                </span>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {currentTier === "mvp"
                    ? topic.mvpVersion
                    : currentTier === "prod"
                    ? topic.prodVersion
                    : topic.enterpriseVersion}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {(
              [
                { title: "What it is", body: topic.what },
                { title: "Why you need it", body: topic.why },
                { title: "When to use it", body: topic.when },
              ] as const
            ).map((card) => (
              <div key={card.title} className="panel-card p-5 space-y-2">
                <h3 className="text-[13px] font-medium text-slate-200">
                  {card.title}
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
                  {card.body}
                </p>
              </div>
            ))}

            <div className="panel-card p-5 space-y-2">
              <h3 className="text-[13px] font-medium text-slate-200">
                How it connects
              </h3>
              <div className="panel-inset p-3 font-mono text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                {topic.howConnect}
              </div>
            </div>
          </div>

          {topic.decisionRule && (
            <div className="panel-card p-4 space-y-1.5 border-l-2 border-l-[var(--accent)] bg-[var(--accent-dim)]">
              <div className="font-mono text-[11px] text-[var(--text-muted)]">
                Decision rule
              </div>
              <p className="text-xs text-slate-200 font-mono leading-relaxed">
                {topic.decisionRule}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI PROMPT */}
      {activeTab === "prompt" && (
        <div className="panel-base p-6 space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
            <div>
              <div className="text-[11px] text-[var(--text-muted)] mb-0.5">
                Agent specification
              </div>
              <h3 className="text-base font-medium text-white tracking-tight">
                {topic.aiPrompt.title}
              </h3>
            </div>

            <button
              onClick={handleCopyPrompt}
              className="px-3 py-1.5 rounded-md bg-[var(--surface-active)] hover:bg-[var(--surface-hover)] text-white border border-white/10 flex items-center gap-1.5 transition-colors w-fit"
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy prompt</span>
                </>
              )}
            </button>
          </div>

          <div className="panel-inset p-4 space-y-2">
            <span className="text-[11px] text-[var(--text-muted)] block">
              Paste into your coding agent
            </span>
            <pre className="text-slate-300 text-xs whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-96 selection:bg-white/20">
              {topic.aiPrompt.prompt}
            </pre>
          </div>

          <div className="text-[11px] text-[var(--text-secondary)] bg-white/[0.03] p-3 rounded-md border border-white/[0.06] leading-relaxed">
            <span className="text-slate-200 block mb-0.5">Usage</span>
            {topic.aiPrompt.notes}
          </div>
        </div>
      )}

      {/* TAB 3: SETUP */}
      {activeTab === "setup" && (
        <div className="panel-base p-6 space-y-4 font-mono text-xs">
          <div className="border-b border-white/[0.06] pb-3">
            <div className="text-[11px] text-[var(--text-muted)] mb-0.5">
              Runbook
            </div>
            <h3 className="text-base font-medium text-white tracking-tight">
              Setup sequence
            </h3>
          </div>

          <div className="space-y-3">
            {topic.setupSteps.map((step, idx) => (
              <div
                key={idx}
                className="panel-card p-4 flex items-start gap-3"
              >
                <span className="keycap mt-0.5">{idx + 1}</span>
                <p className="text-[var(--text-secondary)] leading-relaxed text-xs pt-0.5">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: COMMANDS */}
      {activeTab === "commands" && (
        <div className="panel-base p-6 space-y-4 font-mono text-xs">
          <div className="border-b border-white/[0.06] pb-3">
            <div className="text-[11px] text-[var(--text-muted)] mb-0.5">
              Terminal reference
            </div>
            <h3 className="text-base font-medium text-white tracking-tight">
              Commands by blast radius
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {topic.commands.map((cmdItem, idx) => {
              const badgeClass =
                cmdItem.level === "read"
                  ? "text-emerald-400 border-emerald-500/30"
                  : cmdItem.level === "write"
                  ? "text-amber-400 border-amber-500/30"
                  : "text-rose-400 border-rose-500/30";

              return (
                <div key={idx} className="panel-card p-4 space-y-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded border text-[10px] ${badgeClass}`}>
                        {cmdItem.level}
                      </span>
                      <button
                        onClick={() => handleCopyCmd(cmdItem.cmd)}
                        className="text-[var(--text-muted)] hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                      >
                        {copiedCmd === cmdItem.cmd ? (
                          <Check className="w-3 h-3 text-[var(--accent)]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedCmd === cmdItem.cmd ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <code className="block bg-[var(--bg-canvas)] p-2.5 rounded border border-white/[0.06] text-slate-200 text-xs overflow-x-auto">
                      {cmdItem.cmd}
                    </code>
                  </div>
                  <p className="text-[var(--text-muted)] text-[11px] pt-1 leading-relaxed">
                    {cmdItem.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: TIERS */}
      {activeTab === "tiers" && (
        <div className="panel-base p-6 space-y-4 font-mono text-xs">
          <div className="border-b border-white/[0.06] pb-3">
            <div className="text-[11px] text-[var(--text-muted)] mb-0.5">
              Scale progression
            </div>
            <h3 className="text-base font-medium text-white tracking-tight">
              Tiers &middot; {topic.title}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(
              [
                {
                  tier: "mvp" as const,
                  label: "MVP tier",
                  body: topic.mvpVersion,
                  note: "Monolith first",
                  activeBorder: "border-emerald-500/50 bg-[#16211a]",
                  activeBadge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
                  dot: "bg-emerald-400",
                },
                {
                  tier: "prod" as const,
                  label: "Production tier",
                  body: topic.prodVersion,
                  note: "Background jobs · cache",
                  activeBorder: "border-amber-500/50 bg-[#211d16]",
                  activeBadge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
                  dot: "bg-amber-400",
                },
                {
                  tier: "ent" as const,
                  label: "Enterprise tier",
                  body: topic.enterpriseVersion,
                  note: "High availability · multi-AZ",
                  activeBorder: "border-rose-500/50 bg-[#211619]",
                  activeBadge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
                  dot: "bg-rose-400",
                },
              ]
            ).map((t) => {
              const isActive = currentTier === t.tier;
              return (
                <div
                  key={t.tier}
                  className={`panel-card p-5 space-y-3 transition-colors ${
                    isActive ? t.activeBorder : "opacity-50 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <div className="flex items-center gap-2 font-medium text-white text-xs">
                      <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                      <span>{t.label}</span>
                    </div>
                    {isActive && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${t.activeBadge}`}
                      >
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                    {t.body}
                  </p>
                  <div className="text-[10px] text-[var(--text-muted)] pt-1">
                    {t.note}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: TRIAGE */}
      {activeTab === "triage" && (
        <div className="panel-base p-6 space-y-5 font-mono text-xs">
          <div className="border-b border-white/[0.06] pb-3">
            <div className="text-[11px] text-[var(--text-muted)] mb-0.5">
              Fault isolation
            </div>
            <h3 className="text-base font-medium text-white tracking-tight">
              Verification &amp; failure modes
            </h3>
          </div>

          <div className="space-y-4">
            <div className="panel-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" strokeWidth={2} />
                <span className="font-medium text-white text-xs">
                  How do you know it works
                </span>
              </div>
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                {topic.verify}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] text-[var(--text-muted)] block">
                Common errors &amp; fixes
              </span>
              <div className="space-y-2">
                {topic.commonErrors.map((err, idx) => (
                  <div key={idx} className="panel-inset p-3 space-y-1">
                    <div className="text-rose-400 font-medium text-xs flex items-start gap-1.5">
                      <X className="w-3 h-3 shrink-0 mt-0.5" strokeWidth={2} />
                      <span>{err.error}</span>
                    </div>
                    <div className="text-[var(--text-secondary)] text-xs pl-4">
                      <span className="text-[var(--text-muted)]">Fix:</span> {err.fix}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {topic.edgeCases && topic.edgeCases.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] text-[var(--text-muted)] block">
                  Edge cases
                </span>
                <div className="space-y-1.5">
                  {topic.edgeCases.map((ec, idx) => (
                    <div key={idx} className="panel-card p-3 text-[var(--text-secondary)] text-xs">
                      {ec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
