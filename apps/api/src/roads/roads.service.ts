import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CacheService } from '../cache/cache.service';
import { ClaimsService } from '../claims/claims.service';
import { ComplaintsService } from '../complaints/complaints.service';
import { IssuesService } from '../issues/issues.service';

export interface SegmentByPointResult {
  id: string;
  osmWayId: number;
  osmRoadName: string | null;
  qualityScore: number;
  lengthM: number | null;
  ghmcZone: string | null;
}

export interface ComplaintSummary {
  complaintType: string;
  externalId: string | null;
  filedAt: string;
  status: string;
}

export interface IssueSummary {
  id: string;
  issueType: string;
  severity: string;
  status: string;
  firstReportedAt: string;
  complaints: ComplaintSummary[];
}

export interface ClaimsSummary {
  totalClaimed: number;
  totalFixed: number;
  latestFixAt: string | null;
}

export interface SegmentDetailsResult {
  segment: SegmentByPointResult;
  issues: IssueSummary[];
  claimsSummary: ClaimsSummary;
}

@Injectable()
export class RoadsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly cache: CacheService,
    private readonly issuesService: IssuesService,
    private readonly complaintsService: ComplaintsService,
    private readonly claimsService: ClaimsService,
  ) {}

  async findSegmentByPoint(lat: number, lng: number): Promise<SegmentByPointResult | null> {
    const result = await this.dataSource.query<SegmentByPointResult[]>(
      `
      SELECT id, osm_way_id AS "osmWayId", osm_road_name AS "osmRoadName",
             COALESCE(quality_score::float, 0) AS "qualityScore",
             length_m::float AS "lengthM", ghmc_zone AS "ghmcZone"
      FROM road_segments
      WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, 50)
      ORDER BY ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography)
      LIMIT 1
      `,
      [lat, lng],
    );
    return result[0] ?? null;
  }

  async getSegmentById(id: string): Promise<SegmentByPointResult | null> {
    const result = await this.dataSource.query<SegmentByPointResult[]>(
      `SELECT id, osm_way_id AS "osmWayId", osm_road_name AS "osmRoadName",
              COALESCE(quality_score::float, 0) AS "qualityScore",
              length_m::float AS "lengthM", ghmc_zone AS "ghmcZone"
       FROM road_segments WHERE id = $1`,
      [id],
    );
    return result[0] ?? null;
  }

  async getGeoJsonByBbox(minLng: number, minLat: number, maxLng: number, maxLat: number) {
    const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;
    if (this.cache.isAvailable) {
      const cached = await this.cache.getMapGeoJson(bbox);
      if (cached) return cached;
    }
    const rows = await this.dataSource.query(
      `
      SELECT rs.id, rs.osm_way_id, rs.osm_road_name,
             ST_AsGeoJSON(ST_Transform(rs.geom, 4326))::json AS geom,
             agg.normalized_score AS quality_score
      FROM road_segments rs
      LEFT JOIN (
        SELECT i.road_segment_id,
               (SUM(
                 CASE i.severity
                   WHEN 'severe' THEN 3
                   WHEN 'moderate' THEN 2
                   ELSE 1
                 END
                 * EXP(-0.05 * EXTRACT(DAY FROM (NOW() - i.first_reported_at))::numeric)
               ) / NULLIF(COUNT(*)::numeric * 3, 0))::float AS normalized_score
        FROM issues i
        WHERE i.status NOT IN ('verified', 'closed')
        GROUP BY i.road_segment_id
      ) agg ON rs.id = agg.road_segment_id
      WHERE rs.geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
      LIMIT 500
      `,
      [minLng, minLat, maxLng, maxLat],
    );
    const features = rows.map(
      (r: {
        id: string;
        geom: { type: string; coordinates: number[][] };
        quality_score: number | null;
        osm_road_name: string | null;
      }) => ({
        type: 'Feature',
        properties: {
          id: r.id,
          qualityScore: r.quality_score == null ? null : Number(r.quality_score),
          name: r.osm_road_name,
        },
        geometry: r.geom,
      }),
    );
    const geojson = { type: 'FeatureCollection' as const, features };
    if (this.cache.isAvailable) await this.cache.setMapGeoJson(bbox, geojson);
    return geojson;
  }

  async getSegmentDetails(segmentId: string): Promise<SegmentDetailsResult | null> {
    const segment = await this.getSegmentById(segmentId);
    if (!segment) return null;
    const issues = await this.issuesService.findByRoadSegmentId(segmentId);
    const issueIds = issues.map((i) => i.id);
    const [complaints, claims] = await Promise.all([
      this.complaintsService.findByIssueIds(issueIds),
      this.claimsService.findByIssueIds(issueIds),
    ]);
    const complaintsByIssueId = complaints.reduce<Record<string, ComplaintSummary[]>>((acc, c) => {
      const id = c.issueId;
      if (!acc[id]) acc[id] = [];
      acc[id].push({
        complaintType: c.complaintType,
        externalId: c.externalId ?? null,
        filedAt: c.filedAt instanceof Date ? c.filedAt.toISOString() : String(c.filedAt),
        status: c.status,
      });
      return acc;
    }, {});
    const totalClaimed = claims.length;
    const fixedClaims = claims.filter((c): c is typeof c & { completedAt: Date } => c.completedAt != null);
    const totalFixed = fixedClaims.length;
    const latestFixAt =
      fixedClaims.length > 0
        ? Math.max(
            ...fixedClaims.map((c) =>
              c.completedAt instanceof Date ? c.completedAt.getTime() : new Date(c.completedAt).getTime(),
            ),
          )
        : null;
    return {
      segment,
      issues: issues.map((issue) => ({
        id: issue.id,
        issueType: issue.issueType,
        severity: issue.severity,
        status: issue.status,
        firstReportedAt:
          issue.firstReportedAt instanceof Date ? issue.firstReportedAt.toISOString() : String(issue.firstReportedAt),
        complaints: complaintsByIssueId[issue.id] ?? [],
      })),
      claimsSummary: {
        totalClaimed,
        totalFixed,
        latestFixAt: latestFixAt != null ? new Date(latestFixAt).toISOString() : null,
      },
    };
  }
}
