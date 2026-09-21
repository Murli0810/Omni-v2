"use client";

import { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Flame, Filter, Layers, RefreshCw } from "lucide-react";
import DefectMarker from "./DefectMarker";
import IncidentMarker from "./IncidentMarker";
import HeatmapLayer from "./HeatmapLayer";
import { Switch } from "@/components/ui/switch";
import { DefectMaster, EventRecord, HeatPoint, DefectType } from "@/lib/types";

// Jamshedpur urban center
const CITY_CENTER: [number, number] = [22.8046, 86.2029];

interface MapInnerProps {
  defects: DefectMaster[];
  incidents: EventRecord[];
  heatmapPoints: HeatPoint[];
  isLoading?: boolean;
}

const filterOptions: { label: string; value: DefectType | "all" }[] = [
  { label: "All Defects", value: "all" },
  { label: "Potholes", value: "pothole" },
  { label: "Damaged Road", value: "damaged_road" },
  { label: "Waterlogging", value: "waterlogging" },
  { label: "Zebra Crossing", value: "missing_zebra_crossing" },
  { label: "Dividers", value: "missing_divider" },
  { label: "Signboards", value: "damaged_signboard" },
];

export default function MapInner({
  defects,
  incidents,
  heatmapPoints,
  isLoading,
}: MapInnerProps) {
  const [mapId, setMapId] = useState<string>("");

  useEffect(() => {
    // This runs on every distinct mount/remount cycle
    setMapId(`map-${Date.now()}-${Math.random()}`);
  }, []);

  const [heatmapOn, setHeatmapOn] = useState(false);
  const [selectedType, setSelectedType] = useState<DefectType | "all">("all");
  const [showIncidents, setShowIncidents] = useState(true);

  const filteredDefects = useMemo(() => {
    if (selectedType === "all") return defects;
    return defects.filter((d) => d.defect_type === selectedType);
  }, [defects, selectedType]);

  const criticalIncidents = useMemo(() => {
    if (!showIncidents) return [];
    return incidents.filter((i) => i.priority === "critical");
  }, [incidents, showIncidents]);

  if (!mapId) {
    return (
      <div className="relative h-[62vh] w-full overflow-hidden rounded-3xl border border-white/70 bg-slate-100/50 shadow-glass lg:h-[70vh] animate-pulse" />
    );
  }

  return (
    <div className="relative h-[62vh] w-full overflow-hidden rounded-3xl border border-white/70 shadow-glass lg:h-[70vh]">
      <MapContainer
        key={mapId}
        center={CITY_CENTER}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Heatmap Layer */}
        <HeatmapLayer visible={heatmapOn} points={heatmapPoints} />

        {/* Routine & Deduplicated Defects */}
        {filteredDefects.map((defect) => (
          <DefectMarker key={defect.id} defect={defect} />
        ))}

        {/* Real-Time Critical Incidents */}
        {criticalIncidents.map((incident) => (
          <IncidentMarker key={incident.id} incident={incident} />
        ))}
      </MapContainer>

      {/* Top Floating Controls Bar */}
      <div className="absolute left-3 right-3 top-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Filter Scrollable Pill */}
        <div className="pointer-events-auto glass-panel-sm flex items-center gap-1 rounded-2xl p-1.5 overflow-x-auto max-w-full">
          <span className="flex items-center gap-1 px-2 text-xs font-bold text-slate-700">
            <Filter className="h-3.5 w-3.5 text-accent-600" />
            <span className="hidden sm:inline">Filter:</span>
          </span>
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedType(opt.value)}
              className={`rounded-xl px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all ${
                selectedType === opt.value
                  ? "bg-accent-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-white/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Right Toggle Group */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="glass-panel-sm flex items-center gap-2 rounded-2xl px-3 py-1.5">
            <Flame
              className={`h-4 w-4 transition-colors ${
                heatmapOn ? "text-orange-500 animate-pulse" : "text-slate-400"
              }`}
            />
            <span className="text-xs font-semibold text-slate-700">Heatmap</span>
            <Switch
              checked={heatmapOn}
              onCheckedChange={setHeatmapOn}
              label="Toggle defect density heatmap"
            />
          </div>

          <div className="glass-panel-sm hidden items-center gap-2 rounded-2xl px-3 py-1.5 md:flex">
            <span className="h-2 w-2 rounded-full bg-critical-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-700">Incidents</span>
            <Switch
              checked={showIncidents}
              onCheckedChange={setShowIncidents}
              label="Toggle critical incident markers"
            />
          </div>
        </div>
      </div>

      {/* Floating Bottom Left Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] max-w-[240px] pointer-events-auto">
        <div className="glass-panel-sm rounded-2xl p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <Layers className="h-3 w-3 text-accent-600" />
              Sensing Map Legend
            </p>
            <span className="rounded bg-accent-50 px-1.5 py-0.5 text-[10px] font-bold text-accent-700">
              {filteredDefects.length} active
            </span>
          </div>

          <ul className="space-y-1.5 text-[11px] text-slate-600">
            <li className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-sm" />
              <span>Surface defect (Pothole, Damaged Road)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shadow-sm" />
              <span>Waterlogging / Hydrology</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-600 shadow-sm" />
              <span>Signage / Divider missing</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rotate-45 bg-critical-500 shadow-sm" />
              <span className="font-semibold text-critical-600">
                Critical Incident (Hit &amp; Run, Alert)
              </span>
            </li>
            <li className="border-t border-slate-200/60 pt-1 text-[10px] font-medium text-slate-500">
              ⚡ Marker radius expands with PostGIS dedup sighting count.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
