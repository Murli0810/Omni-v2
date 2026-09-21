import {
  MapPin,
  PersonStanding,
  ShieldAlert,
  Waves,
  TrafficCone,
  Milestone,
  SignpostBig,
  Construction,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RecommendationRecord } from "@/lib/types";

const priorityVariant = {
  High: "high",
  Medium: "medium",
  Low: "low",
} as const;

const iconTint: Record<string, string> = {
  High: "bg-critical-100 text-critical-600 border border-critical-200",
  Medium: "bg-amber-100 text-amber-700 border border-amber-200",
  Low: "bg-accent-100 text-accent-700 border border-accent-200",
};

function getIconForRecommendation(recText: string) {
  const lower = recText.toLowerCase();
  if (lower.includes("pedestrian") || lower.includes("school") || lower.includes("speed breaker"))
    return PersonStanding;
  if (lower.includes("drainage") || lower.includes("waterlog") || lower.includes("culvert"))
    return Waves;
  if (lower.includes("signal") || lower.includes("enforcement") || lower.includes("anpr"))
    return ShieldAlert;
  if (lower.includes("median") || lower.includes("divider")) return Milestone;
  if (lower.includes("signboard") || lower.includes("sign")) return SignpostBig;
  if (lower.includes("resurfacing") || lower.includes("asphalt")) return TrafficCone;
  return Construction;
}

export default function RecommendationCard({ rec }: { rec: RecommendationRecord }) {
  const Icon = getIconForRecommendation(rec.recommendation);
  const variant = priorityVariant[rec.priority] || "medium";

  return (
    <Card className="flex flex-col justify-between gap-3 p-4 lg:p-5 rounded-3xl transition-all hover:shadow-glass duration-200 border-white/70">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
              iconTint[rec.priority] || iconTint.Medium
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <Badge variant={variant} className="text-xs px-2.5 py-0.5 font-bold">
            {rec.priority} Priority
          </Badge>
        </div>

        <div className="mt-3">
          <p className="text-[15px] font-bold leading-snug text-slate-900">
            {rec.recommendation}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
            💡 <span className="font-semibold text-slate-700">Root Cause:</span> {rec.reason}
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5 font-medium truncate">
          <MapPin className="h-3.5 w-3.5 text-accent-600 shrink-0" strokeWidth={2} />
          {rec.location_name || `${rec.lat.toFixed(4)}, ${rec.lon.toFixed(4)}`}
        </span>
        <span className="text-[11px] text-slate-400 font-mono">
          AI-OSM Engine
        </span>
      </div>
    </Card>
  );
}
