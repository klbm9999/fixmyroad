import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '../cache/cache.service';
import { IssuesService } from '../issues/issues.service';
import { RoadsService } from '../roads/roads.service';
import { IssueReport } from './entities/issue-report.entity';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let reportRepo: Repository<IssueReport>;
  let roadsService: RoadsService;
  let issuesService: IssuesService;

  const mockCache = { isAvailable: false, isPhotoHashSeen: jest.fn().mockResolvedValue(false), setPhotoHashSeen: jest.fn().mockResolvedValue(undefined) };

  const mockSegment = { id: 'seg-1', osmWayId: 1, osmRoadName: 'Main St', qualityScore: 0, lengthM: 100, ghmcZone: null };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(IssueReport),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: RoadsService,
          useValue: { findSegmentByPoint: jest.fn().mockResolvedValue(mockSegment) },
        },
        {
          provide: IssuesService,
          useValue: { clusterReportToIssue: jest.fn().mockResolvedValue('issue-1') },
        },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    reportRepo = module.get(getRepositoryToken(IssueReport));
    roadsService = module.get(RoadsService);
    issuesService = module.get(IssuesService);
    jest.clearAllMocks();
  });

  it('should create report and cluster to issue', async () => {
    const created = { id: 'r1', roadSegmentId: 'seg-1', reporterId: 'u1', issueType: 'pothole', severity: 'minor', photoUrl: 'https://example.com/1.jpg', photoHash: 'abc', location: 'POINT(78 17)', exifTimestamp: null, reportedAt: new Date(), createdAt: new Date() };
    (reportRepo.create as jest.Mock).mockReturnValue(created);
    (reportRepo.save as jest.Mock).mockResolvedValue(created);

    const result = await service.create(
      {
        issueType: 'pothole',
        severity: 'minor',
        lat: 17.4,
        lng: 78.5,
        photoUrl: 'https://example.com/1.jpg',
        photoHash: 'abc',
      },
      'user-1',
    );

    expect(result.reportId).toBe('r1');
    expect(result.issueId).toBe('issue-1');
    expect(roadsService.findSegmentByPoint).toHaveBeenCalledWith(17.4, 78.5);
  });

  it('should throw when no segment near point', async () => {
    (roadsService.findSegmentByPoint as jest.Mock).mockResolvedValue(null);

    await expect(
      service.create(
        { issueType: 'pothole', severity: 'minor', lat: 17, lng: 78, photoUrl: 'u', photoHash: 'h' },
        'user-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
