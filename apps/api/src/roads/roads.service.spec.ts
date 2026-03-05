import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CacheService } from '../cache/cache.service';
import { ClaimsService } from '../claims/claims.service';
import { ComplaintsService } from '../complaints/complaints.service';
import { IssuesService } from '../issues/issues.service';
import { RoadsService } from './roads.service';

describe('RoadsService', () => {
  let service: RoadsService;
  let dataSource: { query: jest.Mock };
  let issuesService: { findByRoadSegmentId: jest.Mock };
  let complaintsService: { findByIssueIds: jest.Mock };
  let claimsService: { findByIssueIds: jest.Mock };

  const mockCache = {
    isAvailable: false,
    getMapGeoJson: jest.fn().mockResolvedValue(null),
    setMapGeoJson: jest.fn().mockResolvedValue(undefined),
  };

  const mockGeom = { type: 'LineString', coordinates: [[78.48, 17.38], [78.49, 17.39]] };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    issuesService = { findByRoadSegmentId: jest.fn().mockResolvedValue([]) };
    complaintsService = { findByIssueIds: jest.fn().mockResolvedValue([]) };
    claimsService = { findByIssueIds: jest.fn().mockResolvedValue([]) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoadsService,
        { provide: DataSource, useValue: dataSource },
        { provide: CacheService, useValue: mockCache },
        { provide: IssuesService, useValue: issuesService },
        { provide: ComplaintsService, useValue: complaintsService },
        { provide: ClaimsService, useValue: claimsService },
      ],
    }).compile();

    service = module.get<RoadsService>(RoadsService);
    jest.clearAllMocks();
  });

  describe('getGeoJsonByBbox', () => {
    it('returns features with qualityScore null when segment has no issues', async () => {
      dataSource.query.mockResolvedValue([
        { id: 'seg-1', osm_way_id: 1, osm_road_name: 'No Data Road', quality_score: null, geom: mockGeom },
      ]);

      const result = (await service.getGeoJsonByBbox(78, 17, 79, 18)) as {
        type: string;
        features: Array<{ properties: { id: string; name: string | null; qualityScore: number | null } }>;
      };

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(1);
      expect(result.features[0].properties).toMatchObject({ id: 'seg-1', name: 'No Data Road' });
      expect(result.features[0].properties.qualityScore).toBeNull();
    });

    it('returns features with numeric qualityScore when segment has issues', async () => {
      dataSource.query.mockResolvedValue([
        { id: 'seg-2', osm_way_id: 2, osm_road_name: 'Bad Road', quality_score: 0.8, geom: mockGeom },
      ]);

      const result = (await service.getGeoJsonByBbox(78, 17, 79, 18)) as {
        features: Array<{ properties: { qualityScore: number | null } }>;
      };

      expect(result.features[0].properties.qualityScore).toBe(0.8);
    });

    it('returns mix of null and numeric qualityScore across features', async () => {
      dataSource.query.mockResolvedValue([
        { id: 'seg-a', osm_way_id: 1, osm_road_name: 'A', quality_score: null, geom: mockGeom },
        { id: 'seg-b', osm_way_id: 2, osm_road_name: 'B', quality_score: 0.5, geom: mockGeom },
      ]);

      const result = (await service.getGeoJsonByBbox(78, 17, 79, 18)) as {
        features: Array<{ properties: { qualityScore: number | null } }>;
      };

      expect(result.features[0].properties.qualityScore).toBeNull();
      expect(result.features[1].properties.qualityScore).toBe(0.5);
    });
  });

  describe('getSegmentDetails', () => {
    it('returns null when segment does not exist', async () => {
      dataSource.query.mockResolvedValue([]);

      const result = await service.getSegmentDetails('non-existent');

      expect(result).toBeNull();
      expect(issuesService.findByRoadSegmentId).not.toHaveBeenCalled();
    });

    it('returns segment with issues and complaints for each issue', async () => {
      const segment = {
        id: 'seg-1',
        osmWayId: 1,
        osmRoadName: 'Main St',
        qualityScore: 0,
        lengthM: 100,
        ghmcZone: null,
      };
      dataSource.query.mockResolvedValue([segment]);
      const issues = [
        {
          id: 'issue-1',
          issueType: 'pothole',
          severity: 'moderate',
          status: 'reported',
          roadSegmentId: 'seg-1',
          firstReportedAt: new Date(),
          reports: [{ id: 'r1' }],
        },
      ];
      const complaints = [
        {
          id: 'c1',
          issueId: 'issue-1',
          complaintType: 'ghmc',
          status: 'pending',
          externalId: null,
          filedAt: new Date('2024-01-15'),
        },
      ];
      issuesService.findByRoadSegmentId.mockResolvedValue(issues);
      complaintsService.findByIssueIds.mockResolvedValue(complaints);
      claimsService.findByIssueIds.mockResolvedValue([]);

      const result = await service.getSegmentDetails('seg-1');

      expect(result).not.toBeNull();
      expect(result!.segment).toEqual(segment);
      expect(result!.issues).toHaveLength(1);
      expect(result!.issues[0].id).toBe('issue-1');
      expect(result!.issues[0].firstReportedAt).toBeDefined();
      expect(result!.issues[0].complaints).toHaveLength(1);
      expect(result!.issues[0].complaints[0]).toMatchObject({
        complaintType: 'ghmc',
        externalId: null,
        status: 'pending',
      });
      expect(result!.claimsSummary).toEqual({ totalClaimed: 0, totalFixed: 0, latestFixAt: null });
      expect(issuesService.findByRoadSegmentId).toHaveBeenCalledWith('seg-1');
      expect(complaintsService.findByIssueIds).toHaveBeenCalledWith(['issue-1']);
      expect(claimsService.findByIssueIds).toHaveBeenCalledWith(['issue-1']);
    });
  });
});
