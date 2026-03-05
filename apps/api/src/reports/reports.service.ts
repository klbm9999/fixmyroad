import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '../cache/cache.service';
import { IssuesService } from '../issues/issues.service';
import { RoadsService } from '../roads/roads.service';
import { CreateReportDto } from './dto/create-report.dto';
import { IssueReport } from './entities/issue-report.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(IssueReport)
    private readonly reportRepo: Repository<IssueReport>,
    private readonly roads: RoadsService,
    private readonly issues: IssuesService,
    private readonly cache: CacheService,
  ) {}

  async create(dto: CreateReportDto, reporterId: string): Promise<{ reportId: string; issueId: string | null }> {
    if (this.cache.isAvailable) {
      const seen = await this.cache.isPhotoHashSeen(dto.photoHash);
      if (seen) throw new BadRequestException('Duplicate photo detected');
    }
    const segment = await this.roads.findSegmentByPoint(dto.lat, dto.lng);
    if (!segment) throw new BadRequestException('No road segment found near this location');

    const pointWkt = `POINT(${dto.lng} ${dto.lat})`;
    const report = this.reportRepo.create({
      roadSegmentId: segment.id,
      reporterId,
      issueType: dto.issueType,
      severity: dto.severity,
      photoUrl: dto.photoUrl,
      photoHash: dto.photoHash,
      location: pointWkt,
      exifTimestamp: dto.exifTimestamp ? new Date(dto.exifTimestamp) : null,
    });
    await this.reportRepo.save(report);

    const issueId = await this.issues.clusterReportToIssue(report.id, segment.id, dto.issueType, pointWkt);
    if (issueId) await this.reportRepo.update({ id: report.id }, { issueId });

    if (this.cache.isAvailable) await this.cache.setPhotoHashSeen(dto.photoHash);

    return { reportId: report.id, issueId: issueId ?? null };
  }

  async findOne(id: string) {
    return this.reportRepo.findOne({
      where: { id },
      relations: ['roadSegment', 'issue'],
    });
  }

  getPresignedUploadUrl(_filename?: string): { uploadUrl: string; photoUrl: string } {
    const key = `reports/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.jpg`;
    const baseUrl = process.env.S3_PUBLIC_BASE_URL ?? 'https://storage.example.com';
    return {
      uploadUrl: `${baseUrl}/upload?key=${encodeURIComponent(key)}`,
      photoUrl: `${baseUrl}/${key}`,
    };
  }
}
