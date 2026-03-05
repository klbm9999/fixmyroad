-- Partial unique index so we can upsert OSM imports by osm_way_id when junction IDs are null.
-- Enables INSERT ... ON CONFLICT (osm_way_id) WHERE ... DO UPDATE in import script.
CREATE UNIQUE INDEX IF NOT EXISTS idx_road_segments_osm_way_id_import
  ON road_segments (osm_way_id)
  WHERE start_junction_osm_id IS NULL AND end_junction_osm_id IS NULL;
