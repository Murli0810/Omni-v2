import {
  DefectMaster,
  EventRecord,
  HeatPoint,
  RecommendationRecord,
  SummaryStats,
  RouteDelay,
} from "./types";
import {
  MOCK_DEFECTS_MASTER,
  MOCK_CRITICAL_EVENTS,
  MOCK_HEATMAP,
  MOCK_RECOMMENDATIONS,
  MOCK_STATS,
  MOCK_ROUTE_DELAYS,
} from "./mock-data";

export const NEXT_PUBLIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  if (!process.env.NEXT_PUBLIC_API_BASE_URL &&
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost") {
  console.warn(
    "[Omni API] NEXT_PUBLIC_API_BASE_URL was not set at build time — " +
    "every request will hit localhost and fail. Dashboard will show mock data only."
  );
}

async function fetchWithFallback<T>(endpoint: string, fallbackData: T): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(
        `[Omni API] Request to ${endpoint} returned status ${response.status}. Using local mock data.`
      );
      return fallbackData;
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    // Network failure, connection refused, or timeout
    // Gracefully use seed data matching backend schema
    return fallbackData;
  }
}

export async function getDefectsMaster(params?: {
  type?: string;
  ward?: string;
}): Promise<DefectMaster[]> {
  const query = new URLSearchParams();
  if (params?.type && params.type !== "all") query.append("type", params.type);
  if (params?.ward && params.ward !== "all") query.append("ward", params.ward);

  const qs = query.toString() ? `?${query.toString()}` : "";
  const allDefects = await fetchWithFallback<DefectMaster[]>(
    `/api/defects/master${qs}`,
    MOCK_DEFECTS_MASTER
  );

  return allDefects.filter((d) => {
    if (params?.type && params.type !== "all" && d.defect_type !== params.type) {
      return false;
    }
    if (params?.ward && params.ward !== "all" && d.ward !== params.ward) {
      return false;
    }
    return true;
  });
}

export async function getHeatmap(): Promise<HeatPoint[]> {
  return fetchWithFallback<HeatPoint[]>("/api/heatmap", MOCK_HEATMAP);
}

export async function getEvents(params?: {
  type?: string;
  priority?: "critical" | "routine";
  since?: string;
}): Promise<EventRecord[]> {
  const query = new URLSearchParams();
  if (params?.type && params.type !== "all") query.append("type", params.type);
  if (params?.priority) query.append("priority", params.priority);
  if (params?.since) query.append("since", params.since);

  const qs = query.toString() ? `?${query.toString()}` : "";
  const events = await fetchWithFallback<EventRecord[]>(
    `/api/events${qs}`,
    MOCK_CRITICAL_EVENTS
  );

  return events.filter((e) => {
    if (params?.type && params.type !== "all" && e.event_type !== params.type) {
      return false;
    }
    if (params?.priority && e.priority !== params.priority) {
      return false;
    }
    return true;
  });
}

export async function getRecommendations(): Promise<RecommendationRecord[]> {
  return fetchWithFallback<RecommendationRecord[]>(
    "/api/recommendations",
    MOCK_RECOMMENDATIONS
  );
}

export async function getSummaryStats(): Promise<SummaryStats> {
  return fetchWithFallback<SummaryStats>("/api/stats/summary", MOCK_STATS);
}

export async function getRouteDelays(): Promise<RouteDelay[]> {
  return fetchWithFallback<RouteDelay[]>("/api/routes/delays", MOCK_ROUTE_DELAYS);
}
