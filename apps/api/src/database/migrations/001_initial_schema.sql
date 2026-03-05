-- FixMyRoad Hyderabad - Initial schema with PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL DEFAULT 'citizen',
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE road_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  osm_way_id BIGINT NOT NULL,
  osm_road_name VARCHAR(500),
  geom GEOMETRY(LINESTRING, 4326) NOT NULL,
  start_junction_osm_id BIGINT,
  end_junction_osm_id BIGINT,
  length_m NUMERIC(10,2),
  ghmc_zone VARCHAR(100),
  quality_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(osm_way_id, start_junction_osm_id, end_junction_osm_id)
);
CREATE INDEX idx_road_segments_geom ON road_segments USING GIST(geom);

CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  road_segment_id UUID NOT NULL REFERENCES road_segments(id),
  issue_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  quality_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'reported',
  first_reported_at TIMESTAMPTZ NOT NULL,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_issues_road_segment ON issues(road_segment_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_quality_score ON issues(quality_score);
CREATE INDEX idx_issues_status_road ON issues(status, road_segment_id);

CREATE TABLE issue_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID REFERENCES issues(id),
  road_segment_id UUID NOT NULL REFERENCES road_segments(id),
  reporter_id UUID NOT NULL REFERENCES users(id),
  issue_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  photo_url VARCHAR(1024) NOT NULL,
  photo_hash VARCHAR(64) NOT NULL,
  location GEOMETRY(POINT, 4326) NOT NULL,
  exif_timestamp TIMESTAMPTZ,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_issue_reports_location ON issue_reports USING GIST(location);
CREATE INDEX idx_issue_reports_road_segment ON issue_reports(road_segment_id);
CREATE INDEX idx_issue_reports_photo_hash ON issue_reports(photo_hash);
CREATE INDEX idx_issue_reports_reported_at ON issue_reports(reported_at DESC);

CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id),
  complaint_type VARCHAR(20) NOT NULL,
  external_id VARCHAR(255),
  payload JSONB,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  filed_at TIMESTAMPTZ DEFAULT NOW(),
  last_reminder_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_complaints_one_per_issue_type ON complaints(issue_id, complaint_type);

CREATE TABLE builders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  business_name VARCHAR(255),
  registration_number VARCHAR(100),
  verified_at TIMESTAMPTZ,
  bond_balance NUMERIC(12,2) DEFAULT 0,
  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id),
  builder_id UUID NOT NULL REFERENCES builders(id),
  status VARCHAR(30) NOT NULL DEFAULT 'claimed',
  bond_amount NUMERIC(12,2),
  reward_amount NUMERIC(12,2),
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(issue_id)
);

CREATE TABLE fix_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL REFERENCES claims(id),
  before_photo_url VARCHAR(1024),
  after_photo_url VARCHAR(1024) NOT NULL,
  location GEOMETRY(POINT, 4326),
  proof_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID REFERENCES complaints(id),
  issue_id UUID REFERENCES issues(id),
  reminder_type VARCHAR(30) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_reminders_scheduled_at ON reminders(scheduled_at) WHERE sent_at IS NULL;

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  target_type VARCHAR(20) NOT NULL,
  target_id UUID NOT NULL,
  vote SMALLINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  actor_id UUID REFERENCES users(id),
  old_state JSONB,
  new_state JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
