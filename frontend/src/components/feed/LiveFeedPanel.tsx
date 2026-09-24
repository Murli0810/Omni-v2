"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  AlertOctagon,
  Zap,
  PersonStanding,
  Radio,
  PlusCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getIncidentDisplay } from "@/lib/incident-display";

interface LiveFeedPanelProps {
  alerts: EventRecord[];
  connectionStatus?: "connected" | "connecting" | "polling_fallback";
  onSimulate?: () => void;
}

const eventMeta: Record<string, { label: string; icon: any; tint: string }> = {
  hit_and_run: { label: "Hit & Run", icon: AlertOctagon, tint: "text-critical-600 bg-critical-50" },
  rash_driving: { label: "Rash Driving", icon: Zap, tint: "text-amber-600 bg-amber-50" },
  pedestrian_alert: { label: "Pedestrian Risk", icon: PersonStanding, tint: "text-purple-600 bg-purple-50" },
};

export default function LiveFeedPanel({
  alerts,
  connectionStatus = "connected",
  onSimulate,
}: LiveFeedPanelProps) {
  const latest = alerts.slice(0, 6);

  return (
    <Card className="flex h-[62vh] flex-col p-4 lg:h-[70vh] lg:p-5 rounded-3xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-extrabold text-slate-900">
              Escalation Feed
            </p>
          </div>
          <p className="text-xs text-slate-500">Live dual-path dispatch stream</p>
        </div>

        <div className="flex items-center gap-1.5">
          {onSimulate && (
            <button
              onClick={onSimulate}
              title="Trigger simulated live critical event for demo presentation"
              className="inline-flex items-center gap-1 rounded-xl bg-accent-50 hover:bg-accent-100 px-2 py-1 text-[11px] font-semibold text-accent-700 transition"
            >
              <PlusCircle className="h-3 w-3" />
              Test Dispatch
            </button>
          )}
        </div>
      </div>

      {/* Alert items list */}
      <div className="mt-3 flex-1 space-y-2.5 overflow-y-auto pr-1">
        {latest.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-4 text-slate-400">
            <p className="text-xs font-semibold">No critical escalations pending</p>
            <p className="text-[11px] mt-1">Dual-path dispatch monitoring all transit units...</p>
          </div>
        ) : (
          latest.map((alert: any) => {
            const meta = eventMeta[alert.event_type] || { label: alert.event_type, icon: AlertOctagon, tint: "text-slate-600 bg-slate-50" };
            const Icon = meta.icon;
            const display = getIncidentDisplay(alert);

            const timeFormatted = alert.created_at
              ? new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Just now";

            return (
              <div
                key={alert.id}
                className={cn(
                  "rounded-2xl border border-white/80 bg-white/60 p-3 shadow-sm transition-all hover:bg-white/90",
                  alert.isNew && "animate-glow-border border-critical-400/50 bg-critical-50/30"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-bold",
                      meta.tint
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                    {meta.label}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {timeFormatted}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {display.isPlateBased ? (
                      <span className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-xs font-bold text-amber-300">
                        {display.plateText}
                      </span>
                    ) : (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                        No plate
                      </span>
                    )}
                    <Badge variant="neutral" className="py-0.5 text-[10px]">
                      {display.confidencePct}% {display.isPlateBased ? "OCR" : "Detection"}
                    </Badge>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{alert.bus_id}</span>
                </div>

                <p className="mt-1.5 text-[11px] text-slate-500 truncate">
                  {alert.extra?.location_name || `${alert.lat?.toFixed(4)}, ${alert.lon?.toFixed(4)}`}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Footer view all link */}
      <Link
        href="/escalation-feed"
        className="mt-3 flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-bold text-accent-700 bg-accent-50/80 hover:bg-accent-100 transition-colors"
      >
        View Full Escalation Center ({alerts.length})
        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.25} />
      </Link>
    </Card>
  );
}
