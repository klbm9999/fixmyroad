import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { IssueReport } from '../reports/entities/issue-report.entity';
import { Issue } from './entities/issue.entity';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,
    @InjectRepository(IssueReport)
    private readonly reportRepo: Repository<IssueReport>,
    private readonly audit: AuditService,
  ) {}

  async clusterReportToIssue(
    reportId: string,
    roadSegmentId: string,
    issueType: string,
    locationWkt: string,
  ): Promise<string | null> {
    const wkt = locationWkt.startsWith('POINT') ? locationWkt : `POINT(${locationWkt})`;
    const raw = await this.issueRepo.manager.query<{ id: string }[]>(
      `
      SELECT i.id FROM issues i
      JOIN issue_reports r ON r.issue_id = i.id
      WHERE i.road_segment_id = $1 AND i.issue_type = $2
        AND r.reported_at > NOW() - INTERVAL '14 days'
        AND ST_DWithin(r.location::geography, ST_GeomFromText($3, 4326)::geography, 10)
      LIMIT 1
      `,
      [roadSegmentId, issueType, wkt],
    );
    const existingId = raw[0]?.id;
    if (existingId) {
      await this.reportRepo.update({ id: reportId }, { issueId: existingId });
      return existingId;
    }
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    if (!report) return null;
    const issue = this.issueRepo.create({
      roadSegmentId,
      issueType,
      severity: report.severity,
      qualityScore: this.severityToScore(report.severity),
      status: 'reported',
      firstReportedAt: report.reportedAt,
    });
    await this.issueRepo.save(issue);
    await this.reportRepo.update({ id: reportId }, { issueId: issue.id });
    return issue.id;
  }

  private severityToScore(severity: string): number {
    return severity === 'severe' ? 3 : severity === 'moderate' ? 2 : 1;
  }

  async findById(id: string) {
    return this.issueRepo.findOne({
      where: { id },
      relations: ['roadSegment', 'reports'],
    });
  }

  async findByRoadSegmentId(roadSegmentId: string) {
    return this.issueRepo.find({
      where: { roadSegmentId },
      relations: ['reports'],
      order: { firstReportedAt: 'DESC' },
    });
  }

  async findClaimable(bbox?: string, issueType?: string, limit = 20, cursor?: string) {
    const qb = this.issueRepo
      .createQueryBuilder('i')
      .where('i.status IN (:...statuses)', { statuses: ['reported', 'under_review'] })
      .orderBy('i.first_reported_at', 'DESC')
      .take(limit + 1);
    if (issueType) qb.andWhere('i.issue_type = :issueType', { issueType });
    if (cursor) qb.andWhere('i.id < :cursor', { cursor });
    const items = await qb.getMany();
    const hasMore = items.length > limit;
    if (hasMore) items.pop();
    return { items, nextCursor: hasMore ? items[items.length - 1]?.id : null };
  }
}
