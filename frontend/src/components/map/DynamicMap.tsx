"use client";

import dynamic from "next/dynamic";
import { DefectMaster, EventRecord, HeatPoint } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface DynamicMapProps {
  defects: DefectMaster[];
  incidents: EventRecord[];
  heatmapPoints: HeatPoint[];
  isLoading?: boolean;
}

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[62vh] w-full items-center justify-center rounded-3xl border border-white/60 bg-white/40 backdrop-blur-md shadow-glass lg:h-[70vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
        <p className="text-sm font-semibold text-slate-600">
          Initializing Urban GIS Sensing Canvas...
        </p>
      </div>
    </div>
  ),
});

export default function DynamicMap(props: DynamicMapProps) {
  return <MapInner {...props} />;
}
