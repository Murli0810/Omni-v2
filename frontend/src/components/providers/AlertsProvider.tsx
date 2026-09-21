"use client";

import { createContext, ReactNode, useContext } from "react";
import { useAlertsStream, StreamState } from "@/lib/ws";

const AlertsContext = createContext<StreamState | null>(null);

export default function AlertsProvider({ children }: { children: ReactNode }) {
  const stream = useAlertsStream(); // single connection for the whole app
  return <AlertsContext.Provider value={stream}>{children}</AlertsContext.Provider>;
}

export function useAlerts(): StreamState {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error("useAlerts() must be used within <AlertsProvider>");
  return ctx;
}