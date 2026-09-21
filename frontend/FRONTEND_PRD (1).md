# Omni — Frontend PRD
**Owner:** Frontend teammates · **Scope:** Municipal dashboard + mobile-accessible view
**Deadline:** PPT-ready working slice by 20 Sept 2026 (2-day buffer before 22 Sept submission)

**Read this before writing any code:** the backend team is building against a fixed API contract (Section 5 below). Build against real endpoints as early as possible instead of mocked JSON — the biggest risk on a 9-day timeline is discovering integration bugs on day 8. Aim to have one real event flowing backend → your map by day 3.

---

## 1. What this dashboard needs to prove to judges

Not a polished production app — a **working demonstration** that the system can:
1. Show road defects and traffic density on a live map.
2. Distinguish a routine issue (pothole) from an urgent one (hit-and-run) — visually, instantly, without the viewer having to dig for it.
3. Turn raw detections into a human-readable "do this" recommendation.
4. Be usable from a phone, since that's what a municipal officer would actually reach for in the field (this also satisfies the "mobile app" requirement — see Section 7).

---

## 2. Tech stack (optimized for speed, not for scale)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router)** | Team likely already knows it |
| Styling | **Tailwind CSS + shadcn/ui** | Pre-built accessible components — don't hand-roll buttons/cards/dialogs this week |
| Map | **Leaflet.js via `react-leaflet`** (not MapLibre) | MapLibre is more powerful but has a steeper setup curve. Leaflet + `react-leaflet` gets markers and a heatmap layer (`leaflet.heat`) on screen fastest — that's what matters in 9 days |
| Data fetching | **TanStack Query** | Handles polling/refetching/loading states with minimal boilerplate — important since some data will be near-real-time |
| Real-time | **Native browser `WebSocket`** to `/ws/alerts` | No extra library needed; if it's not ready in time, fall back to polling `GET /api/events?priority=critical` every 5s — functionally identical from a demo standpoint |
| Charts | **Recharts** | Simple declarative API, enough for bar/line charts of defect counts and vehicle density |
| State | **Zustand** (only if needed) | Use React state/context first; only reach for Zustand if prop-drilling actually becomes a problem |

---

## 3. Feature list (tiered — build in this order)

### Tier 1 — Must work live in the demo
- [ ] **Map view** with live markers for defects (from `/api/defects/master`) and incidents
- [ ] **Marker styling by confidence/type** — e.g. size or color intensity scales with `confidence_score`/`sighting_count`, so a judge can visually see "this pothole has been confirmed 6 times"
- [ ] **Heatmap toggle layer** for vehicle density (from `/api/heatmap`)
- [ ] **Incident Escalation Feed** — a persistent side panel that flashes/highlights new critical events in real time (from WebSocket or polling), showing plate crop, OCR text + confidence, GPS, timestamp
- [ ] **Recommendation cards** — list view of `/api/recommendations`, plain-language ("Install speed breaker near X School — 5 pedestrian-risk alerts recorded")
- [ ] **Summary header** — total defects, incidents today, active buses (from `/api/stats/summary`)
- [ ] **Responsive layout** that works on a phone screen, not just desktop

### Tier 2 — Build if Tier 1 is solid by day 6 (19 Sept)
- [ ] Filter/search by defect type, ward, or time range
- [ ] Simple analytics panel (Recharts bar chart: defect counts by type; line chart: vehicle density over the demo window)
- [ ] Before/after or verification-status badges on defect cards

### Tier 3 — Documented only, not built (say so plainly in the PPT)
- Full HITL verification queue UI (approve/reject/reclassify)
- Citizen portal (public-facing upload + ticket tracker)
- Route delay visualization (backend endpoint is a stub anyway)

---

## 4. Pages & components

```
app/
├── layout.tsx                     # Shell: header, nav, summary bar
├── page.tsx                        # Main dashboard (map + feed + recommendations)
└── (routes as needed for Tier 2)

components/
├── map/
│   ├── MapView.tsx                  # Leaflet map wrapper
│   ├── DefectMarker.tsx               # Marker with confidence-based styling
│   ├── IncidentMarker.tsx              # Distinct marker style for critical events
│   └── HeatmapLayer.tsx                 # leaflet.heat integration
├── feed/
│   ├── EscalationFeed.tsx                # Live-updating critical alert panel
│   └── AlertCard.tsx                      # Single alert: plate crop, OCR text, GPS, timestamp
├── recommendations/
│   └── RecommendationCard.tsx              # Single infra suggestion
├── layout/
│   ├── SummaryHeader.tsx                    # Top stat bar
│   └── Sidebar.tsx                           # Nav / filters (Tier 2)
└── ui/                                        # shadcn components as needed

lib/
├── api.ts                                      # Typed fetch functions for every endpoint in Section 5
└── ws.ts                                        # WebSocket connection + reconnect handling
```

---

## 5. API contract (identical to the backend PRD — this is your source of truth)

| Method | Path | Returns | Used by |
|---|---|---|---|
| `GET` | `/api/defects/master?type=&ward=` | `[{id, defect_type, lat, lon, confidence_score, sighting_count, status, latest_snapshot}]` | Map markers |
| `GET` | `/api/heatmap` | `[{lat, lon, weight}]` | Heatmap layer |
| `GET` | `/api/events?type=&priority=&since=` | `[{id, event_type, priority, confidence, lat, lon, bus_id, snapshot_url, extra, created_at}]` | Escalation feed history |
| `GET` | `/api/recommendations` | `[{lat, lon, recommendation, reason, priority}]` | Recommendation cards |
| `GET` | `/api/stats/summary` | `{total_defects, incidents_today, active_buses, ...}` | Summary header |
| `GET` | `/api/routes/delays` | `[]` (stub, Tier 2) | Not needed for Tier 1 |
| `WS` | `/ws/alerts` | Streams objects shaped like a single `events` row, `priority: "critical"` only | Escalation feed live updates |

**Do not build against mock data for more than 1–2 days.** Confirm the actual deployed backend URL with Murli on day 0 and point `lib/api.ts` at it immediately — even before every endpoint is finished, so you catch shape mismatches early instead of on integration day.

---

## 6. Day-by-day plan (13 → 22 September)

| Day | Date | Task |
|---|---|---|
| 0 | 13 Sep (today) | Read this PRD + the API contract. Scaffold Next.js project, install Tailwind/shadcn/react-leaflet/TanStack Query. Get backend's deployed URL. |
| 1 | 14 Sep | Build layout shell (header, summary bar, map container). Get a basic Leaflet map rendering with hardcoded test markers. |
| 2 | 15 Sep | Wire `GET /api/defects/master` to real markers as soon as backend ships it (their Day 2). Style markers by confidence. |
| 3 | 16 Sep | Add the heatmap layer wired to `/api/heatmap`. |
| 4 | 17 Sep | Build the Escalation Feed panel. Wire to WebSocket if backend's ready; otherwise poll `/api/events?priority=critical` every 5s as a fallback — swap later, don't block on it. |
| 5 | 18 Sep | Build recommendation cards + summary header, wired to their respective endpoints. |
| 6 | 19 Sep | **Integration day** — full join with backend, fix any contract mismatches together. |
| 7 | 20 Sep | Full dry run with real edge → backend → frontend flow. Fix responsive/mobile issues. Add PWA manifest (Section 7). |
| 8 | 21 Sep | Polish pass, record backup demo video. |
| 9 | 22 Sep | Submit PPT. |

---

## 7. Satisfying the "mobile app" requirement without building a second app

Don't build a native app — there's no time and it duplicates the backend work for no PS-required reason. Instead:
1. Add a `manifest.json` + basic service worker to make the existing Next.js dashboard an installable **PWA**. This alone lets you demo "install to home screen" on a phone.
2. Confirm the layout is genuinely usable at phone width (test in Chrome DevTools device mode throughout, not just at the end) — this matters more for the demo than the PWA wrapper itself.
3. If there's spare time in the buffer days, wrapping the same frontend in **Capacitor** produces an installable APK from the same codebase with no new logic — only attempt this if Tier 1 is fully done and stable first.

---

## 8. Definition of done (for the demo, not for production)

- Opening the dashboard shows live markers within a few seconds of an edge script firing an event — no manual refresh needed.
- A staged critical incident visibly and immediately distinguishes itself in the UI (color, sound, animation — something) from routine defect markers, without the presenter having to point it out and explain "imagine this flashed red."
- The dashboard is legible and usable on a phone screen, not just scaled-down desktop.
- If the WebSocket isn't finished in time, the polling fallback still delivers the same visible effect within ~5 seconds — the demo should never depend on a feature that might fail silently.
