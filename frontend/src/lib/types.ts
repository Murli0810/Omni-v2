export type Priority = "critical" | "routine" | "High" | "Medium" | "Low";

export type DefectType =
  | "pothole"
  | "damaged_road"
  | "missing_divider"
  | "missing_zebra_crossing"
  | "damaged_signboard"
  | "waterlogging";

export type IncidentType = "hit_and_run" | "rash_driving" | "pedestrian_alert";

export type EventType = DefectType | IncidentType;

// Raw incoming sightings (events table)
export interface EventRecord {
  id: string | number;
  event_type: EventType;
  priority: "critical" | "routine";
  confidence: number;
  lat: number;
  lon: number;
  bus_id: string;
  snapshot_url?: string;
  extra?: {
    plate_text?: string;
    plate_confidence?: number;
    vehicle_type?: string;
    tracker_id?: string;
    location_name?: string;
    [key: string]: any;
  };
  created_at: string;
}

// Deduplicated defect registry (defects_master table)
export interface DefectMaster {
  id: string;
  defect_type: DefectType;
  lat: number;
  lon: number;
  confidence_score: number; // 0.0 - 1.0 or 0 - 100
  sighting_count: number;
  status: "UNVERIFIED" | "VERIFIED" | "REPAIR_SCHEDULED" | "RESOLVED";
  first_seen_at: string;
  last_seen_at: string;
  latest_snapshot?: string;
  location_name?: string;
  ward?: string;
}

// Heatmap density point
export interface HeatPoint {
  lat: number;
  lon: number;
  weight: number;
}

// Telemetry entry
export interface TelemetryRecord {
  id?: number;
  bus_id: string;
  recorded_at: string;
  vehicle_count: number;
  class_breakdown?: {
    cars?: number;
    buses?: number;
    two_wheelers?: number;
    trucks?: number;
    pedestrians?: number;
  };
  lat: number;
  lon: number;
}

// Infrastructure recommendation
export interface RecommendationRecord {
  id: string | number;
  lat: number;
  lon: number;
  recommendation: string;
  reason: string;
  priority: "High" | "Medium" | "Low";
  location_name?: string;
  created_at?: string;
}

// Summary stats
export interface SummaryStats {
  total_defects: number;
  incidents_today: number;
  active_buses: number;
  road_health_index: string;
  deduplicated_count?: number;
  raw_events_count?: number;
}

// Route delay stub
export interface RouteDelay {
  route_id: string;
  route_name: string;
  delay_min: number;
  status: "normal" | "delayed" | "heavy_congestion";
}
