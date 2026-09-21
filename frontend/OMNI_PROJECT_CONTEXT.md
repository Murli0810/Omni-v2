# Omni — Project Context (handoff doc)
Paste this at the start of a new chat, along with the two PRD files, to continue without re-explaining.

## Who I am / team setup
- Murli, B.Tech CSE, RVS College of Engineering and Technology, Jamshedpur (Tier-3 college). Full-stack dev (Next.js/React/MongoDB/Supabase), works with LangGraph/LangChain agentic systems.
- Small team: I own backend + AI/ML/edge pipeline. Teammates own frontend and the PPT.
- One teammate has a car with a dashcam — usable for real footage. College campus has real potholes, usable for live demo/testing.

## The competition
- **Smart India Hackathon (SIH) 2026**, Problem Statement **26124**: "AI-Powered Mobile Urban Intelligence Platform Using Public Transport Fleet."
- Structure: idea-submission stage now (PPT + prototype description) → if shortlisted, actual 36-hour build hackathon (**Grand Finale**) happens in **December 2026**.
- **Deadlines:** internal college-round PPT due **22 Sept 2026**; national SIH portal submission due **30 Sept 2026**. This context was written on **13 Sept 2026** — re-anchor all "days remaining" math to today's actual date when resuming.
- No live jury demo at this stage — judged on the PPT/idea alone. ~5 teams shortlisted nationally per PS.

## Full problem statement text (PS 26124)
> **Background:** Urban public transport buses traverse almost every major road in a city every day. Modern buses are increasingly equipped with multiple cameras covering the front, rear, sides, and passenger cabin. However, these cameras are primarily used for recording incidents and are not leveraged as intelligent sensing platforms. At the same time, city authorities rely on fixed CCTV cameras, manual inspections and citizen complaints to identify road defects, traffic congestion, missing infrastructure and unsafe driving behaviour. This results in delayed response, incomplete situational awareness and inefficient maintenance planning.
>
> **Description:** Develop an AI-powered onboard and centralized software platform that transforms public transport buses into mobile urban sensing units. The onboard software shall analyse video streams from multiple bus-mounted cameras to detect road defects such as potholes, damaged roads, missing road dividers, missing zebra crossings, damaged or missing traffic signboards, waterlogging and other road hazards. It shall estimate vehicle density through vehicle detection, classification and counting, identify traffic bottlenecks, and detect vulnerable pedestrian situations such as school children crossing roads. During incidents such as hit-and-run or rash driving, the system should detect and track the offending vehicle, extract the registration number with a confidence score, timestamp and GPS location, and securely share alerts with a central command system. The centralized platform shall aggregate information from the entire bus fleet, visualize events on a GIS map, generate congestion heat maps, identify infrastructure deficiencies, analyse origin-destination traffic patterns, estimate route delays and provide actionable insights for transport authorities.
>
> **Expected Solution:** The solution should provide an edge-AI onboard processing framework integrated with a centralized urban intelligence platform. It should generate reliable alerts, GIS-based dashboards, road condition maps, traffic analytics and incident reports to support proactive road maintenance, improved traffic management, enhanced public safety and evidence-based decision making while minimizing bandwidth through intelligent edge processing.

## Current plan (as of this handoff)
1. **Project name: Omni.**
2. **Goal right now: a ready-to-use MVP good enough for the SIH submission (PPT + prototype), built on the calendar below. The rest of the system (production hardening, real-user pilot, advanced analytics) gets completed *after* submission**, not before it.
3. **Rebuilding the CV pipeline from scratch** — the first working slice (repo: `github.com/Murli0810/Omni-b`) had a working end-to-end pipeline, but the CV models (generic `yolov8n`, under-trained pothole detector) were too inaccurate to trust in a demo.
4. **On hold, not active:** an earlier plan to pursue a real municipal pilot (JUSCO/JNAC) before the December Grand Finale was considered and then paused in favor of focusing on the submission-ready MVP first. Two outreach emails were drafted for that plan (one to JUSCO framed around road-defect detection, one to JNAC framed around public-transport sensing) but were **not sent**. Worth revisiting after the 30 Sept submission if there's still runway before December, but it is not part of the current build scope or timeline.
5. Useful local nuance if the pilot idea comes back: **Jamshedpur has no elected municipal corporation.** Roads (~524km) and most infra in the Tata lease area are maintained by **JUSCO** (Tata Steel subsidiary); **JNAC** (Jamshedpur Notified Area Committee) covers the rest of the city plus things like bus stands.

## Architecture (unchanged from before the pivot — still the target stack)
**Backend & Cloud** (owned by me):
- FastAPI (Python 3.11+), Supabase (Postgres + PostGIS extension — already know Supabase from another project, BOB), Supabase Storage for evidence images, FastAPI native WebSocket for real-time push (no MQTT/Celery — explicitly deferred to post-submission/Grand-Finale scope), Railway for hosting (not Render — free-tier cold starts caused a real failure risk).
- CV/edge: YOLOv8s (upgraded from `n` for accuracy), ByteTrack, EasyOCR — retraining the pothole detector with more/better data.
- Core differentiators: **dual-path dispatch** (critical safety events like hit-and-run bypass batching and push instantly via WebSocket; routine defects go through batch/heatmap pipeline) and **geospatial deduplication** (repeat sightings of the same defect within ~25m merge into one record with a rising confidence score, via PostGIS `ST_DWithin`, instead of duplicate rows).

**Frontend** (owned by teammates):
- Next.js (App Router), Tailwind + shadcn/ui, Leaflet via `react-leaflet` (chosen over MapLibre for faster setup), TanStack Query, native WebSocket client with polling fallback, Recharts for charts.
- Core screens: map with defect/incident markers styled by confidence, heatmap toggle layer, a live Incident Escalation Feed panel, infra recommendation cards, summary stats header. Must be responsive/phone-usable.
- Mobile requirement (from a professor, for the internal round): solved via **PWA** (installable manifest) rather than a separate native app.

---

## What has to be built for the submission-ready MVP, and how

This is the Tier-1 scope from the two PRD files, consolidated. Full detail (schemas, endpoints, component tree, day-by-day calendar) lives in `BACKEND_CLOUD_PRD.md` and `FRONTEND_PRD.md` — this is the punch list.

### Backend & Cloud (Murli)
| Build | How |
|---|---|
| Supabase project + schema | Enable PostGIS extension; create `devices`, `events`, `defects_master`, `telemetry`, `recommendations` tables (full SQL in the backend PRD) |
| Event ingestion API | `POST /api/events` (defects/incidents) and `POST /api/telemetry` (periodic vehicle counts) in FastAPI, with Pydantic validation |
| Geospatial dedup | `ST_DWithin` query (~25m radius) + confidence-score bump on repeat sightings of the same defect type; write once as `dedup.py`, call it from the events endpoint |
| Dual-path dispatch | Tag events `critical` vs `routine` by type; critical events broadcast immediately over a FastAPI WebSocket (`/ws/alerts`) in addition to being stored |
| Read endpoints | `GET /api/defects/master`, `GET /api/heatmap`, `GET /api/events`, `GET /api/recommendations`, `GET /api/stats/summary` |
| Recommendation engine | Port the already-working `school_proximity.py` OSM-proximity logic from the old repo into `recommendations.py` |
| Retrained CV models | Re-train the pothole detector with more data; swap vehicle/pedestrian detection from `yolov8n` to `yolov8s` for accuracy; re-point edge scripts (`pothole_live.py`, `vehicle_density.py`, `pedestrian_zone.py`, `incident_detection.py`) at the new API contract |
| Deployment | Host on Railway (not Render); confirm no cold-start failure before any demo |

### Frontend (teammates)
| Build | How |
|---|---|
| Project scaffold | Next.js (App Router) + Tailwind + shadcn/ui + `react-leaflet` + TanStack Query |
| Map view | Leaflet map with markers from `GET /api/defects/master`, styled by `confidence_score`/`sighting_count` |
| Heatmap layer | `leaflet.heat` plugin wired to `GET /api/heatmap`, toggleable |
| Incident Escalation Feed | Side panel subscribed to `/ws/alerts` (or polling `GET /api/events?priority=critical` every 5s as fallback), visibly distinct styling for critical alerts |
| Recommendation cards | List view of `GET /api/recommendations` |
| Summary header | Stat bar wired to `GET /api/stats/summary` |
| Responsive/PWA | Test at phone width throughout; add `manifest.json` + basic service worker so it's installable |

### Shared
- Freeze the API contract (see either PRD's "API contract" table) before frontend builds far ahead of it — get one real event flowing end-to-end (edge → backend → map marker) within the first few days, don't build both sides against mocks for long.
- Do one full dry run of the demo setup at least 2 days before the PPT deadline; freeze feature work after that and switch to polish/rehearsal.

### Explicitly not in this scope (build after submission)
Missing-asset spatial-diff engine, full origin-destination flow matrix, MQTT/Celery/offline buffer, DPDP-grade redaction/retention pipeline, HITL verification queue, citizen portal, and the municipal pilot outreach — all documented as future scope in the PPT, not built now.
