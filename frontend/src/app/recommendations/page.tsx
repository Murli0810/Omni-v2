"use client";

import { useState, useMemo } from "react";
import RecommendationCard from "@/components/recommendations/RecommendationCard";
import { useQuery } from "@tanstack/react-query";
import { getRecommendations } from "@/lib/api";
import { RecommendationRecord } from "@/lib/types";
import { Lightbulb, Sparkles, Filter, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PriorityFilter = "all" | "High" | "Medium" | "Low";

export default function RecommendationsPage() {
  const { data: recommendations = [], isLoading } = useQuery<RecommendationRecord[]>({
    queryKey: ["recommendations"],
    queryFn: getRecommendations,
  });

  const [activePriority, setActivePriority] = useState<PriorityFilter>("all");

  const filteredRecs = useMemo(() => {
    if (activePriority === "all") return recommendations;
    return recommendations.filter((r) => r.priority === activePriority);
  }, [recommendations, activePriority]);

  const counts = useMemo(() => {
    return {
      all: recommendations.length,
      High: recommendations.filter((r) => r.priority === "High").length,
      Medium: recommendations.filter((r) => r.priority === "Medium").length,
      Low: recommendations.filter((r) => r.priority === "Low").length,
    };
  }, [recommendations]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-accent-600 to-teal-500 text-white shadow-glass-sm">
            <Lightbulb className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 lg:text-2xl">
              AI Infrastructure Engineering Recommendations
            </h1>
            <p className="text-xs text-slate-500">
              Correlating repetitive fleet sightings with OpenStreetMap (OSM) school zones, hospitals, &amp; hydrology
            </p>
          </div>
        </div>

        <div className="glass-panel-sm flex items-center gap-2 rounded-2xl px-3.5 py-1.5 self-start sm:self-auto">
          <Sparkles className="h-3.5 w-3.5 text-accent-600" />
          <span className="text-xs font-bold text-slate-700">Rule Engine Active</span>
        </div>
      </div>

      {/* Priority Filter Toolbar */}
      <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            Filter Priority:
          </span>

          {(["all", "High", "Medium", "Low"] as PriorityFilter[]).map((p) => {
            const count = counts[p];
            return (
              <button
                key={p}
                onClick={() => setActivePriority(p)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                  activePriority === p
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white/60 text-slate-600 hover:bg-white/90"
                )}
              >
                <span>{p === "all" ? "All Priorities" : `${p} Priority`}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                    activePriority === p
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-700"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-accent-600" />
          {filteredRecs.length} actionable engineering items
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      {filteredRecs.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-3xl border border-white/60 bg-white/40 p-6 text-center shadow-glass">
          <p className="text-sm font-semibold text-slate-500">
            No recommendations match this priority.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecs.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
