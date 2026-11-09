"use client";

import React, { useState } from "react";
import {
  Globe,
  Shield,
  Server,
  Box,
  Cpu,
  Database,
  Smartphone,
  Play,
  Terminal,
} from "lucide-react";

interface NodeDetail {
  title: string;
  badge: string;
  what: string;
  why: string;
  cmd: string;
}

const NODES_DATA: Record<string, NodeDetail> = {
  user: {
    title: "1. Client Application (Browser / Native)",
    badge: "Origin Request",
    what: "The client device initiating an HTTPS request over public Wi-Fi or cellular networks.",
    why: "Requires authenticated transport and expects deterministic HTTP status codes (200, 400, 401, 500).",
    cmd: "curl -iv https://yourdomain.com",
  },
  dns: {
    title: "2. DNS Resolution Layer",
    badge: "Anycast Resolver",
    what: "Distributed global resolver mapping domain names to your host server's public IP address.",
    why: "Routes packets to your infrastructure edge (<10ms resolution).",
    cmd: "dig +short yourdomain.com",
  },
  firewall: {
    title: "3. Linux Firewall (UFW / Security Group)",
    badge: "Ingress Filter",
    what: "Kernel-level packet filter (iptables) permitting only explicitly authorized incoming ports.",
    why: "Isolates private ports (PostgreSQL 5432, Redis 6379, SSH 22) from external network scans.",
    cmd: "sudo ufw status verbose",
  },
  nginx: {
    title: "4. Nginx Reverse Proxy & TLS Termination",
    badge: "Edge Gateway",
    what: "High-performance web server terminating SSL/TLS certificates and proxying requests to internal ports.",
    why: "Protects application runtimes from slow-client attacks, terminates TLS efficiently, and handles gzip/brotli compression.",
    cmd: "sudo nginx -t && sudo systemctl status nginx",
  },
  docker: {
    title: "5. Docker Virtual Bridge Network",
    badge: "Container Bridge",
    what: "Internal software bridge isolating containers within a private IP subnet (e.g. 172.18.0.0/16).",
    why: "Enables service discovery via container names without exposing ports to the public host interface.",
    cmd: "docker network ls && docker network inspect bridge",
  },
  app: {
    title: "6. Application Compute Fleet (Node / Nest / Next)",
    badge: "Runtime Worker",
    what: "Stateless container process listening on internal port :3000.",
    why: "Validates request payloads, evaluates session tokens, executes business logic, and manages transactions.",
    cmd: "docker logs --tail 50 -f app_container",
  },
  db: {
    title: "7. Persistent Data Store (PostgreSQL)",
    badge: "ACID Vault",
    what: "Relational database listening on private port :5432 with persistent host volume mounts.",
    why: "Guarantees transactional consistency, foreign key integrity, and durable state storage.",
    cmd: "docker exec -it postgres_container pg_isready",
  },
};

export function PacketFlowHighway() {
  const [selectedNode, setSelectedNode] = useState<string>("nginx");
  const [activeStep, setActiveStep] = useState<string | null>(null);

  const triggerTraceroute = () => {
    const sequence = ["user", "dns", "firewall", "nginx", "docker", "app", "db"];
    sequence.forEach((nodeKey, idx) => {
      setTimeout(() => {
        setActiveStep(nodeKey);
        setTimeout(() => {
          setActiveStep((prev) => (prev === nodeKey ? null : prev));
        }, 350);
      }, idx * 220);
    });
  };

  const currentDetail = NODES_DATA[selectedNode];

  return (
    <section id="network-mental-model" className="panel-base p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <div className="text-[11px] font-mono text-[var(--text-muted)] mb-1">
            Packet path
          </div>
          <h3 className="text-xl font-medium text-white tracking-tight">
            Request lifecycle
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Click any node to inspect its role and verification command.
          </p>
        </div>

        <button
          onClick={triggerTraceroute}
          className="font-mono text-xs px-3 py-1.5 rounded-md bg-[#181b23] hover:bg-[#20242f] text-slate-300 border border-white/10 flex items-center gap-2 transition-colors shrink-0"
        >
          <Play className="w-3 h-3" strokeWidth={1.5} />
          <span>Traceroute</span>
        </button>
      </div>

      {/* Network Map */}
      <div className="panel-inset p-5 space-y-4">
        {/* Layer 1: Ingress */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          {/* Node 1 */}
          <div
            onClick={() => setSelectedNode("user")}
            className={`panel-card p-3.5 cursor-pointer space-y-1.5 ${
              selectedNode === "user" ? "border-white/25 bg-[var(--surface-active)]" : ""
            } ${activeStep === "user" ? "ring-1 ring-[var(--accent)]" : ""}`}
          >
            <div className="flex items-center justify-between text-slate-500 text-[10px]">
              <span>Origin</span>
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <div className="font-medium text-white text-xs">Client Browser</div>
            <div className="text-[11px] text-slate-400">yourdomain.com</div>
          </div>

          {/* Node 2 */}
          <div
            onClick={() => setSelectedNode("dns")}
            className={`panel-card p-3.5 cursor-pointer space-y-1.5 ${
              selectedNode === "dns" ? "border-white/25 bg-[var(--surface-active)]" : ""
            } ${activeStep === "dns" ? "ring-1 ring-[var(--accent)]" : ""}`}
          >
            <div className="flex items-center justify-between text-slate-500 text-[10px]">
              <span>Routing</span>
              <Globe className="w-3.5 h-3.5" />
            </div>
            <div className="font-medium text-white text-xs">DNS Resolver</div>
            <div className="text-[11px] text-slate-400">A Record &rarr; IP</div>
          </div>

          {/* Node 3 */}
          <div
            onClick={() => setSelectedNode("firewall")}
            className={`panel-card p-3.5 cursor-pointer space-y-1.5 ${
              selectedNode === "firewall" ? "border-white/25 bg-[var(--surface-active)]" : ""
            } ${activeStep === "firewall" ? "ring-1 ring-[var(--accent)]" : ""}`}
          >
            <div className="flex items-center justify-between text-slate-500 text-[10px]">
              <span>Firewall</span>
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div className="font-medium text-white text-xs">Linux Firewall</div>
            <div className="text-[11px] text-slate-400">UFW :80 & :443</div>
          </div>

          {/* Node 4 */}
          <div
            onClick={() => setSelectedNode("nginx")}
            className={`panel-card p-3.5 cursor-pointer space-y-1.5 ${
              selectedNode === "nginx" ? "border-white/25 bg-[var(--surface-active)]" : ""
            } ${activeStep === "nginx" ? "ring-1 ring-[var(--accent)]" : ""}`}
          >
            <div className="flex items-center justify-between text-slate-500 text-[10px]">
              <span>Gateway</span>
              <Server className="w-3.5 h-3.5" />
            </div>
            <div className="font-medium text-white text-xs">Nginx Proxy</div>
            <div className="text-[11px] text-slate-400">TLS &rarr; :3000</div>
          </div>
        </div>

        {/* Layer 2: Compute & Data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono pt-1">
          {/* Node 5 */}
          <div
            onClick={() => setSelectedNode("docker")}
            className={`panel-card p-3.5 cursor-pointer space-y-1.5 ${
              selectedNode === "docker" ? "border-white/25 bg-[var(--surface-active)]" : ""
            } ${activeStep === "docker" ? "ring-1 ring-[var(--accent)]" : ""}`}
          >
            <div className="flex items-center justify-between text-slate-500 text-[10px]">
              <span>Container bridge</span>
              <Box className="w-3.5 h-3.5" />
            </div>
            <div className="font-medium text-white text-xs">Docker Bridge</div>
            <div className="text-[11px] text-slate-400">172.18.0.0/16 Subnet</div>
          </div>

          {/* Node 6 */}
          <div
            onClick={() => setSelectedNode("app")}
            className={`panel-card p-3.5 cursor-pointer space-y-1.5 ${
              selectedNode === "app" ? "border-white/25 bg-[var(--surface-active)]" : ""
            } ${activeStep === "app" ? "ring-1 ring-[var(--accent)]" : ""}`}
          >
            <div className="flex items-center justify-between text-slate-500 text-[10px]">
              <span>Compute runtime</span>
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <div className="font-medium text-white text-xs">Node / Nest App</div>
            <div className="text-[11px] text-slate-400">Internal Port :3000</div>
          </div>

          {/* Node 7 */}
          <div
            onClick={() => setSelectedNode("db")}
            className={`panel-card p-3.5 cursor-pointer space-y-1.5 ${
              selectedNode === "db" ? "border-white/25 bg-[var(--surface-active)]" : ""
            } ${activeStep === "db" ? "ring-1 ring-[var(--accent)]" : ""}`}
          >
            <div className="flex items-center justify-between text-slate-500 text-[10px]">
              <span>Persistence</span>
              <Database className="w-3.5 h-3.5" />
            </div>
            <div className="font-medium text-white text-xs">PostgreSQL Store</div>
            <div className="text-[11px] text-slate-400">Internal Port :5432</div>
          </div>
        </div>

        {/* Detailed Inspector Drawer */}
        <div className="panel-card p-4 space-y-3 mt-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <span className="font-mono text-xs font-medium text-white">
              {currentDetail.title}
            </span>
            <span className="font-mono text-[10px] text-[var(--text-muted)] bg-white/[0.04] px-2 py-0.5 rounded">
              {currentDetail.badge}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[var(--text-muted)] font-mono text-[10px]">Role</span>
              <p className="text-[var(--text-secondary)] leading-relaxed">{currentDetail.what}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[var(--text-muted)] font-mono text-[10px]">Risk mitigated</span>
              <p className="text-[var(--text-secondary)] leading-relaxed">{currentDetail.why}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[var(--text-muted)] font-mono text-[10px]">Verify</span>
              <div className="panel-inset p-2 font-mono text-xs text-slate-200 overflow-x-auto">
                {currentDetail.cmd}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
