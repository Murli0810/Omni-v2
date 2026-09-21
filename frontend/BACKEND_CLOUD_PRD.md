# Omni — Backend & Cloud PRD
**Owner:** Murli · **Scope:** Edge ingestion API, database, geospatial dedup, real-time dispatch, deployment
**Deadline:** PPT-ready working slice by 20 Sept 2026 (2-day buffer before 22 Sept submission)

---

## 1. Why we're rebuilding this part

The previous MVP's CV models (generic YOLOv8n for vehicles/pedestrians, an under-trained pothole model) are too inaccurate to trust in a live demo. This rebuild keeps the parts that worked (FastAPI, the OSM recommendation logic) and fixes three structural gaps the last version didn't have time for:

1. **No dual-path dispatch** — critical safety events and routine defects were treated identically.
2. **No deduplication** — the same pothole seen 10 times created 10 rows instead of one growing-confidence asset.
3. **No real-time push** — the frontend would have had to poll everything, including incidents that need to feel instant.

This PRD fixes those three things without over-building — no MQTT, no Celery, no Kubernetes. Those are legitimate *future scope* if you reach the December Grand Finale, not this week's job.

---

## 2. Tech stack (and why each choice, given 9 days)

| Layer | Choice | Why |
|---|---|---|
| API framework | **FastAPI** (Python 3.11+) | Already proven in the last MVP; async, fast to write, auto-generates OpenAPI docs your teammates can read without asking you |
| Database | **Supabase (Postgres 15 + PostGIS extension)** | You already know Supabase from BOB — zero new learning curve. PostGIS gives you *real* `ST_DWithin` geospatial dedup, not a fake haversine approximation, for the same setup effort as plain Postgres |
| Object storage | **Supabase Storage** | Same account as your DB, one less service to configure. Used for evidence snapshots and incident clips |
| Real-time push | **FastAPI native WebSocket** (`/ws/alerts`) | No extra broker needed at this scale. Frontend opens one socket, receives critical events as they happen |
| Hosting | **Railway** (not Render free tier) | Render's free tier sleeps and caused the cold-start failure risk flagged earlier. Railway's free tier doesn't sleep the same way — confirm this before demo day regardless |
| CV/edge (unchanged tools, retrained/reconfigured) | YOLOv8s (not `n`), ByteTrack, EasyOCR | Step up from `yolov8n.pt` to `yolov8s.pt` for better small-object accuracy (potholes, distant vehicles) — worth the small latency cost given accuracy was the stated problem |
| Background jobs | **APScheduler** (in-process) | For the "hourly aggregation" story — no need for Celery+Redis at demo scale. One Python thread on a timer is honestly fine here |

---

## 3. Feature list (tiered — build in this order)

### Tier 1 — Must work live in the demo
- [ ] Ingest defect/incident events from edge scripts (`POST /api/events`)
- [ ] Ingest periodic vehicle-density telemetry (`POST /api/telemetry`)
- [ ] Geospatial deduplication: repeat sightings of the same defect within ~25m merge into one record with a rising confidence score, not duplicate rows
- [ ] Dual-path dispatch: critical events (incident/rash-driving/pedestrian-danger) broadcast instantly over WebSocket *in addition to* being stored; routine events (pothole/crack/waterlogging) just get stored for batch/heatmap use
- [ ] Heatmap aggregation endpoint (grid-based vehicle density)
- [ ] Deduplicated master defect list endpoint (for map markers with confidence/sighting count)
- [ ] Infra recommendation endpoint (reuse the working `school_proximity.py` logic — this already works, don't rebuild it)
- [ ] Summary stats endpoint for the dashboard header numbers

### Tier 2 — Build if Tier 1 is solid by day 6 (19 Sept)
- [ ] Simple API key check on ingestion endpoints (not full JWT/RBAC — just enough to say "not wide open" if asked)
- [ ] `/api/routes/delays` returning real computed values instead of `[]` (needs a hardcoded route + scheduled-time table — small effort, decent payoff since it's an explicit PS line item)

### Tier 3 — Documented only, not built (say so plainly in the PPT)
- Missing-asset spatial diff engine (OSM ground-truth vs. negative detections)
- Full OD flow matrix across arbitrary zones
- MQTT/EMQX edge transport, Celery task queue, offline SQLite buffer
- DPDP-grade retention/redaction pipeline

---

## 4. System components

```
backend/
├── main.py                 # FastAPI app, route registration, WS endpoint
├── database.py              # Supabase/Postgres connection, session management
├── models.py                 # SQLAlchemy models (see schema below)
├── schemas.py                 # Pydantic request/response models
├── dedup.py                    # ST_DWithin dedup + confidence-update logic
├── dispatch.py                  # Priority routing: critical → WS broadcast, routine → store only
├── recommendations.py            # School-proximity + alert-frequency rule engine (existing logic, ported)
├── scheduler.py                    # APScheduler jobs (hourly aggregation, stale-connection cleanup)
├── ws_manager.py                    # WebSocket connection registry + broadcast helper
└── requirements.txt
```

---

## 5. Data model (Supabase / Postgres + PostGIS)

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

-- Fleet registry
CREATE TABLE devices (
    device_id      VARCHAR(64) PRIMARY KEY,
    bus_id         VARCHAR(32) NOT NULL,
    status         VARCHAR(16) DEFAULT 'ACTIVE',
    last_seen_at   TIMESTAMPTZ
);

-- Raw incoming sightings (every detection, before dedup)
CREATE TABLE events (
    id              BIGSERIAL PRIMARY KEY,
    event_type      VARCHAR(32) NOT NULL,   -- 'pothole','waterlogging','pedestrian_alert','incident', etc.
    priority        VARCHAR(16) NOT NULL,   -- 'critical' | 'routine'
    confidence      FLOAT NOT NULL,
    geom            GEOMETRY(Point, 4326) NOT NULL,
    bus_id          VARCHAR(32) NOT NULL,
    snapshot_url    TEXT,
    extra           JSONB,                  -- plate_text, plate_confidence, vehicle_type, tracker_id, etc.
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Deduplicated defect registry (this is what the map actually renders)
CREATE TABLE defects_master (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    defect_type      VARCHAR(32) NOT NULL,
    geom             GEOMETRY(Point, 4326) NOT NULL,
    confidence_score FLOAT NOT NULL,
    sighting_count   INT DEFAULT 1,
    status           VARCHAR(16) DEFAULT 'UNVERIFIED',
    first_seen_at    TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at     TIMESTAMPTZ DEFAULT NOW(),
    latest_snapshot  TEXT
);

-- Periodic low-bandwidth traffic telemetry (separate from event-triggered rows)
CREATE TABLE telemetry (
    id               BIGSERIAL PRIMARY KEY,
    bus_id           VARCHAR(32) NOT NULL,
    recorded_at      TIMESTAMPTZ NOT NULL,
    vehicle_count    INT NOT NULL,
    class_breakdown  JSONB,
    geom             GEOMETRY(Point, 4326) NOT NULL
);

-- Auto-generated infra suggestions
CREATE TABLE recommendations (
    id            SERIAL PRIMARY KEY,
    geom          GEOMETRY(Point, 4326) NOT NULL,
    recommendation TEXT NOT NULL,
    reason        TEXT,
    priority      VARCHAR(16),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_geom ON events USING GIST(geom);
CREATE INDEX idx_defects_geom ON defects_master USING GIST(geom);
CREATE INDEX idx_telemetry_geom ON telemetry USING GIST(geom);
```

**Dedup logic (in `dedup.py`, called on every routine event insert):**
1. `ST_DWithin(new_event.geom, defects_master.geom, 25)` filtered by matching `defect_type`.
2. If a match exists: `sighting_count += 1`, `confidence_score = LEAST(0.99, confidence_score + 0.05 * sighting_count)`, update `last_seen_at`/`latest_snapshot`.
3. If no match: insert a new `defects_master` row from the event.

Keep the formula simple — a real Bayesian update is future scope; what matters for the demo is that confidence visibly rises when the same pothole gets re-detected.

---

## 6. API contract (share this section verbatim with your frontend teammates)

| Method | Path | Purpose | Notes |
|---|---|---|---|
| `POST` | `/api/events` | Edge scripts submit a detection | Body: `{event_type, priority, confidence, lat, lon, bus_id, snapshot_url?, extra?}`. Critical priority also triggers a WS broadcast. |
| `POST` | `/api/telemetry` | Edge scripts submit periodic vehicle counts | Body: `{bus_id, recorded_at, vehicle_count, class_breakdown, lat, lon}` |
| `GET` | `/api/events?type=&priority=&since=` | List raw events (for the escalation feed) | |
| `GET` | `/api/defects/master?type=&ward=` | Deduplicated defect list for map markers | Includes `confidence_score`, `sighting_count` |
| `GET` | `/api/heatmap` | Grid-aggregated density for the heatmap layer | `[{lat, lon, weight}]` |
| `GET` | `/api/recommendations` | Infra suggestion cards | `[{lat, lon, recommendation, reason, priority}]` |
| `GET` | `/api/stats/summary` | Dashboard header numbers | Total defects, incidents today, active buses, etc. |
| `GET` | `/api/routes/delays` | Route delay estimates | Tier 2 — stub `[]` until built |
| `WS` | `/ws/alerts` | Real-time critical event push | Frontend subscribes once; receives JSON identical to the `events` POST body whenever a critical event lands |

---

## 7. Day-by-day plan (13 → 22 September)

| Day | Date | Task |
|---|---|---|
| 0 | 13 Sep (today) | Set up Supabase project, enable PostGIS, create all tables. Write this contract into a shared doc, send to teammates. Set up Railway deployment shell. |
| 1 | 14 Sep | Build `POST /api/events`, `POST /api/telemetry`, basic validation. Deploy and confirm no cold-start issue. |
| 2 | 15 Sep | Build `dedup.py` + `GET /api/defects/master` + `GET /api/heatmap`. Test with synthetic repeated-location events. |
| 3 | 16 Sep | Build `ws_manager.py` + `/ws/alerts` + `dispatch.py` priority routing. Test with a script firing fake critical events. |
| 4 | 17 Sep | Retrain/upgrade pothole model (more data or `yolov8s`), swap vehicle/pedestrian pipeline to `yolov8s`, re-point edge scripts at the new contract. |
| 5 | 18 Sep | Port `school_proximity.py` into `recommendations.py` + `GET /api/recommendations`. Build `GET /api/stats/summary`. |
| 6 | 19 Sep | **Integration day** — connect with frontend team, fix contract mismatches together. |
| 7 | 20 Sep | Full dry run of the phone-based demo end-to-end. Fix bugs found. |
| 8 | 21 Sep | Buffer day: polish, record a backup demo video in case live demo fails. |
| 9 | 22 Sep | Submit PPT. |

---

## 8. Definition of done (for the demo, not for production)

- A pothole shown to the camera twice from slightly different angles shows up as **one** marker with `sighting_count: 2` and a visibly higher confidence than the first sighting.
- A staged "incident" (plate held up to camera) appears on the frontend's escalation feed **within ~2 seconds**, without needing a page refresh.
- The backend survives a 10-minute idle gap before the live demo without cold-starting into silent failure.
- Every endpoint in the contract table returns real data — no endpoint the frontend calls returns an unexplained empty array unless it's explicitly marked Tier 2/3.
