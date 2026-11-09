"use client";

import React from "react";

export type PlaybookTier = "mvp" | "prod" | "ent";

const TIERS: { id: PlaybookTier; label: string }[] = [
  { id: "mvp", label: "MVP" },
  { id: "prod", label: "Production" },
  { id: "ent", label: "Enterprise" },
];

interface HeaderNavProps {
  currentTier: PlaybookTier;
  onSelectTier: (tier: PlaybookTier) => void;
  onOpenMenu?: () => void;
  progress?: { done: number; total: number };
}

export function HeaderNav({
  currentTier,
  onSelectTier,
  onOpenMenu,
  progress,
}: HeaderNavProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0b0e]/85 backdrop-blur-xl">
      <div className="max-w-[1520px] mx-auto pl-4 pr-4 h-14 flex items-center justify-between gap-4 relative">
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          {onOpenMenu && (
            <button
              onClick={onOpenMenu}
              aria-label="Open navigation"
              className="md:hidden p-2 -ml-2 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M2 4.5h14M2 9h14M2 13.5h14" />
              </svg>
            </button>
          )}
          <div className="w-7 h-7 rounded-md bg-gradient-to-b from-[#2a2e3a] to-[#171a21] border border-white/20 shadow-[0_2px_8px_-2px_rgba(245,176,76,0.35),inset_0_1px_0_rgba(255,255,255,0.14)] flex items-center justify-center font-mono font-medium text-[11px] text-white shrink-0">
            FS
          </div>
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="font-semibold text-sm tracking-tight text-white truncate">
              Full-Stack Playbook
            </span>
            <span className="text-[11px] font-mono text-[var(--text-muted)] hidden sm:inline">
              / engineering standard
            </span>
          </div>
        </div>

        {/* Tier switcher — glass segmented control */}
        <div className="flex items-center bg-[#0d0f13]/80 p-1 rounded-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] text-xs font-mono shrink-0">
          {TIERS.map((tier) => {
            const isActive = currentTier === tier.id;
            return (
              <button
                key={tier.id}
                onClick={() => onSelectTier(tier.id)}
                aria-pressed={isActive}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-b from-[rgba(245,176,76,0.24)] to-[rgba(245,176,76,0.10)] text-[var(--accent-ink)] border border-[var(--accent-border)] shadow-[0_0_14px_-4px_var(--accent-glow)]"
                    : "text-[var(--text-secondary)] hover:text-white border border-transparent"
                }`}
              >
                {tier.label}
              </button>
            );
          })}
        </div>

        {/* Progress */}
        {progress && (
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <span className="font-mono text-[11px] text-[var(--text-muted)] tabular-nums">
              {progress.done} / {progress.total} verified
            </span>
            <div className="w-20 progress-track">
              <div
                className="progress-fill"
                style={{
                  width: progress.total
                    ? `${(progress.done / progress.total) * 100}%`
                    : "0%",
                }}
              />
            </div>
          </div>
        )}
      </div>
      {/* Ambient accent glow on the header hairline */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(245,176,76,0.5)] to-transparent opacity-70 pointer-events-none" />
    </header>
  );
}
