"use client";

import React, { useState } from "react";
import {
  CAREER_ROADMAPS,
  CareerTrack,
  RoadmapStep,
} from "@/data/careerRoadmaps";
import {
  Compass,
  ArrowRight,
  CheckCircle2,
  Clock,
  Terminal,
  BookOpen,
  Briefcase,
  HelpCircle,
  Copy,
  Check,
  AlertTriangle,
  ExternalLink,
  Layers,
  Workflow,
  Sparkles,
  Award,
  Zap,
  ChevronRight,
  FolderGit2,
} from "lucide-react";

interface CareerRoadmapsProps {
  onNavigateToTool?: (toolId: string) => void;
}

type TabType = "concept" | "project" | "commands" | "interview";

export function CareerRoadmaps({ onNavigateToTool }: CareerRoadmapsProps) {
  const [activeTrackId, setActiveTrackId] = useState<"cloud-engineer" | "devops-engineer">("cloud-engineer");
  const [activeStepId, setActiveStepId] = useState<string>("ce-linux-networking");
  const [activeTab, setActiveTab] = useState<TabType>("concept");
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const activeTrack: CareerTrack =
    CAREER_ROADMAPS.find((t) => t.id === activeTrackId) || CAREER_ROADMAPS[0];

  const activeStep: RoadmapStep =
    activeTrack.steps.find((s) => s.id === activeStepId) || activeTrack.steps[0];

  const handleTrackChange = (trackId: "cloud-engineer" | "devops-engineer") => {
    setActiveTrackId(trackId);
    const newTrack = CAREER_ROADMAPS.find((t) => t.id === trackId)!;
    setActiveStepId(newTrack.steps[0].id);
  };

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const phaseColors: Record<string, string> = {
    Foundations: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    "Core Engineering": "text-purple-400 bg-purple-500/10 border-purple-500/30",
    "Advanced Systems": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    "Portfolio & Career": "text-amber-400 bg-amber-500/10 border-amber-500/30",
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-16">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0d0f14] border border-[#1b1f27] p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-3">
              <Compass className="w-3.5 h-3.5" />
              <span>Interactive Career Pathways & Step-by-Step Curriculum</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Cloud & DevOps Career Roadmaps
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Step-by-step career blueprints from foundational Linux and networking to multi-tier enterprise deployments,
              portfolio packaging, and senior interview mastery. Click any milestone to explore hands-on projects, commands, and interview traps.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400 bg-[#12151c] px-3 py-1.5 rounded-lg border border-[#222733]">
              Target Compensation: <strong className="text-emerald-400">{activeTrack.salaryRange}</strong>
            </span>
          </div>
        </div>

        {/* Career Track Toggle Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 pt-6 border-t border-[#1b1f27]">
          {CAREER_ROADMAPS.map((track) => {
            const isSelected = track.id === activeTrackId;
            return (
              <button
                key={track.id}
                onClick={() => handleTrackChange(track.id)}
                className={`flex-1 text-left p-4 rounded-xl border transition-all flex flex-col gap-1 relative overflow-hidden group ${
                  isSelected
                    ? "bg-[#121822] border-cyan-500/50 shadow-lg shadow-cyan-950/30"
                    : "bg-[#10131a] border-[#1b1f27] hover:border-[#282f3f] hover:bg-[#131720]"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-400" />
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                    {track.badge}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181d28] text-zinc-400">
                    {track.timeline}
                  </span>
                </div>
                <div className="text-base font-bold text-white group-hover:text-cyan-200 transition-colors">
                  {track.name} Pathway
                </div>
                <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                  {track.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Roadmap Progression Ribbon */}
      <div className="bg-[#0d0f14] border border-[#1b1f27] rounded-2xl p-5 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Workflow className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sequential Roadmap Progression ({activeTrack.steps.length} Milestones)</span>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            Click any milestone step to inspect details
          </span>
        </div>

        {/* Horizontal Ribbon Rail */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
          {activeTrack.steps.map((step, idx) => {
            const isSelected = step.id === activeStepId;
            const isLast = idx === activeTrack.steps.length - 1;

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setActiveStepId(step.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                    isSelected
                      ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/50 shadow-md shadow-cyan-950/30 ring-1 ring-cyan-500/30"
                      : "bg-[#12151c] text-zinc-300 border-[#222733] hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                      isSelected
                        ? "bg-cyan-400 text-black"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {step.stepNumber}
                  </span>
                  <span>{step.title}</span>
                </button>

                {!isLast && (
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Detail View (Cockpit) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Milestones Rail */}
        <div className="lg:col-span-4 flex flex-col gap-2 max-h-[750px] overflow-y-auto pr-1">
          {activeTrack.steps.map((step) => {
            const isSelected = step.id === activeStepId;
            const phaseClass = phaseColors[step.phase] || "text-zinc-400 bg-zinc-800 border-zinc-700";

            return (
              <button
                key={step.id}
                onClick={() => setActiveStepId(step.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 relative overflow-hidden group ${
                  isSelected
                    ? "bg-[#121822] border-cyan-500/40 shadow-lg shadow-cyan-950/20"
                    : "bg-[#0d0f14] border-[#1b1f27] hover:border-[#282f3f] hover:bg-[#10131a]"
                }`}
              >
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400" />
                )}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${phaseClass}`}>
                    {step.phase}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {step.durationWeeks}
                  </span>
                </div>
                <div className="font-semibold text-sm text-zinc-100 group-hover:text-cyan-200 transition-colors flex items-center gap-1.5">
                  <span className="text-zinc-500 text-xs font-mono">0{step.stepNumber}.</span>
                  <span>{step.title}</span>
                </div>
                <div className="text-xs text-zinc-400 line-clamp-1">
                  {step.subtitle}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-8 flex flex-col gap-5 bg-[#0d0f14] border border-[#1b1f27] rounded-2xl p-6 lg:p-7">
          {/* Header of Active Step */}
          <div className="flex flex-col gap-2 border-b border-[#1b1f27] pb-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2.5 py-1 rounded-md border uppercase tracking-wider ${phaseColors[activeStep.phase]}`}>
                  {activeStep.phase}
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  {activeStep.durationWeeks} Recommended Focus
                </span>
              </div>

              {activeStep.relatedEngineId && (
                <button
                  onClick={() => onNavigateToTool && onNavigateToTool(activeStep.relatedEngineId!)}
                  className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 hover:text-white transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Open {activeStep.relatedEngineName}</span>
                  <ChevronRight className="w-3 h-3 text-cyan-400" />
                </button>
              )}
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-cyan-400 font-mono">#{activeStep.stepNumber}</span>
              <span>{activeStep.title}</span>
            </h2>
            <p className="text-sm text-cyan-300 font-mono">
              {activeStep.subtitle}
            </p>
          </div>

          {/* Sub-Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-[#1b1f27] pb-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab("concept")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "concept"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>1. Concept & Skills</span>
            </button>
            <button
              onClick={() => setActiveTab("project")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "project"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>2. Hands-On Capstone Project</span>
            </button>
            <button
              onClick={() => setActiveTab("commands")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "commands"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>3. Terminal Commands Cheatsheet</span>
            </button>
            <button
              onClick={() => setActiveTab("interview")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "interview"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>4. Real Interview Questions & Traps</span>
            </button>
          </div>

          {/* TAB 1: Concept & Skills */}
          {activeTab === "concept" && (
            <div className="flex flex-col gap-5 pt-2">
              <div className="bg-[#12151c] border border-[#1e2330] rounded-xl p-5">
                <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>The Core Mental Model</span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {activeStep.overview}
                </p>
              </div>

              <div className="bg-[#12151c] border border-[#1e2330] rounded-xl p-5">
                <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Core Production Competencies</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {activeStep.coreSkills.map((skill, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[#0d0f14] border border-[#1b1f2a] text-xs text-zinc-300 flex items-start gap-2"
                    >
                      <span className="text-emerald-400 font-bold mt-0.5">•</span>
                      <span>{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Hands-On Capstone Project */}
          {activeTab === "project" && (
            <div className="flex flex-col gap-5 pt-2">
              <div className="bg-[#12151c] border border-[#1e2330] rounded-xl p-5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-2">
                  <Briefcase className="w-3 h-3" />
                  <span>Portfolio Milestone Project</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {activeStep.handsOnProject.title}
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {activeStep.handsOnProject.objective}
                </p>

                <div className="mt-4 pt-4 border-t border-[#1b1f27]">
                  <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-2">
                    Key Deliverables:
                  </div>
                  <ul className="flex flex-col gap-2">
                    {activeStep.handsOnProject.deliverables.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-zinc-300 flex items-start gap-2"
                      >
                        <span className="text-cyan-400 font-bold mt-0.5">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 p-3.5 rounded-lg bg-[#0e161f] border border-cyan-500/20 text-xs text-cyan-200">
                  <strong className="text-cyan-400 block mb-1">Architectural Pro-Tip:</strong>
                  {activeStep.handsOnProject.architectureTip}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Terminal Commands Cheatsheet */}
          {activeTab === "commands" && (
            <div className="flex flex-col gap-4 pt-2">
              <div className="text-xs text-zinc-400">
                Essential terminal invocations, CLI commands, and scripts required for this milestone:
              </div>

              <div className="flex flex-col gap-3">
                {activeStep.commandsCheatsheet.map((c, i) => {
                  const isCopied = copiedCmd === c.cmd;
                  return (
                    <div
                      key={i}
                      className="group bg-[#12151c] border border-[#1e2330] hover:border-cyan-500/30 rounded-xl p-4 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase tracking-wider">
                          CLI INVOCATION
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

                      <div className="font-mono text-xs text-cyan-200 bg-[#0a0c10] p-2.5 rounded-lg border border-[#1b1f2a] overflow-x-auto whitespace-pre">
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

          {/* TAB 4: Real Interview Questions & Traps */}
          {activeTab === "interview" && (
            <div className="flex flex-col gap-5 pt-2">
              {activeStep.interviewQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="bg-[#12151c] border border-[#1e2330] rounded-xl p-5 flex flex-col gap-3"
                >
                  <div className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Real Technical Interview Screen</span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-relaxed">
                    &ldquo;{q.question}&rdquo;
                  </h4>

                  <div className="p-3.5 rounded-lg bg-[#0d0f14] border border-emerald-500/20 text-xs text-zinc-300 leading-relaxed">
                    <strong className="text-emerald-400 block mb-1">
                      Model Technical Answer (How to score 10/10):
                    </strong>
                    {q.answer}
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#161214] border border-rose-500/20 text-xs text-rose-300 leading-relaxed">
                    <strong className="text-rose-400 block mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Candidate Red Flag / Common Trap:
                    </strong>
                    {q.trap}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
