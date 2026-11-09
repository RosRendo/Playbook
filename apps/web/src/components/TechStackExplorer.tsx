"use client";

import React, { useState, useEffect } from "react";
import { TECH_STACK_DETAILS, TechStackDetail } from "@/data/techStackDetails";
import { TechIcon } from "./TechIcon";
import { PlaybookTier } from "./HeaderNav";
import {
  Check,
  Copy,
  AlertTriangle,
  Terminal,
  BookOpen,
  ListOrdered,
  ShieldAlert,
} from "lucide-react";

type StackTab = "overview" | "steps" | "commands" | "rules";

interface TechStackExplorerProps {
  currentTier?: PlaybookTier;
}

export function TechStackExplorer({ currentTier }: TechStackExplorerProps) {
  const allTech = Object.values(TECH_STACK_DETAILS);
  const [selectedTechId, setSelectedTechId] = useState<string>("nextjs");
  const [tierFilter, setTierFilter] = useState<"all" | "mvp" | "prod" | "enterprise">("all");
  const [activeTab, setActiveTab] = useState<StackTab>("overview");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Sync tierFilter when currentTier changes
  useEffect(() => {
    if (currentTier === "mvp") {
      setTierFilter("mvp");
    } else if (currentTier === "prod") {
      setTierFilter("prod");
    } else if (currentTier === "ent") {
      setTierFilter("enterprise");
    }
  }, [currentTier]);

  const filteredTech = allTech.filter((t) => {
    if (tierFilter !== "all" && t.tier !== tierFilter) return false;
    return true;
  });

  // If selectedTech is not in filtered list, select first available
  useEffect(() => {
    if (filteredTech.length > 0 && !filteredTech.some((t) => t.id === selectedTechId)) {
      setSelectedTechId(filteredTech[0].id);
    }
  }, [tierFilter, filteredTech, selectedTechId]);

  const selectedTech: TechStackDetail = TECH_STACK_DETAILS[selectedTechId] || filteredTech[0] || allTech[0];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const handleCopyCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopiedCmd(cmd);
      setTimeout(() => setCopiedCmd(null), 2000);
    });
  };

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="panel-base p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div>
            <div className="text-[11px] font-mono text-[var(--text-muted)] mb-1">
              Stack deep-dives
            </div>
            <h3 className="text-xl md:text-2xl font-medium text-white tracking-tight">
              Technology stack
            </h3>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-1">
              Concepts, setup guides, CLI commands and safety rules for every layer.
            </p>
          </div>

          {/* Tier filters */}
          <div className="flex items-center gap-1 bg-[var(--surface-inset)] p-1 rounded-md border border-white/10 font-mono text-xs shrink-0">
            <button
              onClick={() => setTierFilter("all")}
              aria-pressed={tierFilter === "all"}
              className={`px-3 py-1 rounded transition-colors ${
                tierFilter === "all"
                  ? "bg-[var(--surface-active)] text-white"
                  : "text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              All ({allTech.length})
            </button>
            <button
              onClick={() => setTierFilter("mvp")}
              aria-pressed={tierFilter === "mvp"}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                tierFilter === "mvp"
                  ? "bg-[var(--surface-active)] text-white"
                  : "text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>MVP</span>
            </button>
            <button
              onClick={() => setTierFilter("prod")}
              aria-pressed={tierFilter === "prod"}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                tierFilter === "prod"
                  ? "bg-[var(--surface-active)] text-white"
                  : "text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Production</span>
            </button>
          </div>
        </div>

        {/* Tech selector grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 font-mono text-xs">
          {filteredTech.map((tech) => {
            const isSelected = tech.id === selectedTechId;
            return (
              <button
                key={tech.id}
                onClick={() => setSelectedTechId(tech.id)}
                aria-pressed={isSelected}
                className={`flex items-center gap-2 p-2.5 rounded-md border text-left transition-colors ${
                  isSelected
                    ? "bg-[var(--surface-active)] border-white/20 text-white"
                    : "bg-[var(--surface-card)] border-white/[0.08] text-[var(--text-secondary)] hover:text-white hover:border-white/15 hover:bg-[var(--surface-hover)]"
                }`}
              >
                <TechIcon name={tech.id} className="w-4 h-4 shrink-0" />
                <div className="truncate">
                  <div className="font-medium text-xs truncate text-white">{tech.name.split(" ")[0]}</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">{tech.category.split(" ")[0]}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected tech detail */}
      <div className="panel-base p-6 space-y-6">
        {/* Title bar & tabs */}
        <div className="space-y-4 border-b border-white/[0.06] pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[var(--surface-inset)] border border-white/10 flex items-center justify-center shrink-0">
                <TechIcon name={selectedTech.id} className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xl font-medium text-white tracking-tight">{selectedTech.name}</h4>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      selectedTech.tier === "mvp"
                        ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                        : selectedTech.tier === "prod"
                        ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                        : "text-rose-400 border-rose-500/30 bg-rose-500/10"
                    }`}
                  >
                    {selectedTech.tier} tier
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] hidden sm:inline">
                    {selectedTech.category}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{selectedTech.tagline}</p>
              </div>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex flex-wrap gap-1 font-mono text-xs">
            {(
              [
                { id: "overview", label: "Concept", icon: BookOpen },
                { id: "steps", label: "Setup", icon: ListOrdered },
                { id: "commands", label: `Commands (${selectedTech.commands?.length || 0})`, icon: Terminal },
                { id: "rules", label: "Rules & pitfalls", icon: ShieldAlert },
              ] as { id: StackTab; label: string; icon: React.ElementType }[]
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

        {/* Tab 1: concept */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            <div className="panel-card p-5 space-y-2">
              <h4 className="text-[13px] font-medium text-slate-200">How it works</h4>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{selectedTech.concept}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="panel-card p-4 space-y-2">
                <h4 className="text-[13px] font-medium text-slate-200">Why it won</h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{selectedTech.whyChosen}</p>
                <div className="pt-2 border-t border-white/[0.06] text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {selectedTech.alternativesCompared}
                </div>
              </div>

              <div className="panel-card p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <h4 className="text-[13px] font-medium text-slate-200">
                    Scaffold &middot; {selectedTech.quickSetup.language}
                  </h4>
                  <button
                    onClick={() => handleCopyCode(selectedTech.quickSetup.code)}
                    className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-muted)] hover:text-white transition-colors"
                  >
                    {copiedCode ? (
                      <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedCode ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">{selectedTech.quickSetup.description}</p>
                <pre className="panel-inset p-3 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre leading-relaxed">
                  <code>{selectedTech.quickSetup.code}</code>
                </pre>
              </div>
            </div>

            <div className="panel-card p-4 space-y-2 border-l-2 border-l-[var(--accent)]">
              <h4 className="text-[13px] font-medium text-slate-200">Upgrade threshold</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{selectedTech.whenToReplace}</p>
            </div>
          </div>
        )}

        {/* Tab 2: setup */}
        {activeTab === "steps" && (
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)]">
              Run these steps in order to integrate <span className="text-white">{selectedTech.name}</span> without missing prerequisites
            </p>
            <div className="space-y-2.5 font-mono text-xs">
              {selectedTech.stepByStep.map((step, idx) => (
                <div key={idx} className="panel-card p-4 flex items-start gap-3.5">
                  <span className="keycap mt-0.5 shrink-0">{idx + 1}</span>
                  <div className="text-[var(--text-secondary)] leading-relaxed text-xs pt-0.5">{step}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: commands */}
        {activeTab === "commands" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Commands by blast radius</span>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">click to copy</span>
            </div>

            <div className="grid grid-cols-1 gap-3 font-mono text-xs">
              {selectedTech.commands?.map((cmdItem, cIdx) => (
                <div key={cIdx} className="panel-card p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        cmdItem.level === "read"
                          ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                          : cmdItem.level === "write"
                          ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                          : "text-rose-400 border-rose-500/30 bg-rose-500/10"
                      }`}
                    >
                      {cmdItem.level === "hazardous" ? "destructive" : cmdItem.level}
                    </span>
                    <button
                      onClick={() => handleCopyCmd(cmdItem.cmd)}
                      className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-white transition-colors"
                    >
                      {copiedCmd === cmdItem.cmd ? (
                        <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[11px]">{copiedCmd === cmdItem.cmd ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  <code className="block p-2.5 rounded bg-[var(--bg-canvas)] border border-white/[0.06] text-slate-200 overflow-x-auto whitespace-pre">
                    {cmdItem.cmd}
                  </code>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{cmdItem.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: rules & pitfalls */}
        {activeTab === "rules" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="panel-card p-5 space-y-3">
              <h4 className="text-[13px] font-medium text-slate-200">Production rules</h4>
              <ul className="text-xs space-y-3 text-[var(--text-secondary)]">
                {selectedTech.productionRules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400/90 shrink-0" strokeWidth={1.5} />
                <h4 className="text-[13px] font-medium text-slate-200">Pitfalls</h4>
              </div>
              <ul className="text-xs space-y-3">
                {selectedTech.pitfalls.map((pitfall, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-rose-400/80 mt-0.5 shrink-0">&times;</span>
                    <span className="leading-relaxed text-[var(--text-secondary)]">{pitfall}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
