/**
 * Import Hyderabad road segments from OpenStreetMap into road_segments.
 *
 * First run: fetches roads from Overpass API, saves to data/hyderabad-roads.geojson, then imports to DB.
 * Later runs: skips fetch if data/hyderabad-roads.geojson exists; imports from that file (no re-download).
 *
 * Usage (from repo root):
 *   npm run import:roads
 * Or from apps/api:
 *   npx ts-node -r dotenv/config scripts/import-hyderabad-roads.ts
 *
 * Requires: .env with DB_* (or defaults: localhost, postgres, fixmyroad). Loads .env from repo root.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const DATA_DIR = path.join(REPO_ROOT, 'data');
const CACHE_FILE = path.join(DATA_DIR, 'hyderabad-roads.geojson');

// Hyderabad bounding box (south, west, north, east) for Overpass
const HYDERABAD_BBOX = { south: 17.25, west: 78.25, north: 17.55, east: 78.65 };
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

interface OverpassWay {
  type: 'way';
  id: number;
  tags?: { name?: string; highway?: string };
  geometry?: { lat: number; lon: number }[];
}

interface OverpassResult {
  elements: OverpassWay[];
}

function loadEnv(): void {
  const envPath = path.join(REPO_ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) {
      const val = m[2].replace(/^["']|["']$/g, '').trim();
      process.env[m[1]] = val;
    }
  }
}

async function fetchFromOverpass(): Promise<OverpassResult> {
  const [s, w, n, e] = [HYDERABAD_BBOX.south, HYDERABAD_BBOX.west, HYDERABAD_BBOX.north, HYDERABAD_BBOX.east];
  const query = `[out:json][timeout:300];
way["highway"](${s},${w},${n},${e});
out body geom;`;
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: query,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!res.ok) throw new Error(`Overpass request failed: ${res.status} ${res.statusText}`);
  return res.json() as Promise<OverpassResult>;
}

function overpassToGeoJson(data: OverpassResult): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
  for (const way of data.elements) {
    if (way.type !== 'way' || !way.geometry?.length) continue;
    const coordinates = way.geometry.map((n) => [n.lon, n.lat] as [number, number]);
    features.push({
      type: 'Feature',
      properties: {
        osm_way_id: way.id,
        name: way.tags?.name ?? null,
      },
      geometry: { type: 'LineString', coordinates },
    });
  }
  return { type: 'FeatureCollection', features };
}

async function ensureCacheFile(forceFetch: boolean): Promise<string> {
  if (forceFetch && fs.existsSync(CACHE_FILE)) {
    console.log('Re-downloading (--fetch):', CACHE_FILE);
    fs.unlinkSync(CACHE_FILE);
  }
  if (!fs.existsSync(CACHE_FILE)) {
    console.log('Fetching roads from Overpass API (Hyderabad bbox)...');
    const data = await fetchFromOverpass();
    const geojson = overpassToGeoJson(data);
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(geojson), 'utf-8');
    console.log('Saved', geojson.features.length, 'ways to', CACHE_FILE);
  } else {
    console.log('Using cached OSM data:', CACHE_FILE);
  }
  return CACHE_FILE;
}

function getDbConfig(): { host: string; port: number; user: string; password: string; database: string } {
  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'fixmyroad',
  };
}

async function importToDb(geojsonPath: string): Promise<void> {
  const geojson: GeoJSON.FeatureCollection = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));
  const features = geojson.features as GeoJSON.Feature<GeoJSON.LineString, { osm_way_id: number; name: string | null }>[];
  if (features.length === 0) {
    console.log('No features to import.');
    return;
  }

  const client = new Client(getDbConfig());
  await client.connect();

  const table = 'road_segments';
  // Use partial unique index: (osm_way_id) WHERE start_junction_osm_id IS NULL AND end_junction_osm_id IS NULL
  const conflictTarget = 'ON CONFLICT (osm_way_id) WHERE start_junction_osm_id IS NULL AND end_junction_osm_id IS NULL';

  let imported = 0;
  for (const f of features) {
    const props = f.properties ?? {};
    const osmWayId = props.osm_way_id;
    const name = props.name ?? null;
    if (osmWayId == null || !f.geometry?.coordinates?.length) continue;

    const geomJson = JSON.stringify(f.geometry);
    const q = `
      INSERT INTO ${table} (id, osm_way_id, osm_road_name, geom, start_junction_osm_id, end_junction_osm_id, length_m, quality_score)
      VALUES (uuid_generate_v4(), $1, $3, ST_GeomFromGeoJSON($2)::geometry, NULL, NULL, ST_Length(ST_GeomFromGeoJSON($2)::geography), 0)
      ${conflictTarget}
      DO UPDATE SET
        osm_road_name = EXCLUDED.osm_road_name,
        geom = EXCLUDED.geom,
        length_m = EXCLUDED.length_m
    `;
    await client.query(q, [osmWayId, geomJson, name]);
    imported++;
    if (imported % 500 === 0) process.stdout.write(`\rImported ${imported} / ${features.length} segments...`);
  }
  console.log('\nDone. Imported', imported, 'segments.');
  await client.end();
}

async function main(): Promise<void> {
  loadEnv();
  const forceFetch = process.argv.includes('--fetch');

  const cachePath = await ensureCacheFile(forceFetch);
  console.log('Importing to database...');
  await importToDb(cachePath);
  console.log('Import complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
