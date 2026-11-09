"use client";

import React, { useState } from "react";
import { IAC_CONCEPTS, IacConcept } from "@/data/iacConcepts";
import {
  FileCode2,
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
  HardDrive,
  Network,
  Cpu,
  Radio,
  FileCheck,
  Globe,
  DollarSign,
  Scale,
  LineChart,
  Boxes,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  ScrollText,
} from "lucide-react";

type ConceptTab = "model" | "commands" | "rules" | "scenario";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Terraform Core": Boxes,
  "State & Locking": Lock,
  "Workflow & Lifecycle": Workflow,
  "Ansible & Config Management": Server,
  "Cloud & Modern IaC Engines": Cpu,
  "Governance & Policy": Scale,
};

export function IacMastery() {
  const [selectedId, setSelectedId] = useState<string>("terraform-basics");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<ConceptTab>("model");
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const selectedConcept: IacConcept =
    IAC_CONCEPTS.find((c) => c.id === selectedId) || IAC_CONCEPTS[0];

  const categories = [
    "all",
    "Terraform Core",
    "State & Locking",
    "Workflow & Lifecycle",
    "Ansible & Config Management",
    "Cloud & Modern IaC Engines",
    "Governance & Policy",
  ];

  const filteredConcepts = IAC_CONCEPTS.filter((c) => {
    if (selectedCategory !== "all" && c.category !== selectedCategory)
      return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchSub = c.subtitle.toLowerCase().includes(q);
      const matchModel = c.mentalModel.toLowerCase().includes(q);
      const matchCmd = c.productionCommands.some((cmd) =>
        cmd.cmd.toLowerCase().includes(q)
      );
      return matchName || matchSub || matchModel || matchCmd;
    }
    return true;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-16">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0d0f14] border border-[#1b1f27] p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-mono uppercase tracking-wider mb-3">
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Infrastructure as Code & Configuration Automation</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Infrastructure as Code (IaC) 20-Concept Mastery
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              From Terraform state locking and declarative HCL import blocks to Ansible idempotency,
              Pulumi TypeScript architecture, and Open Policy Agent (OPA) governance guardrails.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-500">
              {filteredConcepts.length} of {IAC_CONCEPTS.length} Concepts
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 flex flex-col md:flex-row gap-3 pt-6 border-t border-[#1b1f27]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search concepts, HCL snippets, Ansible tasks, or failure modes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#12151c] border border-[#222733] rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || FileCode2;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                      : "bg-[#12151c] text-zinc-400 border border-[#222733] hover:text-zinc-200 hover:border-[#2f3545]"
                  }`}
                >
                  {cat !== "all" && <Icon className="w-3 h-3 text-violet-400" />}
                  <span>{cat === "all" ? "All Categories" : cat}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Concept Selection Rail */}
        <div className="lg:col-span-4 flex flex-col gap-2 max-h-[750px] overflow-y-auto pr-1">
          {filteredConcepts.map((concept) => {
            const isSelected = concept.id === selectedId;
            const CategoryIcon = CATEGORY_ICONS[concept.category] || FileCode2;

            return (
              <button
                key={concept.id}
                onClick={() => setSelectedId(concept.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 relative overflow-hidden group ${
                  isSelected
                    ? "bg-[#171322] border-violet-500/40 shadow-lg shadow-violet-950/20"
                    : "bg-[#0d0f14] border-[#1b1f27] hover:border-[#282f3f] hover:bg-[#10131a]"
                }`}
              >
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-400" />
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CategoryIcon className={`w-3.5 h-3.5 ${isSelected ? "text-violet-400" : "text-zinc-500"}`} />
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                      {concept.category}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    #{concept.id.split("-")[0]}
                  </span>
                </div>
                <div className="font-semibold text-sm text-zinc-100 group-hover:text-violet-200 transition-colors">
                  {concept.name}
                </div>
                <div className="text-xs text-zinc-400 line-clamp-1">
                  {concept.subtitle}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-8 flex flex-col gap-5 bg-[#0d0f14] border border-[#1b1f27] rounded-2xl p-6 lg:p-7">
          {/* Header of Selected Concept */}
          <div className="flex flex-col gap-2 border-b border-[#1b1f27] pb-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/20">
                {selectedConcept.category}
              </span>
              <span className="text-xs font-mono text-zinc-500">
                Infrastructure as Code Standard Specification
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {selectedConcept.name}
            </h2>
            <p className="text-sm text-violet-300 font-mono">
              {selectedConcept.subtitle}
            </p>
          </div>

          {/* Sub-Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-[#1b1f27] pb-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab("model")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "model"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>1. Mental Model & Architecture</span>
            </button>
            <button
              onClick={() => setActiveTab("commands")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "commands"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>2. HCL, YAML & CLI Specs</span>
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "rules"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>3. Production Rules & Gotchas</span>
            </button>
            <button
              onClick={() => setActiveTab("scenario")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "scenario"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>4. Real Production Incident</span>
            </button>
          </div>

          {/* TAB 1: Mental Model */}
          {activeTab === "model" && (
            <div className="flex flex-col gap-6 pt-2">
              <div className="bg-[#12151c] border border-[#1e2330] rounded-xl p-5">
                <div className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>The Conceptual Model</span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {selectedConcept.mentalModel}
                </p>
              </div>

              <div className="bg-[#12151c] border border-[#1e2330] rounded-xl p-5">
                <div className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-2 flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5" />
                  <span>Under-The-Hood Engine Architecture</span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed font-mono text-xs">
                  {selectedConcept.coreMechanism}
                </p>
              </div>

              {selectedConcept.keySyntax.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#0b0c10] border border-[#1f2430] rounded-xl overflow-hidden"
                >
                  <div className="px-4 py-2.5 bg-[#12151c] border-b border-[#1f2430] flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-300 font-semibold">
                      {item.label}
                    </span>
                    <button
                      onClick={() => handleCopy(item.code)}
                      className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {copiedCmd === item.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-violet-300/90 overflow-x-auto whitespace-pre bg-[#0a0c10] leading-relaxed">
                    {item.code}
                  </pre>
                  <div className="px-4 py-2.5 bg-[#12151c]/60 border-t border-[#1f2430] text-xs text-zinc-400">
                    {item.explanation}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Commands */}
          {activeTab === "commands" && (
            <div className="flex flex-col gap-4 pt-2">
              <div className="text-xs text-zinc-400">
                Battle-tested Terraform, Ansible, Pulumi, and Policy-as-Code CLI commands for this domain:
              </div>

              <div className="flex flex-col gap-3">
                {selectedConcept.productionCommands.map((c, i) => {
                  const isCopied = copiedCmd === c.cmd;
                  const levelBadge =
                    c.level === "hazardous"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      : c.level === "write"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";

                  return (
                    <div
                      key={i}
                      className="group bg-[#12151c] border border-[#1e2330] hover:border-violet-500/30 rounded-xl p-4 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${levelBadge}`}
                        >
                          {c.level}
                        </span>
                        <button
                          onClick={() => handleCopy(c.cmd)}
                          className="text-xs font-mono text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="font-mono text-xs text-violet-200 bg-[#0a0c10] p-2.5 rounded-lg border border-[#1b1f2a] overflow-x-auto whitespace-pre">
                        {c.cmd}
                      </div>

                      <div className="text-xs text-zinc-400 mt-2">
                        {c.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Rules & Gotchas */}
          {activeTab === "rules" && (
            <div className="flex flex-col gap-5 pt-2">
              <div className="bg-[#12151c] border border-[#1e2330] rounded-xl p-5">
                <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>The Golden Rules of Production Infrastructure as Code</span>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {selectedConcept.productionRules.map((rule, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-zinc-300 flex items-start gap-2 leading-relaxed"
                    >
                      <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#171214] border border-[#331c22] rounded-xl p-5">
                <div className="text-xs font-mono uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Failure Modes & Anti-Patterns</span>
                </div>
                <div className="flex flex-col gap-4">
                  {selectedConcept.failureModes.map((fm, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-1.5 border-b border-[#2d181e] last:border-b-0 pb-3 last:pb-0"
                    >
                      <div className="text-xs font-semibold text-rose-300">
                        Pitfall: {fm.pitfall}
                      </div>
                      <div className="text-xs text-zinc-400">
                        <strong className="text-zinc-300">Blast Radius:</strong>{" "}
                        {fm.impact}
                      </div>
                      <div className="text-xs text-emerald-400/90 font-mono">
                        <strong className="text-emerald-300 font-sans">Fix:</strong>{" "}
                        {fm.resolution}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Real Production Incident */}
          {activeTab === "scenario" && (
            <div className="flex flex-col gap-4 pt-2">
              <div className="bg-[#12151c] border border-[#1e2330] rounded-xl p-5">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-2">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Post-Mortem War Story</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  {selectedConcept.realWorldScenario.title}
                </h3>

                <div className="flex flex-col gap-3 text-xs leading-relaxed mt-4">
                  <div className="p-3 rounded-lg bg-[#0d0f14] border border-[#1c202c]">
                    <span className="text-amber-300 font-semibold block mb-1">
                      1. The Critical Incident:
                    </span>
                    <p className="text-zinc-300">
                      {selectedConcept.realWorldScenario.situation}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0d0f14] border border-[#1c202c]">
                    <span className="text-violet-300 font-semibold block mb-1">
                      2. Root Cause Investigation:
                    </span>
                    <p className="text-zinc-300">
                      {selectedConcept.realWorldScenario.investigation}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0d0f14] border border-emerald-500/20 bg-emerald-950/10">
                    <span className="text-emerald-400 font-semibold block mb-1">
                      3. Engineering Remedy:
                    </span>
                    <p className="text-emerald-200">
                      {selectedConcept.realWorldScenario.fix}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

