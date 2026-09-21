"use client";

import { Construction, Siren, Bus, Gauge, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getSummaryStats } from "@/lib/api";

export default function SummaryHeader() {
  const { data: stats } = useQuery({
    queryKey: ["summary_stats"],
    queryFn: getSummaryStats,
    refetchInterval: 15000,
  });

  const cards = [
    {
      label: "Total Defects Detected",
      value: stats ? stats.total_defects.toLocaleString() : "1,284",
      subtext: "Across 524 km transit network",
      icon: Construction,
      tint: "bg-amber-100 text-amber-600",
      border: "border-amber-200/50",
    },
    {
      label: "Critical Incidents Today",
      value: stats ? stats.incidents_today.toString() : "7",
      subtext: "Real-time dual-path alerts",
      icon: Siren,
      tint: "bg-critical-100 text-critical-600",
      border: "border-critical-200/50",
    },
    {
      label: "Active Transit Units",
      value: stats ? stats.active_buses.toString() : "42",
      subtext: "Onboard edge AI cameras",
      icon: Bus,
      tint: "bg-sky-100 text-sky-600",
      border: "border-sky-200/50",
    },
    {
      label: "Road Health Index",
      value: stats ? stats.road_health_index : "78/100",
      subtext: "PostGIS dedup cluster score",
      icon: Gauge,
      tint: "bg-accent-100 text-accent-600",
      border: "border-accent-200/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map(({ label, value, subtext, icon: Icon, tint, border }) => (
        <Card
          key={label}
          className={`p-4 lg:p-5 rounded-3xl border ${border} transition-all hover:shadow-glass duration-200`}
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-black tracking-tight text-slate-900 lg:text-3xl">
                {value}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-700 lg:text-sm truncate">
                {label}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-400 truncate">
                {subtext}
              </p>
            </div>
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${tint} shadow-sm ml-2`}
            >
              <Icon className="h-5 w-5" strokeWidth={2.25} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
