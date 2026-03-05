import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Issue } from '../../issues/entities/issue.entity';

@Entity('complaints')
export class Complaint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'issue_id', type: 'uuid' })
  issueId: string;

  @ManyToOne(() => Issue)
  @JoinColumn({ name: 'issue_id' })
  issue: Issue;

  @Column({ name: 'complaint_type', type: 'varchar', length: 20 })
  complaintType: string;

  @Column({ name: 'external_id', type: 'varchar', length: 255, nullable: true })
  externalId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 30, default: 'pending' })
  status: string;

  @Column({ name: 'filed_at', type: 'timestamptz', default: () => 'NOW()' })
  filedAt: Date;

  @Column({ name: 'last_reminder_at', type: 'timestamptz', nullable: true })
  lastReminderAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
