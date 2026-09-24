"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Cell,
} from "recharts";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getDefectsMaster, getRouteDelays, getSummaryStats } from "@/lib/api";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Layers,
  ArrowDownRight,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DEFECT_COLORS: Record<string, string> = {
  Potholes: "#D97706",
  "Damaged Road": "#F59E0B",
  Waterlogging: "#0284C7",
  Dividers: "#7C3AED",
  "Zebra Crossing": "#2563EB",
  Signboards: "#64748B",
};

const HOURLY_DENSITY_DATA = [
  { hour: "06:00", vehicles: 120, alerts: 1 },
  { hour: "08:00", vehicles: 450, alerts: 4 },
  { hour: "10:00", vehicles: 580, alerts: 3 },
  { hour: "12:00", vehicles: 390, alerts: 2 },
  { hour: "14:00", vehicles: 340, alerts: 1 },
  { hour: "16:00", vehicles: 520, alerts: 5 },
  { hour: "18:00", vehicles: 630, alerts: 6 },
  { hour: "20:00", vehicles: 410, alerts: 2 },
];

export default function AnalyticsPage() {
  const { data: defects = [] } = useQuery({
    queryKey: ["defects_master"],
    queryFn: () => getDefectsMaster(),
  });

  const { data: routeDelays = [] } = useQuery({
    queryKey: ["route_delays"],
    queryFn: () => getRouteDelays(),
  });

  const { data: stats } = useQuery({
    queryKey: ["summary_stats"],
    queryFn: () => getSummaryStats(),
  });

  // Calculate defect counts by category
  const defectChartData = useMemo(() => {
    const counts: Record<string, number> = {
      Potholes: 0,
      "Damaged Road": 0,
      Waterlogging: 0,
      Dividers: 0,
      "Zebra Crossing": 0,
      Signboards: 0,
    };

    defects.forEach((d) => {
      if (d.defect_type === "pothole") counts["Potholes"] += d.sighting_count || 1;
      else if (d.defect_type === "damaged_road") counts["Damaged Road"] += d.sighting_count || 1;
      else if (d.defect_type === "waterlogging") counts["Waterlogging"] += d.sighting_count || 1;
      else if (d.defect_type === "missing_divider") counts["Dividers"] += d.sighting_count || 1;
      else if (d.defect_type === "missing_zebra_crossing")
        counts["Zebra Crossing"] += d.sighting_count || 1;
      else if (d.defect_type === "damaged_signboard") counts["Signboards"] += d.sighting_count || 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      sightings: count,
    }));
  }, [defects]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-glass-sm">
            <BarChart3 className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 lg:text-2xl">
              Fleet Sensing &amp; Traffic Analytics
            </h1>
            <p className="text-xs text-slate-500">
              Aggregated vehicle density, PostGIS spatial deduplication metrics, and transit bottlenecks
            </p>
          </div>
        </div>

        
      </div>

      {/* Dedup Efficiency & Metric Callouts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 rounded-3xl border border-white/80">
          <p className="text-xs font-bold text-slate-500">Raw Edge Ingestions</p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {stats?.raw_events_count ?? 462} detections
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Captured by YOLOv8s bus cameras</p>
        </Card>

        <Card className="p-4 rounded-3xl border border-white/80">
          <p className="text-xs font-bold text-slate-500">Deduplicated Master Assets</p>
          <p className="mt-1 text-2xl font-black text-accent-700">
            {stats?.deduplicated_count ?? 89} verified locations
          </p>
          <p className="mt-1 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ArrowDownRight className="h-3.5 w-3.5" /> 80.7% database clutter reduction
          </p>
        </Card>

        <Card className="p-4 rounded-3xl border border-white/80">
          <p className="text-xs font-bold text-slate-500">Transit Fleet Radius</p>
          <p className="mt-1 text-2xl font-black text-slate-900">~25m Spatial Buffer</p>
          <p className="mt-1 text-[11px] text-slate-400">Confidence increment per pass (+0.05)</p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Defect Frequency Bar Chart */}
        <Card className="p-5 rounded-3xl border border-white/80">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-extrabold text-slate-900">
                Defect Sighting Frequency by Category
              </p>
              <p className="text-xs text-slate-500">
                Weighted by multi-pass camera detections
              </p>
            </div>
            <span className="rounded-xl bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
              Structural vs Signage
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.8)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="sightings" radius={[8, 8, 0, 0]}>
                  {defectChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={DEFECT_COLORS[entry.name] || "#0EA5A0"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Vehicle Density Line Chart */}
        <Card className="p-5 rounded-3xl border border-white/80">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-extrabold text-slate-900">
                Transit Corridor Vehicle Density
              </p>
              <p className="text-xs text-slate-500">
                Hourly vehicle count vs critical risk alerts
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-accent-700">
              <TrendingUp className="h-3.5 w-3.5" />
              Peak at 18:00
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={HOURLY_DENSITY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.8)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="vehicles"
                  stroke="#0EA5A0"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#0EA5A0" }}
                  activeDot={{ r: 6 }}
                  name="Avg Vehicles / Hour"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Transit Route Delays Section */}
      <Card className="p-5 rounded-3xl border border-white/80">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-extrabold text-slate-900">
              Fleet Route Delay &amp; Bottleneck Diagnostics
            </p>
            <p className="text-xs text-slate-500">
              Monitored via bus GPS telemetry against scheduled timetables (`/api/routes/delays`)
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            Live Dispatch Feed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {routeDelays.map((route) => {
            const isDelayed = route.delay_min > 5;
            return (
              <div
                key={route.route_id}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {route.route_id}
                  </span>
                  <Badge
                    variant={isDelayed ? "critical" : "neutral"}
                    className="text-[10px] font-bold"
                  >
                    {isDelayed ? `+${route.delay_min} min delay` : "On Schedule"}
                  </Badge>
                </div>
                <p className="mt-2 text-xs font-bold text-slate-900 truncate">
                  {route.route_name}
                </p>
                <p className="mt-1 text-[11px] text-slate-500 capitalize">
                  Status: {route.status.replace("_", " ")}
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
