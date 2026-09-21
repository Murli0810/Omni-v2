import { CircleMarker, Popup } from "react-leaflet";
import { DefectMaster, DefectType } from "@/lib/types";

export type { DefectType };

const typeLabels: Record<DefectType, string> = {
  pothole: "Pothole",
  damaged_road: "Damaged Road Surface",
  missing_divider: "Missing Road Divider",
  missing_zebra_crossing: "Missing Zebra Crossing",
  damaged_signboard: "Damaged Signboard",
  waterlogging: "Waterlogging",
};

// Amber = surface/structural defects, Blue = signage/markings defects.
const typeColor: Record<DefectType, string> = {
  pothole: "#D97706",
  damaged_road: "#D97706",
  waterlogging: "#0284C7",
  missing_divider: "#7C3AED",
  missing_zebra_crossing: "#2563EB",
  damaged_signboard: "#475569",
};

interface DefectMarkerProps {
  defect: DefectMaster;
}

export default function DefectMarker({ defect }: DefectMarkerProps) {
  // Normalize confidence to 0-100
  const confPercent =
    defect.confidence_score <= 1
      ? Math.round(defect.confidence_score * 100)
      : Math.round(defect.confidence_score);

  // Radius scales with sightings (deduplicated sightings) and confidence
  const radius = 7 + Math.min(defect.sighting_count, 15) * 0.8 + (confPercent - 70) * 0.08;
  const color = typeColor[defect.defect_type] || "#D97706";

  const statusColors: Record<string, string> = {
    UNVERIFIED: "bg-slate-100 text-slate-700",
    VERIFIED: "bg-emerald-100 text-emerald-800",
    REPAIR_SCHEDULED: "bg-amber-100 text-amber-800",
    RESOLVED: "bg-sky-100 text-sky-800",
  };

  return (
    <CircleMarker
      center={[defect.lat, defect.lon]}
      radius={Math.max(7, radius)}
      pathOptions={{
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: Math.min(0.85, 0.4 + (defect.sighting_count / 15) * 0.35),
      }}
    >
      <Popup>
        <div className="min-w-[210px] p-1.5">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                statusColors[defect.status] || "bg-slate-100 text-slate-700"
              }`}
            >
              {defect.status || "UNVERIFIED"}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {defect.ward || "Transit Sector"}
            </span>
          </div>

          <p className="text-sm font-bold text-slate-900">
            {typeLabels[defect.defect_type] || defect.defect_type}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {defect.location_name || `${defect.lat.toFixed(4)}, ${defect.lon.toFixed(4)}`}
          </p>

          {defect.latest_snapshot && (
            <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={defect.latest_snapshot}
                alt="Defect Snapshot"
                className="h-24 w-full object-cover"
              />
            </div>
          )}

          <div className="mt-2.5 space-y-1 border-t border-slate-100 pt-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">AI Confidence</span>
              <span className="font-semibold text-slate-800">{confPercent}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Fleet Sightings (Dedup)</span>
              <span className="rounded bg-amber-50 px-1.5 py-0.5 font-bold text-amber-700">
                {defect.sighting_count}x detected
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Last Reported</span>
              <span>
                {defect.last_seen_at
                  ? new Date(defect.last_seen_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Recent"}
              </span>
            </div>
          </div>
        </div>
      </Popup>
    </CircleMarker>
  );
}
