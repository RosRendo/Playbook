"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  HeaderNav,
  PlaybookTier,
} from "@/components/HeaderNav";
import { PLAYBOOK_MODULES } from "@/data/playbookModules";
import { ModuleDetailView } from "@/components/ModuleDetailView";
import { DecisionEngine } from "@/components/DecisionEngine";
import { PacketFlowHighway } from "@/components/PacketFlowHighway";
import { ArchitectureTiers } from "@/components/ArchitectureTiers";
import { PromptMatrix } from "@/components/PromptMatrix";
import { CommandCenter } from "@/components/CommandCenter";
import { TroubleshootTree } from "@/components/TroubleshootTree";
import { ScalingLadder } from "@/components/ScalingLadder";
import { RecipesSection } from "@/components/RecipesSection";
import { KillListSection } from "@/components/KillListSection";
import { CostArchitecture } from "@/components/CostArchitecture";
import { TechStackExplorer } from "@/components/TechStackExplorer";
import { LinuxTerminalMastery } from "@/components/LinuxTerminalMastery";
import { NetworkingMastery } from "@/components/NetworkingMastery";
import { ScriptingMastery } from "@/components/ScriptingMastery";
import { DockerMastery } from "@/components/DockerMastery";
import { KubernetesMastery } from "@/components/KubernetesMastery";
import { CicdMastery } from "@/components/CicdMastery";
import { CloudMastery } from "@/components/CloudMastery";
import { MonitoringMastery } from "@/components/MonitoringMastery";
import { IacMastery } from "@/components/IacMastery";
import { CareerRoadmaps } from "@/components/CareerRoadmaps";
import {
  BookOpen,
  Terminal,
  Network,
  Code,
  Boxes,
  Cpu,
  Workflow,
  Cloud,
  Activity,
  FileCode2,
  Stethoscope,
  ChefHat,
  TrendingUp,
  Skull,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Compass,
  Layers,
  X,
} from "lucide-react";

const STORAGE_KEY = "fs-playbook-state-v1";

interface SidebarItem {
  id: string;
  type: "module" | "interactive";
  category: string;
  label: string;
  number?: string;
  icon: React.ElementType;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "mod-fundamentals", type: "module", category: "Modules", label: "Internet & ports", number: "00", icon: BookOpen },
  { id: "mod-product-discovery", type: "module", category: "Modules", label: "Discovery & kill list", number: "01", icon: BookOpen },
  { id: "mod-prd-user-flows", type: "module", category: "Modules", label: "PRD & 7 UI states", number: "02", icon: BookOpen },
  { id: "mod-architecture-tiers", type: "module", category: "Modules", label: "Architecture tiers", number: "03", icon: BookOpen },
  { id: "mod-database-discipline", type: "module", category: "Modules", label: "Database discipline", number: "04", icon: BookOpen },
  { id: "mod-networking-cloud", type: "module", category: "Modules", label: "Networking & nginx", number: "05", icon: BookOpen },
  { id: "mod-linux-docker-devops", type: "module", category: "Modules", label: "Linux & docker", number: "06", icon: BookOpen },
  { id: "mod-troubleshooting-triage", type: "module", category: "Modules", label: "Fault triage ladder", number: "07", icon: BookOpen },
  { id: "mod-payments-webhooks", type: "module", category: "Modules", label: "Payments & webhooks", number: "08", icon: BookOpen },
  { id: "mod-scaling-debt", type: "module", category: "Modules", label: "Scale & economics", number: "09", icon: BookOpen },

  { id: "tool-career-roadmaps", type: "interactive", category: "Workstation", label: "Career roadmaps (Cloud & DevOps)", icon: Compass },
  { id: "tool-tech-stack", type: "interactive", category: "Workstation", label: "Tech stack arsenal", icon: Layers },
  { id: "tool-linux", type: "interactive", category: "Workstation", label: "Linux 20-concept engine", icon: Terminal },
  { id: "tool-networking-mastery", type: "interactive", category: "Workstation", label: "Networking 20-concept engine", icon: Network },
  { id: "tool-scripting-mastery", type: "interactive", category: "Workstation", label: "Scripting 20-concept engine", icon: Code },
  { id: "tool-docker-mastery", type: "interactive", category: "Workstation", label: "Docker 20-concept engine", icon: Boxes },
  { id: "tool-kubernetes-mastery", type: "interactive", category: "Workstation", label: "Kubernetes 20-concept engine", icon: Cpu },
  { id: "tool-cicd-mastery", type: "interactive", category: "Workstation", label: "CI/CD 20-concept engine", icon: Workflow },
  { id: "tool-cloud-mastery", type: "interactive", category: "Workstation", label: "Cloud 20-concept engine", icon: Cloud },
  { id: "tool-monitoring-mastery", type: "interactive", category: "Workstation", label: "Monitoring 20-concept engine", icon: Activity },
  { id: "tool-iac-mastery", type: "interactive", category: "Workstation", label: "IaC 20-concept engine", icon: FileCode2 },
  { id: "tool-decision", type: "interactive", category: "Workstation", label: "Decision engine", icon: Compass },
  { id: "tool-prompts", type: "interactive", category: "Workstation", label: "AI prompt matrix", icon: Terminal },
  { id: "tool-network", type: "interactive", category: "Workstation", label: "Packet path tracer", icon: Network },
  { id: "tool-commands", type: "interactive", category: "Workstation", label: "DevOps terminal", icon: Terminal },
  { id: "tool-triage", type: "interactive", category: "Workstation", label: "Diagnostic CLI tree", icon: Stethoscope },
  { id: "tool-topology", type: "interactive", category: "Workstation", label: "Topology visualizer", icon: Boxes },
  { id: "tool-recipes", type: "interactive", category: "Workstation", label: "Deploy runbooks", icon: ChefHat },
  { id: "tool-scaling", type: "interactive", category: "Workstation", label: "Scaling ladder", icon: TrendingUp },
  { id: "tool-kill-list", type: "interactive", category: "Workstation", label: "Kill list policy", icon: Skull },
  { id: "tool-costs", type: "interactive", category: "Workstation", label: "Unit economics", icon: DollarSign },
];

const CATEGORIES = Array.from(new Set(SIDEBAR_ITEMS.map((i) => i.category)));

interface PersistedState {
  activeId: string;
  tier: PlaybookTier;
  completed: Record<string, boolean>;
}

function loadPersisted(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (
        typeof parsed.activeId === "string" &&
        SIDEBAR_ITEMS.some((i) => i.id === parsed.activeId)
      ) {
        return {
          activeId: parsed.activeId,
          tier: parsed.tier ?? "mvp",
          completed: parsed.completed ?? {},
        };
      }
    }
  } catch {
    // corrupted or unavailable storage — fall through to defaults
  }
  return { activeId: "mod-fundamentals", tier: "mvp", completed: {} };
}

export default function Home() {
  const [activeId, setActiveId] = useState<string>("mod-fundamentals");
  const [currentTier, setCurrentTier] = useState<PlaybookTier>("mvp");
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const persisted = loadPersisted();
    // A hash (#mod-payments-webhooks) wins over the persisted position,
    // so pasted links always land on the referenced topic
    const fromHash = window.location.hash.replace("#", "");
    const initial = SIDEBAR_ITEMS.some((i) => i.id === fromHash)
      ? fromHash
      : persisted.activeId;
    setActiveId(initial);
    setCurrentTier(persisted.tier);
    setCompletedItems(persisted.completed);
    setHydrated(true);
  }, []);

  // Reflect the active topic in the URL so it can be bookmarked or shared
  useEffect(() => {
    if (!hydrated) return;
    const target = `#${activeId}`;
    if (window.location.hash !== target) {
      window.history.replaceState(null, "", target);
    }
  }, [activeId, hydrated]);

  // React to browser back / forward between topics
  useEffect(() => {
    const onHashChange = () => {
      const fromHash = window.location.hash.replace("#", "");
      if (fromHash && SIDEBAR_ITEMS.some((i) => i.id === fromHash)) {
        setActiveId(fromHash);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          activeId,
          tier: currentTier,
          completed: completedItems,
        } satisfies PersistedState)
      );
    } catch {
      // storage full or blocked — state stays in memory for the session
    }
  }, [activeId, currentTier, completedItems, hydrated]);

  // Reset content scroll whenever the topic changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [activeId]);

  const currentIndex = SIDEBAR_ITEMS.findIndex((item) => item.id === activeId);
  const currentItem = SIDEBAR_ITEMS[currentIndex] || SIDEBAR_ITEMS[0];

  const handleNext = useCallback(() => {
    if (currentIndex < SIDEBAR_ITEMS.length - 1) {
      setActiveId(SIDEBAR_ITEMS[currentIndex + 1].id);
    }
  }, [currentIndex]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setActiveId(SIDEBAR_ITEMS[currentIndex - 1].id);
    }
  }, [currentIndex]);

  // Keyboard: arrow keys move between topics
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNext, handlePrev]);

  const selectItem = (id: string) => {
    setActiveId(id);
    setMenuOpen(false);
  };

  const toggleComplete = (id: string) => {
    setCompletedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const doneCount = Object.values(completedItems).filter(Boolean).length;
  const selectedModule =
    currentItem.type === "module"
      ? PLAYBOOK_MODULES.find((m) => `mod-${m.id}` === currentItem.id) ||
        PLAYBOOK_MODULES[0]
      : null;

  const navBody = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <span className="text-xs font-mono text-[var(--text-muted)]">
          Playbook
        </span>
        <button
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
          className="md:hidden p-1.5 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-5">
        {CATEGORIES.map((cat) => (
          <div key={cat} role="group" aria-label={cat} className="space-y-1">
            <div className="px-2 pb-1.5 text-[11px] font-mono text-[var(--text-muted)]">
              {cat}
            </div>
            {SIDEBAR_ITEMS.filter((item) => item.category === cat).map(
              (item) => {
                const Icon = item.icon;
                const isActive = activeId === item.id;
                const isDone = !!completedItems[item.id];
                return (
                  <button
                    key={item.id}
                    onClick={() => selectItem(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left text-[13px] transition-all duration-200 ${
                      isActive
                        ? "nav-item-active text-white border border-white/10"
                        : "text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.03] border border-transparent"
                    }`}
                  >
                    {item.number ? (
                      <span
                        className={`keycap ${isActive ? "keycap-active" : ""}`}
                      >
                        {item.number}
                      </span>
                    ) : (
                      <Icon
                        className="w-4 h-4 shrink-0 text-[var(--text-muted)]"
                        strokeWidth={1.5}
                      />
                    )}
                    <span className="truncate flex-1">{item.label}</span>
                    {isDone && (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[var(--accent)]" />
                    )}
                  </button>
                );
              }
            )}
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-white/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[11px] text-[var(--text-muted)]">
            Verified
          </span>
          <span className="font-mono text-[11px] text-[var(--text-secondary)] tabular-nums">
            {doneCount} / {SIDEBAR_ITEMS.length}
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${(doneCount / SIDEBAR_ITEMS.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] overflow-hidden">
      <HeaderNav
        currentTier={currentTier}
        onSelectTier={setCurrentTier}
        onOpenMenu={() => setMenuOpen(true)}
        progress={{ done: doneCount, total: SIDEBAR_ITEMS.length }}
      />

      <div className="flex-1 flex min-h-0 max-w-[1520px] w-full mx-auto px-4 py-3 gap-3">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-[260px] shrink-0 panel-base bg-[var(--surface-panel)]">
          {navBody}
        </aside>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
            <div
              className="absolute inset-0 bg-black/60 scrub-in"
              onClick={() => setMenuOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-[var(--surface-panel)] border-r border-white/[0.08] flex flex-col drawer-in">
              {navBody}
            </aside>
          </div>
        )}

        {/* Main focus viewport */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Context bar */}
          <div className="panel-base px-4 py-2 flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 min-w-0 font-mono text-[11px]">
              {currentItem.number && (
                <span className="keycap keycap-active">{currentItem.number}</span>
              )}
              <span className="text-white font-medium truncate">
                {currentItem.label}
              </span>
              <span className="text-[var(--text-muted)] truncate hidden sm:inline tabular-nums">
                {currentIndex + 1} / {SIDEBAR_ITEMS.length}
              </span>
            </div>

            <button
              onClick={() => toggleComplete(activeId)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono transition-colors shrink-0 ${
                completedItems[activeId]
                  ? "border-[var(--accent-border)] bg-[var(--accent-dim)] text-[var(--accent-ink)]"
                  : "border-white/10 bg-white/[0.03] text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">
                {completedItems[activeId] ? "Verified" : "Verify"}
              </span>
            </button>
          </div>

          {/* Content — animates in on every topic change */}
          <div
            key={activeId}
            ref={scrollRef}
            className="view-in flex-1 min-h-0 overflow-y-auto pr-1"
          >
            {currentItem.type === "module" && selectedModule && (
              <ModuleDetailView
                topic={selectedModule}
                currentTier={currentTier}
                onOpenTechStack={() => selectItem("tool-tech-stack")}
              />
            )}

            {currentItem.id === "tool-career-roadmaps" && (
              <CareerRoadmaps onNavigateToTool={(id) => selectItem(id)} />
            )}
            {currentItem.id === "tool-tech-stack" && (
              <TechStackExplorer currentTier={currentTier} />
            )}
            {currentItem.id === "tool-linux" && <LinuxTerminalMastery />}
            {currentItem.id === "tool-networking-mastery" && <NetworkingMastery />}
            {currentItem.id === "tool-scripting-mastery" && <ScriptingMastery />}
            {currentItem.id === "tool-docker-mastery" && <DockerMastery />}
            {currentItem.id === "tool-kubernetes-mastery" && <KubernetesMastery />}
            {currentItem.id === "tool-cicd-mastery" && <CicdMastery />}
            {currentItem.id === "tool-cloud-mastery" && <CloudMastery />}
            {currentItem.id === "tool-monitoring-mastery" && <MonitoringMastery />}
            {currentItem.id === "tool-iac-mastery" && <IacMastery />}
            {currentItem.id === "tool-decision" && (
              <DecisionEngine currentTier={currentTier} />
            )}
            {currentItem.id === "tool-prompts" && <PromptMatrix />}
            {currentItem.id === "tool-network" && <PacketFlowHighway />}
            {currentItem.id === "tool-commands" && <CommandCenter />}
            {currentItem.id === "tool-triage" && <TroubleshootTree />}
            {currentItem.id === "tool-topology" && (
              <ArchitectureTiers currentTier={currentTier} />
            )}
            {currentItem.id === "tool-recipes" && <RecipesSection />}
            {currentItem.id === "tool-scaling" && <ScalingLadder />}
            {currentItem.id === "tool-kill-list" && <KillListSection />}
            {currentItem.id === "tool-costs" && (
              <CostArchitecture currentTier={currentTier} />
            )}
          </div>

          {/* Prev / next rail — the single navigation layer */}
          <div className="flex items-center justify-between gap-3 mt-3">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-[var(--surface-panel)] text-xs font-mono text-[var(--text-secondary)] disabled:opacity-30 disabled:cursor-not-allowed hover:text-white hover:bg-[var(--surface-hover)] active:translate-y-px transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>

            <span className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-[var(--text-muted)]">
              <span className="kbd">←</span>
              <span className="kbd">→</span>
              <span className="ml-1">to navigate</span>
            </span>

            <button
              onClick={handleNext}
              disabled={currentIndex === SIDEBAR_ITEMS.length - 1}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-[var(--surface-panel)] text-xs font-mono text-[var(--text-secondary)] disabled:opacity-30 disabled:cursor-not-allowed hover:text-white hover:bg-[var(--surface-hover)] active:translate-y-px transition-all cursor-pointer"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
