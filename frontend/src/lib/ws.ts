"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { EventRecord } from "./types";
import { getEvents } from "./api";

export interface StreamState {
  events: EventRecord[];
  connectionStatus: "connected" | "connecting" | "polling_fallback";
  simulateEvent: (customEvent?: Partial<EventRecord>) => void;
}

export function useAlertsStream(initialEvents: EventRecord[] = []): StreamState {
  const [events, setEvents] = useState<EventRecord[]>(initialEvents);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "connecting" | "polling_fallback"
  >("connecting");

  const socketRef = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 2;

  const addNewEvent = useCallback((event: EventRecord) => {
    setEvents((prev) => {
      // Prevent duplicate IDs
      if (prev.some((e) => e.id === event.id)) return prev;
      return [{ ...event, isNew: true } as EventRecord & { isNew?: boolean }, ...prev];
    });
  }, []);

  const simulateEvent = useCallback(
    (customEvent?: Partial<EventRecord>) => {
      const plates = ["JH05 BX 9921", "JH01 CZ 4402", "JH05 KM 1883", "JH05 TL 7734"];
      const types: EventRecord["event_type"][] = ["hit_and_run", "rash_driving", "pedestrian_alert"];
      const locations = [
        "Sakchi Roundabout",
        "Bistupur Market Gate",
        "Kadma Link Road",
        "Sonari Underpass",
        "Modern English School Zone",
      ];

      const randomIndex = Math.floor(Math.random() * plates.length);
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];

      const newSimulated: EventRecord = {
        id: `sim-${Date.now()}`,
        event_type: randomType,
        priority: "critical",
        confidence: Number((0.85 + Math.random() * 0.14).toFixed(2)),
        lat: 22.8046 + (Math.random() - 0.5) * 0.03,
        lon: 86.2029 + (Math.random() - 0.5) * 0.03,
        bus_id: `Bus #${Math.floor(Math.random() * 30 + 1).toString().padStart(2, "0")}`,
        extra: {
          plate_text: plates[randomIndex],
          plate_confidence: Math.floor(85 + Math.random() * 14),
          vehicle_type: "Commercial Vehicle",
          location_name: randomLocation,
          speed_est: `${Math.floor(50 + Math.random() * 30)} km/h`,
        },
        created_at: new Date().toISOString(),
        ...customEvent,
      };

      addNewEvent(newSimulated);
    },
    [addNewEvent]
  );

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;
    let ws: WebSocket | null = null;
    let isCancelled = false;

    const wsUrl = process.env.WS_BASE_URL || "ws://localhost:8000/ws/alerts";
    if (!process.env.WS_BASE_URL &&
        typeof window !== "undefined" &&
        window.location.hostname !== "localhost") {
      console.warn(
        "[Omni WS] NEXT_PUBLIC_WS_BASE_URL is not set for this deployment — " +
        "falling back to localhost, which will fail here."
      );
    }

    const startPollingFallback = () => {
      setConnectionStatus("polling_fallback");

      // Initial fetch of critical events
      getEvents({ priority: "critical" }).then((data) => {
        if (!isCancelled && data.length > 0) {
          setEvents((prev) => {
            if (prev.length === 0) return data;
            // merge
            const map = new Map<string | number, EventRecord>();
            prev.forEach((e) => map.set(e.id, e));
            data.forEach((e) => {
              if (!map.has(e.id)) map.set(e.id, e);
            });
            return Array.from(map.values());
          });
        }
      });

      // Poll every 5 seconds per PRD specification
      pollingInterval = setInterval(async () => {
        if (isCancelled) return;
        try {
          const fresh = await getEvents({ priority: "critical" });
          if (!isCancelled && fresh.length > 0) {
            setEvents((prev) => {
              const prevIds = new Set(prev.map((e) => e.id));
              const newItems = fresh.filter((e) => !prevIds.has(e.id));
              if (newItems.length === 0) return prev;
              return [
                ...newItems.map((item) => ({ ...item, isNew: true })),
                ...prev,
              ];
            });
          }
        } catch (e) {
          // ignore polling error
        }
      }, 5000);
    };

    const connectWebSocket = () => {
      try {
        setConnectionStatus("connecting");
        ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (isCancelled) return;
          setConnectionStatus("connected");
          retryCount.current = 0;
          console.log("[Omni WS] Connected to live alert stream:", wsUrl);
        };

        ws.onmessage = (event) => {
          if (isCancelled) return;
          try {
            const data: EventRecord = JSON.parse(event.data);
            if (data && data.priority === "critical") {
              addNewEvent(data);
            }
          } catch (err) {
            console.error("[Omni WS] Failed to parse alert message", err);
          }
        };

        ws.onerror = () => {
          // Handled in onclose
        };

        ws.onclose = () => {
          if (isCancelled) return;
          if (retryCount.current < maxRetries) {
            retryCount.current += 1;
            setTimeout(connectWebSocket, 2000);
          } else {
            console.warn(
              "[Omni WS] WebSocket connection unavailable. Activating 5s polling fallback."
            );
            startPollingFallback();
          }
        };
      } catch (err) {
        startPollingFallback();
      }
    };

    connectWebSocket();

    return () => {
      isCancelled = true;
      if (ws) ws.close();
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [addNewEvent]);

  return { events, connectionStatus, simulateEvent };
}
