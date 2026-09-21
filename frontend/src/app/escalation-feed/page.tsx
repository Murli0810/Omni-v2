"use client";

import { useState, useMemo } from "react";
import AlertCard from "@/components/feed/AlertCard";
import { useAlerts } from "@/components/providers/AlertsProvider";
import { EventRecord } from "@/lib/types";
import {
  Siren,
  Search,
  PlusCircle,
  Radio,
  Filter,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FilterType = "all" | "hit_and_run" | "rash_driving" | "pedestrian_alert";

const filters: { value: FilterType; label: string }[] = [
  { value: "all", label: "All Escalations" },
  { value: "hit_and_run", label: "Hit & Run Incidents" },
  { value: "rash_driving", label: "Dangerous / Rash Driving" },
  { value: "pedestrian_alert", label: "Pedestrian Zone Risks" },
];

export default function EscalationFeedPage() {
  const { events, connectionStatus, simulateEvent } = useAlerts();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = useMemo(() => {
    return events.filter((alert) => {
      if (activeFilter !== "all" && alert.event_type !== activeFilter) {
        return false;
      }
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const plate = alert.extra?.plate_text?.toLowerCase() || "";
        const location = alert.extra?.location_name?.toLowerCase() || "";
        const bus = alert.bus_id?.toLowerCase() || "";
        if (
          !plate.includes(query) &&
          !location.includes(query) &&
          !bus.includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [events, activeFilter, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Header and Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-critical-100 text-critical-600">
              <Siren className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 lg:text-2xl">
                Incident Escalation Center
              </h1>
              <p className="text-xs text-slate-500">
                Real-time critical events dispatched directly from transit bus AI cameras (bypassing batching)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {connectionStatus === "connected" ? (
            <div className="glass-panel-sm flex items-center gap-2 rounded-2xl px-3.5 py-1.5">
              <Radio className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
              <span className="text-xs font-bold text-emerald-700">WebSocket Connected</span>
            </div>
          ) : (
            <div className="glass-panel-sm flex items-center gap-2 rounded-2xl px-3.5 py-1.5">
              <Radio className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-bold text-amber-700">5s Fallback Polling</span>
            </div>
          )}

          <button
            onClick={() => simulateEvent()}
            className="flex items-center gap-1.5 rounded-2xl bg-critical-600 hover:bg-critical-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Simulate Incident</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-panel flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl p-3">
        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            Category:
          </span>
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                activeFilter === f.value
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white/60 text-slate-600 hover:bg-white/90"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plate (e.g. JH05), bus, road..."
            className="w-full rounded-xl border border-slate-200/80 bg-white/70 py-1.5 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
        </div>
      </div>

      {/* Incident Cards Grid */}
      {filteredEvents.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-white/60 bg-white/40 p-6 text-center shadow-glass">
          <ShieldCheck className="h-10 w-10 text-slate-300" />
          <p className="mt-2 text-sm font-bold text-slate-700">
            No incidents match the active filter
          </p>
          <p className="text-xs text-slate-400">
            Try choosing &quot;All Escalations&quot; or clearing your search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          {filteredEvents.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}
