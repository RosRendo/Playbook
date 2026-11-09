"use client";

import React, { useState } from "react";
import {
  SCRIPTING_CONCEPTS,
  ScriptingConceptDetail,
} from "@/data/scriptingConcepts";
import {
  Code,
  Search,
  Check,
  Copy,
  AlertTriangle,
  BookOpen,
  Terminal,
  ShieldAlert,
  Server,
  Layers,
  Lock,
  Workflow,
  Cpu,
  FileCode,
  Play,
  RotateCcw,
} from "lucide-react";

type ConceptTab = "model" | "commands" | "rules" | "scenario";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Bash Core & Flow Control": Terminal,
  "Robustness & Error Resilience": ShieldAlert,
  "Data Formats & Parsing": FileCode,
  "Automation Tools & Python": Code,
  "Production Discipline & Mindset": Workflow,
};

export function ScriptingMastery() {
  const [selectedId, setSelectedId] = useState<string>("bash-basics");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<ConceptTab>("model");
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const selectedConcept: ScriptingConceptDetail =
    SCRIPTING_CONCEPTS.find((c) => c.id === selectedId) ||
    SCRIPTING_CONCEPTS[0];

  const categories = [
    "all",
    "Bash Core & Flow Control",
    "Robustness & Error Resilience",
    "Data Formats & Parsing",
    "Automation Tools & Python",
    "Production Discipline & Mindset",
  ];

  const filteredConcepts = SCRIPTING_CONCEPTS.filter((c) => {
    if (selectedCategory !== "all" && c.category !== selectedCategory)
      return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const inTitle = c.title.toLowerCase().includes(q);
      const inTagline = c.tagline.toLowerCase().includes(q);
      const inCmd = c.productionCommands.some((cmd) =>
        cmd.cmd.toLowerCase().includes(q)
      );
      return inTitle || inTagline || inCmd;
    }
    return true;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCmd(text);
      setTimeout(() => setCopiedCmd(null), 2000);
    });
  };

  const IconComponent = CATEGORY_ICONS[selectedConcept.category] || Code;

  return (
    <section className="space-y-4">
      {/* Header bar */}
      <div className="panel-base p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div>
            <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5" />
              <span>Core Engineering Fundamentals &bull; Scripting Engine</span>
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
              20 Essential Scripting &amp; Automation Concepts
            </h3>
            <p className="text-xs md:text-sm text-slate-400 mt-1 leading-relaxed">
              From Bash strict mode (set -euo pipefail) and jq JSON parsing to idempotent automation, Makefiles, and dry-run safety.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search scripts, syntax, flags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0c0e12] border border-white/10 rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30 font-mono"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded transition text-[11px] ${
                selectedCategory === cat
                  ? "bg-[#1d222b] text-white border border-white/20 font-medium"
                  : "text-slate-400 hover:text-slate-200 bg-white/[0.02] border border-white/5"
              }`}
            >
              {cat === "all" ? "All 20 Concepts" : cat}
            </button>
          ))}
        </div>

        {/* 20-Item Horizontal Selector Rail */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-1.5 pt-2 font-mono text-xs">
          {filteredConcepts.map((concept) => {
            const isSelected = concept.id === selectedId;
            return (
              <button
                key={concept.id}
                onClick={() => setSelectedId(concept.id)}
                className={`p-2 rounded-md border text-left transition flex flex-col justify-between min-h-[58px] ${
                  isSelected
                    ? "bg-[#1c222c] border-cyan-500/40 text-white shadow-sm ring-1 ring-cyan-500/20"
                    : "bg-[#12151c] border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/15 hover:bg-[#161a22]"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>#{concept.number}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  )}
                </div>
                <div className="font-medium text-[11px] text-white truncate leading-tight mt-1">
                  {concept.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Concept Deep-Dive Viewport */}
      <div className="panel-base p-6 space-y-6">
        {/* Concept Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#181c25] border border-white/15 flex items-center justify-center shrink-0 text-cyan-400">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-cyan-400 font-semibold">
                  CONCEPT #{selectedConcept.number}
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                  {selectedConcept.category}
                </span>
              </div>
              <h4 className="text-xl font-semibold text-white tracking-tight mt-0.5">
                {selectedConcept.title}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                {selectedConcept.tagline}
              </p>
            </div>
          </div>

          {/* Sub-tab navigation */}
          <div className="flex items-center gap-1 bg-[#0c0e12] p-1 rounded-md border border-white/10 font-mono text-xs shrink-0">
            <button
              onClick={() => setActiveTab("model")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
                activeTab === "model"
                  ? "bg-[#1d222b] text-white font-medium shadow-sm border border-white/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>1. Mental Model</span>
            </button>
            <button
              onClick={() => setActiveTab("commands")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
                activeTab === "commands"
                  ? "bg-[#1d222b] text-white font-medium shadow-sm border border-white/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>
                2. Commands ({selectedConcept.productionCommands.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
                activeTab === "rules"
                  ? "bg-[#1d222b] text-white font-medium shadow-sm border border-white/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>3. Rules &amp; Gotchas</span>
            </button>
            <button
              onClick={() => setActiveTab("scenario")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
                activeTab === "scenario"
                  ? "bg-[#1d222b] text-white font-medium shadow-sm border border-white/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Workflow className="w-3.5 h-3.5 text-cyan-400" />
              <span>4. Real Incident</span>
            </button>
          </div>
        </div>

        {/* TAB 1: MENTAL MODEL */}
        {activeTab === "model" && (
          <div className="space-y-4">
            <div className="panel-card p-5 space-y-3">
              <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                Automation Philosophy &amp; Execution Mechanics
              </div>
              <p className="text-slate-200 text-xs md:text-sm leading-relaxed font-sans">
                {selectedConcept.mentalModel}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Production Idiom &amp; Code Template</span>
                <button
                  onClick={() => handleCopy(selectedConcept.keySyntax)}
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition"
                >
                  {copiedCmd === selectedConcept.keySyntax ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>
                    {copiedCmd === selectedConcept.keySyntax
                      ? "Copied"
                      : "Copy"}
                  </span>
                </button>
              </div>
              <pre className="panel-inset p-4 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre leading-relaxed border border-white/5">
                <code>{selectedConcept.keySyntax}</code>
              </pre>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTION COMMANDS */}
        {activeTab === "commands" && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
              Battle-Tested Scripts &amp; Command Sequences
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {selectedConcept.productionCommands.map((item, idx) => (
                <div
                  key={idx}
                  className="panel-card p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-white/5 hover:border-white/15 transition"
                >
                  <div className="space-y-1 min-w-0 flex-1 font-mono">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-semibold ${
                          item.level === "read"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : item.level === "write"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {item.level}
                      </span>
                      <code className="text-xs text-slate-100 font-semibold break-all">
                        {item.cmd}
                      </code>
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans">
                      {item.desc}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(item.cmd)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 font-mono text-xs shrink-0 self-start sm:self-auto transition"
                  >
                    {copiedCmd === item.cmd ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: RULES & GOTCHAS */}
        {activeTab === "rules" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Rules */}
            <div className="panel-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-medium text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="uppercase tracking-wider">
                  Scripting Invariants
                </span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-sans leading-relaxed">
                {selectedConcept.productionRules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 font-bold">
                      ✓
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Failure Modes */}
            <div className="panel-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-medium text-rose-300">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <span className="uppercase tracking-wider">
                  Real-World Scripting Disasters
                </span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-sans leading-relaxed">
                {selectedConcept.failureModes.map((failure, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{failure}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* TAB 4: REAL-WORLD SCENARIO */}
        {activeTab === "scenario" && (
          <div className="panel-card p-6 space-y-4 border-cyan-500/20 bg-[#10141d]">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-cyan-300">
              <Workflow className="w-4 h-4 text-cyan-400" />
              <span className="uppercase tracking-wider">
                Production Incident Walkthrough
              </span>
            </div>
            <p className="text-slate-200 text-xs md:text-sm leading-relaxed font-sans">
              {selectedConcept.realWorldScenario}
            </p>
            <div className="panel-inset p-3 border border-white/5 font-mono text-[11px] text-slate-400">
              Rule of Thumb: The most dangerous automation is partial automation that assumes happy-path execution. Build defensive scripts with strict mode, state checks, and atomic rollback traps.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

