# FixMyRoad — Hyderabad

Crowdsourced road quality reporting platform for Hyderabad, India (OpenStreetMap + PostGIS).

## Stack

- **API**: NestJS, TypeORM, PostgreSQL + PostGIS, JWT auth
- **Web**: Next.js 14, MapLibre GL, OSM tiles
- **Shared**: `@fixmyroad/shared` types

## Quick start

### Prerequisites

- Node 20+
- Docker (for PostGIS) or local PostgreSQL with PostGIS

### 1. Database

Run PostGIS and apply the schema:

```bash
docker compose up -d postgres
# Wait for healthy, then:
docker compose exec postgres psql -U postgres -d fixmyroad -f /migrations/001_initial_schema.sql
```

Or with a local Postgres that has PostGIS:

```bash
psql -U postgres -d fixmyroad -f apps/api/src/database/migrations/001_initial_schema.sql
```

### 2. Apply migration for road import (optional)

If you will import Hyderabad roads from OSM, apply the second migration (adds partial unique index for upserts):

```bash
psql -U postgres -d fixmyroad -f apps/api/src/database/migrations/002_road_segments_osm_way_unique_for_import.sql
```

Or with Docker (from repo root): `docker compose exec -T postgres psql -U postgres -d fixmyroad < apps/api/src/database/migrations/002_road_segments_osm_way_unique_for_import.sql`

### 3. Import Hyderabad road segments (optional)

To see roads on the map, import all road segments for Hyderabad from OpenStreetMap:

```bash
npm run import:roads
```

- **First run**: Downloads road ways from Overpass API (Hyderabad bbox), saves them to `data/hyderabad-roads.geojson`, then imports into `road_segments`. No API key required.
- **Later runs**: Skips download and imports from the cached `data/hyderabad-roads.geojson` so you can re-import without re-downloading (e.g. after schema changes or to refresh DB).
- To force a fresh download: `npm run import:roads:fetch` or `npm run import:roads -- --fetch`.

The `data/` directory is gitignored; the GeoJSON cache stays local.

### 4. Install and run

```bash
npm install
npm run build -w @fixmyroad/shared
npm run dev:api   # Terminal 1 — API on :3001
npm run dev:web   # Terminal 2 — Web on :3000
```

### 5. Test

```bash
npm run test
```

E2E tests (map road click/hover) use Playwright. First time: `cd apps/web && npx playwright install`, then from repo root: `npm run test:e2e`.

## API endpoints

- `POST /auth/register` — Register
- `POST /auth/login` — Login (returns JWT)
- `GET /auth/me` — Current user (Bearer)
- `GET /roads/segment-by-point?lat=&lng=` — Snap point to road
- `GET /map/geojson?bbox=minLng,minLat,maxLng,maxLat` — Road segments GeoJSON
- `POST /reports` — Create report (Bearer + body: lat, lng, issueType, severity, photoUrl, photoHash)
- `GET /issues?claimable=true` — List claimable issues

## Environment

Copy `.env.example` to `.env` and set `JWT_SECRET`, `DB_*`, and optionally `REDIS_URL`, `S3_PUBLIC_BASE_URL`, `RECAPTCHA_SECRET`.

## Performance targets

- **Auth**: `GET /auth/me` and login/refresh &lt; 100 ms (stateless JWT).
- **Segment by point**: `GET /roads/segment-by-point?lat=&lng=` &lt; 100 ms (indexed PostGIS).
- **Map GeoJSON**: `GET /map/geojson?bbox=` &lt; 200 ms p95; use Redis cache when `REDIS_URL` is set (TTL 5 min).
- **Report submit**: `POST /reports` &lt; 500 ms to 201 (presigned S3; sync path: hash check, snap, insert, optional dedup).
- **Claimable issues**: `GET /issues?claimable=true` &lt; 300 ms p95; cursor pagination, index on `(status, road_segment_id)`.

## Phase 5 — Hardening

- Run `npm run test -w @fixmyroad/api` before deploy.
- Load test critical paths (e.g. `GET /map/geojson`, `POST /reports`) with k6 or artillery; validate p95 against targets above.
- Ensure migrations are applied in CI/CD; use `synchronize: false` in production.
