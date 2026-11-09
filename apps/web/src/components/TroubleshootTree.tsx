"use client";

import React, { useState } from "react";
import { Check, X, RotateCcw } from "lucide-react";

interface TriageStep {
  question: string;
  cmd: string;
  fixIfNo: string;
  fixCmdIfNo: string;
}

const TRIAGE_STEPS: TriageStep[] = [
  {
    question: "Does the domain name resolve to your host server's public IP?",
    cmd: "nslookup yourdomain.com",
    fixIfNo:
      "DNS records are unconfigured or propagating. Check your registrar or DNS provider. Ensure an A Record points to your server IP address.",
    fixCmdIfNo: "dig +trace yourdomain.com",
  },
  {
    question: "Does the host machine respond to direct ICMP echo requests (ping)?",
    cmd: "ping -c 3 YOUR_SERVER_IP",
    fixIfNo:
      "Host is unreachable. The VPS instance is offline in your cloud console, or provider security group rules block ICMP traffic.",
    fixCmdIfNo: "Check VPS provider control panel -> Verify instance status: Running",
  },
  {
    question: "Are HTTP (80) and HTTPS (443) open in the host firewall (UFW)?",
    cmd: "sudo ufw status verbose",
    fixIfNo:
      "Host firewall is blocking inbound web traffic. Allow ports 80 and 443 immediately.",
    fixCmdIfNo: "sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw reload",
  },
  {
    question: "Is the Nginx reverse proxy service active without configuration syntax errors?",
    cmd: "sudo nginx -t && sudo systemctl status nginx",
    fixIfNo:
      "Nginx daemon failed or has syntax errors. Test configuration files and inspect system logs.",
    fixCmdIfNo: "sudo nginx -t && sudo journalctl -u nginx -n 20 --no-pager",
  },
  {
    question: "Is your application container active and responding on local port :3000?",
    cmd: "curl -I http://localhost:3000",
    fixIfNo:
      "Application container crashed or failed to bind to port 3000. Inspect container logs for runtime exceptions or missing environment variables.",
    fixCmdIfNo: "docker ps -a && docker logs --tail 50 <app_container_name>",
  },
  {
    question: "Can the application container establish a TCP socket to the PostgreSQL container?",
    cmd: "docker exec -it <app_container> nc -zv postgres 5432",
    fixIfNo:
      "Database network socket unreachable. Verify DATABASE_URL hostname matches Docker Compose service name and PostgreSQL credentials are valid.",
    fixCmdIfNo: "docker logs --tail 30 postgres_container",
  },
];

export function TroubleshootTree() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [failedDiagnosis, setFailedDiagnosis] = useState<{
    text: string;
    code: string;
  } | null>(null);

  const step = TRIAGE_STEPS[currentStepIndex];

  const handleAnswer = (isYes: boolean) => {
    if (!isYes) {
      setFailedDiagnosis({
        text: step.fixIfNo,
        code: step.fixCmdIfNo,
      });
    } else {
      setFailedDiagnosis(null);
      if (currentStepIndex < TRIAGE_STEPS.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      } else {
        setFailedDiagnosis({
          text: "All infrastructure layers verified healthy. If failures persist, inspect application business logic or client-side browser developer tools.",
          code: "Inspect browser DevTools (F12) -> Network / Console tabs",
        });
      }
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setFailedDiagnosis(null);
  };

  return (
    <section id="troubleshoot" className="panel-base p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <div className="text-[11px] font-mono text-[var(--text-muted)] mb-1">
            System Triage Protocol
          </div>
          <h3 className="text-xl font-medium text-white tracking-tight">
            Infrastructure Diagnostic Ladder
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Sequential diagnostic check to isolate broken layers from DNS down to database sockets.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="text-xs text-[var(--text-secondary)] hover:text-white font-mono px-2.5 py-1 rounded bg-[#181b23] border border-white/10 flex items-center gap-1.5 transition-colors w-fit"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      <div className="panel-inset p-5 space-y-4">
        <div className="flex items-center justify-between font-mono text-xs text-[var(--text-secondary)]">
          <span>Step {currentStepIndex + 1} of {TRIAGE_STEPS.length}</span>
          <span className="text-[11px] text-[var(--text-muted)]">Probe</span>
        </div>

        <h4 className="text-sm font-semibold text-white">{step.question}</h4>

        <div className="panel-card p-3 font-mono text-xs space-y-1">
          <span className="text-[var(--text-muted)] text-[10px] block">Run in terminal</span>
          <code className="text-slate-200 block">{step.cmd}</code>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 font-mono text-xs">
          <button
            onClick={() => handleAnswer(true)}
            className="p-3 rounded-md bg-[#181e1a] hover:bg-[#202923] border border-emerald-500/30 text-emerald-300 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Pass</span>
          </button>
          <button
            onClick={() => handleAnswer(false)}
            className="p-3 rounded-md bg-[#241819] hover:bg-[#2e1f20] border border-rose-500/30 text-rose-300 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <X className="w-4 h-4 text-rose-400" />
            <span>Fail</span>
          </button>
        </div>

        {failedDiagnosis && (
          <div className="mt-4 p-4 rounded-md bg-[#13161d] border border-white/10 space-y-2 text-xs">
            <span className="font-mono text-[11px] text-[var(--text-muted)] block">
              Remediation
            </span>
            <p className="text-slate-300 leading-relaxed">{failedDiagnosis.text}</p>
            <div className="panel-inset p-2.5 font-mono text-slate-200 text-xs">
              {failedDiagnosis.code}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
