import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { IssueReport } from '../../reports/entities/issue-report.entity';
import { RoadSegment } from '../../roads/entities/road-segment.entity';

@Entity('issues')
export class Issue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'road_segment_id', type: 'uuid' })
  roadSegmentId: string;

  @ManyToOne(() => RoadSegment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'road_segment_id' })
  roadSegment: RoadSegment;

  @Column({ name: 'issue_type', type: 'varchar', length: 50 })
  issueType: string;

  @Column({ type: 'varchar', length: 20 })
  severity: string;

  @Column({ name: 'quality_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  qualityScore: number;

  @Column({ type: 'varchar', length: 30, default: 'reported' })
  status: string;

  @Column({ name: 'first_reported_at', type: 'timestamptz' })
  firstReportedAt: Date;

  @UpdateDateColumn({ name: 'last_updated_at' })
  lastUpdatedAt: Date;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => IssueReport, (report) => report.issue)
  reports: IssueReport[];
}
