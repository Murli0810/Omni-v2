"use client";

import { useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { EventRecord, IncidentType } from "@/lib/types";
import { getIncidentDisplay } from "@/lib/incident-display";
import { cn } from "@/lib/utils";

const typeLabels: Record<IncidentType, string> = {
  hit_and_run: "Hit & Run Alert",
  rash_driving: "Dangerous Driving",
  pedestrian_alert: "Pedestrian Zone Risk",
};

interface IncidentMarkerProps {
  incident: EventRecord;
}

export default function IncidentMarker({ incident }: IncidentMarkerProps) {
  const customIcon = useMemo(() => {
    const html = renderToStaticMarkup(
      <div style={{ position: "relative", width: 34, height: 34 }}>
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "9999px",
            background: "#F0472B",
            opacity: 0.65,
          }}
          className="animate-pulse-ring"
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(45deg)",
            width: 16,
            height: 16,
            background: "#F0472B",
            border: "2px solid white",
            boxShadow: "0 2px 10px rgba(240,71,43,0.7)",
            borderRadius: "3px",
          }}
        />
      </div>
    );

    return L.divIcon({
      html,
      className: "incident-custom-marker",
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
  }, []);

  const display = getIncidentDisplay(incident);
  const typeLabel = typeLabels[incident.event_type as IncidentType] || incident.event_type;

  return (
    <Marker position={[incident.lat, incident.lon]} icon={customIcon}>
      <Popup>
        <div className="min-w-[220px] p-1.5">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-critical-100 px-2.5 py-0.5 text-[11px] font-bold text-critical-600">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-critical-500" />
            CRITICAL DISPATCH
          </div>

          <p className="text-sm font-extrabold text-slate-900">{typeLabel}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {incident.extra?.location_name ||
              `${incident.lat.toFixed(4)}, ${incident.lon.toFixed(4)}`}
          </p>

          <div className="mt-2.5 rounded-xl border border-critical-200 bg-critical-50/50 p-2 text-xs">
            {display.isPlateBased && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tracked Plate:</span>
                <span className="font-mono text-xs font-bold text-slate-900">{display.plateText}</span>
              </div>
            )}
            <div className={cn("flex items-center justify-between", display.isPlateBased && "mt-1")}>
              <span className="text-slate-500">{display.confidenceLabel}:</span>
              <span className="font-bold text-critical-600">{display.confidencePct}%</span>
            </div>
            {incident.extra?.vehicle_type && (
              <div className="mt-1 flex items-center justify-between">
                <span className="text-slate-500">Vehicle:</span>
                <span className="font-medium text-slate-700">
                  {incident.extra.vehicle_type}
                </span>
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Bus Unit: {incident.bus_id}</span>
            <span>
              {new Date(incident.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
