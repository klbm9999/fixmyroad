import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('reminders')
export class Reminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'complaint_id', type: 'uuid', nullable: true })
  complaintId: string | null;

  @Column({ name: 'issue_id', type: 'uuid', nullable: true })
  issueId: string | null;

  @Column({ name: 'reminder_type', type: 'varchar', length: 30 })
  reminderType: string;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
