import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Issue } from '../../issues/entities/issue.entity';
import { RoadSegment } from '../../roads/entities/road-segment.entity';

@Entity('issue_reports')
export class IssueReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'issue_id', type: 'uuid', nullable: true })
  issueId: string | null;

  @ManyToOne(() => Issue, (issue) => issue.reports, { nullable: true })
  @JoinColumn({ name: 'issue_id' })
  issue: Issue | null;

  @Column({ name: 'road_segment_id', type: 'uuid' })
  roadSegmentId: string;

  @ManyToOne(() => RoadSegment)
  @JoinColumn({ name: 'road_segment_id' })
  roadSegment: RoadSegment;

  @Column({ name: 'reporter_id', type: 'uuid' })
  reporterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column({ name: 'issue_type', type: 'varchar', length: 50 })
  issueType: string;

  @Column({ type: 'varchar', length: 20 })
  severity: string;

  @Column({ name: 'photo_url', type: 'varchar', length: 1024 })
  photoUrl: string;

  @Column({ name: 'photo_hash', type: 'varchar', length: 64 })
  photoHash: string;

  @Column({ type: 'text', select: false, name: 'location' })
  location: string;

  @Column({ name: 'exif_timestamp', type: 'timestamptz', nullable: true })
  exifTimestamp: Date | null;

  @Column({ name: 'reported_at', type: 'timestamptz', default: () => 'NOW()' })
  reportedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
