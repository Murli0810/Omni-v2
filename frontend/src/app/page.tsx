"use client";

import SummaryHeader from "@/components/layout/SummaryHeader";
import MapView from "@/components/map/MapView";
import LiveFeedPanel from "@/components/feed/LiveFeedPanel";
import RecommendationsStrip from "@/components/recommendations/RecommendationsStrip";
import { useAlerts } from "@/components/providers/AlertsProvider";

export default function DashboardPage() {
  const { events, connectionStatus, simulateEvent } = useAlerts();

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Top Municipal Stats Row */}
      <SummaryHeader />

      {/* Main Sensing & Real-Time Escalation Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2">
          <MapView incidents={events} />
        </div>
        <div className="lg:col-span-1">
          <LiveFeedPanel
            alerts={events}
            connectionStatus={connectionStatus}
            onSimulate={() => simulateEvent()}
          />
        </div>
      </div>

      {/* Actionable Engineering Interventions */}
      <RecommendationsStrip />
    </div>
  );
}
