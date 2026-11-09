"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CmdItem {
  id: string;
  category: "docker" | "network" | "system" | "hazardous";
  level: "read" | "write" | "destructive";
  levelLabel: string;
  cmd: string;
  what: string;
  useWhen: string;
}

const COMMANDS: CmdItem[] = [
  {
    id: "cmd-1",
    category: "docker",
    level: "read",
    levelLabel: "read � docker",
    cmd: "docker ps -a",
    what: "Lists all running and terminated containers, uptime status, and bound ports.",
    useWhen: "Verify whether the application or database crashed.",
  },
  {
    id: "cmd-2",
    category: "docker",
    level: "read",
    levelLabel: "read � docker",
    cmd: "docker logs -f --tail 100 app_container",
    what: "Streams real-time stdout and stderr output from the target container.",
    useWhen: "Investigating 500-level HTTP responses or unhandled exceptions.",
  },
  {
    id: "cmd-3",
    category: "network",
    level: "write",
    levelLabel: "write � network",
    cmd: "sudo ufw allow 80/tcp && sudo ufw allow 443/tcp",
    what: "Applies firewall rules permitting inbound traffic on web ports.",
    useWhen: "Enabling public web ingress. Ensure port 22 (SSH) is permitted first.",
  },
  {
    id: "cmd-4",
    category: "network",
    level: "read",
    levelLabel: "read � network",
    cmd: "ss -tuln | grep -E ':(80|443|3000|5432)'",
    what: "Scans kernel socket table for active TCP listeners on specified ports.",
    useWhen: "Resolving 'Address already in use' conflicts.",
  },
  {
    id: "cmd-5",
    category: "hazardous",
    level: "destructive",
    levelLabel: "destructive � system",
    cmd: "docker system prune -a --volumes",
    what: "Removes ALL unattached containers, networks, images, and named storage volumes.",
    useWhen: "Hazard: Will wipe unbacked persistent database disks.",
  },
  {
    id: "cmd-6",
    category: "system",
    level: "read",
    levelLabel: "read � system",
    cmd: "journalctl -u nginx -n 50 --no-pager",
    what: "Reads the 50 most recent systemd service logs for the Nginx daemon.",
    useWhen: "Diagnosing 502 Bad Gateway errors or TLS handshake failures.",
  },
];

export function CommandCenter() {
  const [filter, setFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = COMMANDS.filter((c) => filter === "all" || c.category === filter);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <section id="command-center" className="panel-base p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <div className="text-[11px] font-mono text-[var(--text-muted)] mb-1">
            DevOps terminal
          </div>
          <h3 className="text-xl font-medium text-white tracking-tight">
            Infrastructure commands
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Commands grouped by blast radius. Destructive ones are marked in red.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-1 bg-[var(--surface-inset)] p-1 rounded-md border border-white/10 font-mono text-xs shrink-0">
          {["all", "docker", "network", "system", "hazardous"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              aria-pressed={filter === cat}
              className={`px-2.5 py-1 rounded transition-colors ${
                filter === cat
                  ? "bg-[var(--surface-active)] text-white"
                  : "text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              {cat === "hazardous" ? "Hazard" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((item) => {
          const badgeClass =
            item.level === "read"
              ? "text-slate-400 border-white/10"
              : item.level === "write"
              ? "text-amber-400 border-amber-500/20"
              : "text-rose-400 border-rose-500/30";

          return (
            <div
              key={item.id}
              className="panel-card p-4 space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badgeClass} capitalize`}>
                    {item.levelLabel}
                  </span>
                  <button
                    onClick={() => handleCopy(item.id, item.cmd)}
                    className="text-[var(--text-muted)] hover:text-white transition-colors"
                    title="Copy command"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
                <code className="block font-mono text-xs text-slate-200 bg-[var(--bg-canvas)] p-2 rounded border border-white/[0.06] overflow-x-auto">
                  {item.cmd}
                </code>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.what}</p>
              </div>

              <div className="text-[11px] font-mono text-[var(--text-muted)] pt-2 border-t border-white/[0.06]">
                {item.useWhen}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
