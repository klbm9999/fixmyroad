import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_type', length: 50 })
  entityType: string;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ length: 50 })
  action: string;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ name: 'old_state', type: 'jsonb', nullable: true })
  oldState: Record<string, unknown> | null;

  @Column({ name: 'new_state', type: 'jsonb', nullable: true })
  newState: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
