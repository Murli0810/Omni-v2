"use client";

import Link from "next/link";
import { ArrowUpRight, Lightbulb, Sparkles, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getRecommendations } from "@/lib/api";
import { RecommendationRecord } from "@/lib/types";

const priorityVariant = { High: "high", Medium: "medium", Low: "low" } as const;

export default function RecommendationsStrip() {
  const { data: recommendations = [] } = useQuery<RecommendationRecord[]>({
    queryKey: ["recommendations"],
    queryFn: getRecommendations,
  });

  const top = recommendations.slice(0, 3);

  return (
    <Card className="p-4 lg:p-5 rounded-3xl border border-white/80">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-accent-600 to-teal-400 text-white shadow-sm">
            <Lightbulb className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-extrabold text-slate-900">
                AI Infrastructure Recommendations
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Actionable municipal engineering proposals generated from fleet cluster density
            </p>
          </div>
        </div>

        <Link
          href="/recommendations"
          className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition"
        >
          View All ({recommendations.length})
          <ArrowUpRight className="h-3.5 w-3.5 text-accent-600" strokeWidth={2.25} />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {top.map((rec) => (
          <div
            key={rec.id}
            className="rounded-2xl border border-white/80 bg-white/60 p-3.5 shadow-sm transition hover:bg-white/90"
          >
            <div className="flex items-start justify-between gap-2">
              <Badge variant={priorityVariant[rec.priority]} className="text-[10px] font-bold">
                {rec.priority} Priority
              </Badge>
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-accent-600" />
                {rec.location_name?.split(",")[0] || "Jamshedpur"}
              </span>
            </div>

            <p className="mt-2 text-xs font-bold leading-snug text-slate-800 line-clamp-2">
              {rec.recommendation}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
              {rec.reason}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
