import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class QualityService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Cron('*/15 * * * *')
  async runRefresh(): Promise<void> {
    await this.refreshSegmentScores();
  }

  async refreshSegmentScores(): Promise<void> {
    await this.dataSource.query(`
      UPDATE road_segments rs
      SET quality_score = COALESCE(agg.score, 0)
      FROM (
        SELECT i.road_segment_id,
               SUM(
                 CASE i.severity
                   WHEN 'severe' THEN 3
                   WHEN 'moderate' THEN 2
                   ELSE 1
                 END
                 * EXP(-0.05 * EXTRACT(DAY FROM (NOW() - i.first_reported_at))::numeric)
               ) AS score
        FROM issues i
        WHERE i.status NOT IN ('verified', 'closed')
        GROUP BY i.road_segment_id
      ) agg
      WHERE rs.id = agg.road_segment_id
    `);
  }
}
