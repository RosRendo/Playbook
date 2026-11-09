"use client";

import React from "react";

export type TechIconName =
  | "nextjs"
  | "react"
  | "typescript"
  | "tailwind"
  | "nodejs"
  | "nestjs"
  | "postgres"
  | "redis"
  | "docker"
  | "nginx"
  | "linux"
  | "prisma"
  | "stripe"
  | "cloudflare"
  | "github"
  | "vitest"
  | "playwright"
  | "supabase"
  | "zod"
  | "bash"
  | "markdown"
  | "letsencrypt"
  | "systemd";

interface TechIconProps {
  name: TechIconName | string;
  className?: string;
}

export function TechIcon({ name, className = "w-4 h-4" }: TechIconProps) {
  const norm = name.toLowerCase().replace(/[^a-z0-9]/g, "");

  switch (norm) {
    case "nextjs":
    case "next":
      return (
        <svg viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <circle cx="90" cy="90" r="90" fill="#000000" />
          <path
            d="M149.508 157.438L69.147 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.137 149.508 157.438Z"
            fill="url(#next_paint0)"
          />
          <path d="M115.816 54H127.93V104.701L115.816 89.1764V54Z" fill="url(#next_paint1)" />
          <defs>
            <linearGradient id="next_paint0" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="white" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="next_paint1" x1="121" y1="54" x2="120.799" y2="92.115" gradientUnits="userSpaceOnUse">
              <stop stopColor="white" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      );

    case "react":
      return (
        <svg viewBox="-11.5 -10.23174 23 20.46348" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
          <g stroke="#61DAFB" strokeWidth="1" fill="none">
            <ellipse rx="11" ry="4.2" />
            <ellipse rx="11" ry="4.2" transform="rotate(60)" />
            <ellipse rx="11" ry="4.2" transform="rotate(120)" />
          </g>
        </svg>
      );

    case "typescript":
    case "ts":
      return (
        <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect width="128" height="128" rx="16" fill="#3178C6" />
          <path
            d="M74.1 82.5c1.8 3.1 4.5 5.7 8.3 7.5 3.8 1.8 8.1 2.7 13 2.7 4.2 0 7.8-.7 10.9-2.2 3.1-1.5 5.5-3.6 7.2-6.3 1.7-2.7 2.6-5.8 2.6-9.4 0-3.4-.8-6.3-2.5-8.8s-3.9-4.5-6.8-6.1c-2.9-1.6-6.4-3-10.7-4.3-3.6-1.1-6.5-2.2-8.7-3.3-2.2-1.1-3.9-2.4-5.1-3.9-1.2-1.5-1.8-3.3-1.8-5.4 0-2.3.7-4.3 2.1-5.9 1.4-1.6 3.3-2.8 5.7-3.6 2.4-.8 5.1-1.2 8.1-1.2 3.9 0 7.3.7 10.2 2.2 2.9 1.5 5.2 3.5 6.9 6.1l9.6-6.3c-2.6-4.1-6.2-7.2-10.9-9.5-4.7-2.3-10-3.4-15.9-3.4-5.6 0-10.6 1-14.9 3.1s-7.8 5-10.2 8.8c-2.4 3.8-3.6 8.3-3.6 13.5 0 4.9 1.1 9 3.4 12.4 2.3 3.4 5.3 6.1 9.1 8.1s8.4 3.7 13.7 5.2c3.7 1.1 6.8 2.2 9.2 3.4 2.4 1.2 4.2 2.6 5.5 4.3 1.3 1.7 1.9 3.8 1.9 6.3 0 2.6-.8 4.8-2.3 6.6-1.5 1.8-3.7 3.2-6.4 4.1-2.7.9-5.9 1.4-9.5 1.4-5.2 0-9.6-1.1-13.3-3.4-3.7-2.3-6.4-5.7-8.2-10.2L74.1 82.5zM48 37.6v68.8H34.4V37.6H13.6V26.4h55.2v11.2H48z"
            fill="white"
          />
        </svg>
      );

    case "tailwind":
    case "tailwindcss":
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <path
            d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.336 6.182 14.975 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.336 13.382 8.975 12 6.001 12z"
            fill="#38BDF8"
          />
        </svg>
      );

    case "postgres":
    case "postgresql":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <ellipse cx="12" cy="5" rx="9" ry="3" className="stroke-sky-400 fill-sky-400/10" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" className="stroke-sky-400" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" className="stroke-sky-400" />
          <path d="M12 8v14" className="stroke-sky-300/40" />
        </svg>
      );

    case "redis":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 2L2 7l10 5 10-5-10-5z" className="stroke-red-400 fill-red-400/10" />
          <path d="M2 17l10 5 10-5" className="stroke-red-400" />
          <path d="M2 12l10 5 10-5" className="stroke-red-400" />
        </svg>
      );

    case "docker":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M4 10h2v2H4zM7 10h2v2H7zM10 10h2v2h-2zM7 7h2v2H7zM10 7h2v2h-2zM13 7h2v2h-2z" className="fill-cyan-400/30 stroke-cyan-400" />
          <path d="M2 13h19c.6 0 1 .4 1 1 0 4-3 7-8 7-4 0-7-2-8-5l-4-3z" className="stroke-cyan-400" />
        </svg>
      );

    case "nginx":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" className="stroke-emerald-400 fill-emerald-400/10" />
          <path d="M9 16V8l6 8V8" className="stroke-emerald-400" />
        </svg>
      );

    case "linux":
    case "ubuntu":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="10" className="stroke-amber-400 fill-amber-400/10" />
          <path d="M8 15h8M9 9h.01M15 9h.01M10 12a2 2 0 004 0" className="stroke-amber-400" />
        </svg>
      );

    case "prisma":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M4 20L13.5 2.5a.5.5 0 01.9.1L20 20l-8-3-8 3z" className="stroke-teal-300 fill-teal-300/10" />
          <path d="M12 17V3" className="stroke-teal-300" />
        </svg>
      );

    case "stripe":
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect width="24" height="24" rx="4" fill="#635BFF" />
          <path
            d="M14.6 10.6c0-.9-.7-1.3-1.8-1.3-1.6 0-3.6.5-5.2 1.4V7.5c1.7-.7 3.5-1 5.2-1 3.5 0 5.8 1.8 5.8 4.7 0 4.6-6.3 3.9-6.3 5.9 0 1 .9 1.4 2.1 1.4 1.9 0 4.2-.8 5.8-1.7v3.2c-1.8.8-3.8 1.2-5.8 1.2-3.7 0-6.2-1.8-6.2-4.7 0-4.9 6.4-4.1 6.4-5.9z"
            fill="white"
          />
        </svg>
      );

    case "cloudflare":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M17.5 19H9a7 7 0 116.71-9h1.79a4.5 4.5 0 010 9z" className="stroke-orange-400 fill-orange-400/10" />
        </svg>
      );

    case "github":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      );

    case "vitest":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 2L2 7l10 15 10-15-10-5z" className="stroke-lime-400 fill-lime-400/10" />
          <path d="M12 7v8" className="stroke-lime-400" />
        </svg>
      );

    case "playwright":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="8" cy="12" r="6" className="stroke-emerald-400 fill-emerald-400/10" />
          <circle cx="16" cy="12" r="6" className="stroke-red-400 fill-red-400/10" />
          <path d="M12 6v12" className="stroke-amber-400" />
        </svg>
      );

    case "supabase":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" className="stroke-emerald-400 fill-emerald-400/20" />
        </svg>
      );

    case "bullmq":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect x="2" y="5" width="20" height="4" rx="1" className="stroke-purple-400 fill-purple-400/10" />
          <rect x="2" y="11" width="20" height="4" rx="1" className="stroke-purple-400 fill-purple-400/10" />
          <rect x="2" y="17" width="20" height="4" rx="1" className="stroke-purple-400 fill-purple-400/10" />
        </svg>
      );

    case "bash":
    case "terminal":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <polyline points="4 17 10 11 4 5" className="stroke-emerald-400" />
          <line x1="12" y1="19" x2="20" y2="19" className="stroke-emerald-400" />
        </svg>
      );

    case "markdown":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect x="2" y="4" width="20" height="16" rx="2" className="stroke-slate-400" />
          <path d="M6 15V9l3 4 3-4v6M18 12l-2-2v5" className="stroke-slate-300" />
        </svg>
      );

    case "letsencrypt":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" className="stroke-cyan-400 fill-cyan-400/10" />
          <path d="M7 11V7a5 5 0 0110 0v4" className="stroke-cyan-400" />
        </svg>
      );

    case "systemd":
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="3" className="stroke-slate-400 fill-white/10" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" className="stroke-slate-400" />
        </svg>
      );
  }
}

