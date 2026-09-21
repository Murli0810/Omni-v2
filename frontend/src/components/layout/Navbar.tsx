"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Siren,
  Lightbulb,
  BarChart3,
  Radio,
  Bus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/escalation-feed", label: "Escalation Feed", icon: Siren },
  { href: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { href: "/analytics", label: "Fleet Analytics", icon: BarChart3 },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Top glass navbar — desktop & tablet */}
      <header className="sticky top-0 z-40 hidden sm:block">
        <div className="mx-4 mt-4 lg:mx-6 lg:mt-5">
          <div className="glass-panel flex items-center justify-between rounded-3xl px-6 py-3.5">
            {/* Brand Logo & PS Number */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-accent-600 to-teal-500 text-white shadow-glass-sm transition-transform group-hover:scale-105">
                <Bus className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-tight text-slate-900">
                    Omni
                  </span>
                  <span className="rounded-full bg-accent-50 px-2 py-0.5 font-mono text-[10px] font-bold text-accent-700 border border-accent-200">
                    PS 26124
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-400">
                  AI-Powered Mobile Urban Intelligence Platform
                </p>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="flex items-center gap-1.5">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all duration-200",
                      isActive
                        ? "bg-accent-600 text-white shadow-glass-sm"
                        : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div className="glass-panel-sm flex items-center gap-2 rounded-2xl px-3.5 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-slate-700">Fleet Sensing Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 block sm:hidden">
        <div className="mx-3 mt-3">
          <div className="glass-panel flex items-center justify-between rounded-2xl px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent-600 text-white">
                <Bus className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <span className="text-base font-black tracking-tight text-slate-900">
                Omni
              </span>
              <span className="rounded bg-accent-50 px-1.5 py-0.5 text-[9px] font-bold text-accent-700">
                SIH 2026
              </span>
            </Link>
            <div className="flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1">
              <Radio className="h-3 w-3 text-emerald-600 animate-pulse" strokeWidth={2.5} />
              <span className="text-[11px] font-bold text-slate-700">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-3 bottom-3 z-40 block sm:hidden">
        <div className="glass-panel flex items-center justify-around rounded-2xl p-1.5 shadow-2xl">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold transition-all",
                  isActive
                    ? "bg-accent-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2.2} />
                <span className="truncate">{label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
