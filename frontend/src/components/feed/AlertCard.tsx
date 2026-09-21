import { MapPin, Clock, Bus, ScanLine, ShieldAlert, Footprints } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EventRecord, IncidentType } from "@/lib/types";

export type { IncidentType };

export type Alert = EventRecord & { isNew?: boolean };

const eventLabels: Record<string, string> = {
  hit_and_run: "Hit & Run Incident",
  rash_driving: "Rash / Dangerous Driving",
  pedestrian_alert: "Pedestrian Zone Risk",
};

const Plate_Based_Types= new Set(["hit_and_run", "rash_driving"]);

export default function AlertCard({ alert }: { alert: Alert }) {
  const isPlateBased= Plate_Based_Types.has(alert.event_type) && !!alert.extra?.plate_text;

  const timeStr = alert.created_at
    ? new Date(alert.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Just now";

  const locationName =
    alert.extra?.location_name || `${alert.lat.toFixed(4)}, ${alert.lon.toFixed(4)}`;

  const detectionConfidencePct=
      alert.confidence <= 1 ? Math.round(alert.confidence * 100) : Math.round(alert.confidence);

  return (
    <div
      className={cn(
        "glass-panel relative flex flex-col sm:flex-row gap-4 rounded-2xl p-4 transition-all duration-300",
        alert.isNew &&
          "animate-glow-border border-critical-500/50 bg-critical-50/20"
      )}
    >
      {/* Thumbnail / ANPR plate crop visualization */}
      <div className="relative h-20 w-full sm:w-28 shrink-0 overflow-hidden rounded-xl bg-slate-900 border border-slate-700/60 shadow-inner flex flex-col justify-between p-2">
        <div className="flex items-center justify-between text-slate-400">
          {isPlateBased ? (
            <>
              <ScanLine className="h-4 w-4 text-accent-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase text-slate-400">ANPR Cam</span>
            </>
          ) : (
            <>
              <Footprints className="h-4 w-4 text-accent-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase text-slate-400">Zone Cam</span>
            </>
          )}
        </div>
        {isPlateBased ? (
          <div className="rounded bg-black/80 px-2 py-1 text-center font-mono text-xs font-extrabold tracking-wider text-amber-400 border border-amber-400/30">
            {alert.extra!.plate_text}
          </div>
        ) : (
          <div className="rounded bg-black/80 px-2 py-1 text-center font-mono text-[10px] font-semibold tracking-wide text-slate-300 border border-slate-600/30">
            No plate — pedestrian event
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="critical">
              <ShieldAlert className="mr-1 h-3 w-3" />
              {eventLabels[alert.event_type] || alert.event_type}
            </Badge>
            {alert.isNew && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-critical-600 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-critical-500" />
                Live Dispatch
              </span>
            )}
          </div>

          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeStr}
          </span>
        </div>

        <div className="mt-2 text-sm text-slate-700">
          {isPlateBased ? (
            <>
              Plate read <span className="font-mono font-bold text-slate-900">{alert.extra!.plate_text}</span> with{" "}
              <span className="font-bold text-critical-600">{alert.extra?.plate_confidence ?? detectionConfidencePct}%</span> OCR confidence
              {alert.extra?.speed_est && (
                <span className="ml-1 text-xs text-slate-500">(Est. {alert.extra.speed_est})</span>
              )}
            </>
          ) : (
            <>
              Pedestrian detected in high-risk crossing zone with{" "}
              <span className="font-bold text-critical-600">{detectionConfidencePct}%</span> detection confidence
            </>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-accent-600" strokeWidth={2} />
            {locationName}
          </span>
          <span className="flex items-center gap-1">
            <Bus className="h-3.5 w-3.5 text-sky-600" strokeWidth={2} />
            {alert.bus_id}
          </span>
          {alert.extra?.vehicle_type && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
              {alert.extra.vehicle_type}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
