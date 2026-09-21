"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { HeatPoint } from "@/lib/types";

interface HeatmapLayerProps {
  visible: boolean;
  points?: HeatPoint[];
}

export default function HeatmapLayer({ visible, points }: HeatmapLayerProps) {
  const map = useMap();
  const layerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    if (!visible) {
      if (layerRef.current && map.hasLayer(layerRef.current)) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    // Dynamically require leaflet.heat on client side
    const initHeatmap = async () => {
      try {
        if (typeof window !== "undefined") {
          await import("leaflet.heat");

          if (!isMounted) return;

          // Convert HeatPoint[] to [lat, lon, intensity]
          const heatData: [number, number, number][] =
            points && points.length > 0
              ? points.map((p) => [p.lat, p.lon, p.weight])
              : [
                  [22.8046, 86.2029, 0.95],
                  [22.8012, 86.185, 0.72],
                  [22.7975, 86.1944, 0.88],
                  [22.8104, 86.2103, 0.64],
                  [22.7935, 86.1785, 0.55],
                  [22.8067, 86.1622, 0.79],
                  [22.7889, 86.1998, 0.42],
                  [22.8151, 86.1901, 0.68],
                ];

          if (layerRef.current && map.hasLayer(layerRef.current)) {
            map.removeLayer(layerRef.current);
          }

          // @ts-ignore - leaflet.heat adds L.heatLayer
          if (typeof (L as any).heatLayer === "function") {
            const layer = (L as any).heatLayer(heatData, {
              radius: 30,
              blur: 24,
              maxZoom: 16,
              max: 1.0,
              minOpacity: 0.35,
              gradient: {
                0.2: "#38BDF8",
                0.4: "#34D399",
                0.6: "#FBBF24",
                0.8: "#FB923C",
                1.0: "#F0472B",
              },
            });

            layer.addTo(map);
            layerRef.current = layer;
          }
        }
      } catch (err) {
        console.warn("[Omni Heatmap] leaflet.heat layer load notice:", err);
      }
    };

    initHeatmap();

    return () => {
      isMounted = false;
      if (layerRef.current && map.hasLayer(layerRef.current)) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [visible, points, map]);

  return null;
}
