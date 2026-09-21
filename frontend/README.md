# Omni — Urban Intelligence Dashboard (UI Prototype)

Smart India Hackathon 2026 · Problem Statement 26124

A UI-only prototype dashboard for municipal transport officers to visualize AI-detected
road defects, traffic incidents, and infrastructure recommendations from bus-mounted
cameras. All data shown is static placeholder content — there is no backend, API, or
environment configuration.

## Stack
React 18 + TypeScript · Vite · React Router · Tailwind CSS · react-leaflet + leaflet.heat · lucide-react

## Run locally

```bash
npm install
npm run dev
```

Then open the printed local URL (typically http://localhost:5173).

## Pages
- `/` — **Command Center Dashboard**: summary stat bar, map (2/3 width) + a live escalation
  side-panel (1/3 width) side-by-side on desktop, stacking on mobile, followed by a
  top-priority recommendations strip.
- `/escalation-feed` — Full, filterable escalation feed (all alert cards)
- `/recommendations` — Full, priority-sorted AI infrastructure recommendations

The Dashboard's side panel and strip are compact previews of the same static data used
by the two full pages (`src/data/alerts.ts`, `src/data/recommendations.ts`), so the
counts and content always stay in sync — nothing is duplicated by hand.

## Structure
```
src/
  data/                   Shared static placeholder data (alerts, recommendations)
  pages/                  Dashboard, EscalationFeed, Recommendations
  components/layout/      AppShell, Navbar, SummaryHeader
  components/map/         MapView, DefectMarker, IncidentMarker, HeatmapLayer
  components/feed/        AlertCard (full), LiveFeedPanel (dashboard preview)
  components/recommendations/  RecommendationCard (full), RecommendationsStrip (dashboard preview)
  components/ui/          Glass-styled button, card, badge, switch primitives
```

## Design system
Light-mode glassmorphism on a pastel mesh background. One saturated teal accent
(`accent-600`) drives buttons, active nav, and toggles. Red/orange (`critical-*`) is
reserved exclusively for critical incidents — never reused for routine UI — so the
distinction between a routine defect and a live incident is legible at a glance.

## Roadmap (post-MVP, per the SIH pitch deck)
The component folders are already split by concern (`map/`, `feed/`, `recommendations/`,
`ui/`) specifically so this UI can be partitioned into three dedicated dashboards later
without rewriting the underlying components:

- **Municipal & Traffic Command** — live situational map with layer controls, incident/
  enforcement audit views, congestion analytics, work-order lifecycle tracking.
- **Service Provider / Operations** — bus fleet & edge-device telemetry, a human-in-the-
  loop triage console, model drift/performance monitoring.
- **Public / Citizen Portal** — citizen hazard reporting, a public issue tracker, and a
  neighborhood safety map.

These are out of scope for the current MVP build and are not implemented here.
