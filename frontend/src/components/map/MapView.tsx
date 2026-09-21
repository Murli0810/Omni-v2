"use client";

import { useQuery } from "@tanstack/react-query";
import { getDefectsMaster, getHeatmap } from "@/lib/api";
import { EventRecord } from "@/lib/types";
import DynamicMap from "./DynamicMap";

interface MapViewProps {
  incidents?: EventRecord[];
}

export default function MapView({ incidents = [] }: MapViewProps) {
  const { data: defects = [], isLoading: defectsLoading } = useQuery({
    queryKey: ["defects_master"],
    queryFn: () => getDefectsMaster(),
    refetchInterval: 10000,
  });

  const { data: heatmap = [], isLoading: heatmapLoading } = useQuery({
    queryKey: ["heatmap"],
    queryFn: () => getHeatmap(),
    staleTime: 60000,
  });

  return (
    <DynamicMap
      defects={defects}
      incidents={incidents}
      heatmapPoints={heatmap}
      isLoading={defectsLoading || heatmapLoading}
    />
  );
}
