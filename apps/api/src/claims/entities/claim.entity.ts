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
import { Builder } from '../../builders/entities/builder.entity';
import { Issue } from '../../issues/entities/issue.entity';
import { FixProof } from './fix-proof.entity';

@Entity('claims')
export class Claim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'issue_id', type: 'uuid', unique: true })
  issueId: string;

  @ManyToOne(() => Issue)
  @JoinColumn({ name: 'issue_id' })
  issue: Issue;

  @Column({ name: 'builder_id', type: 'uuid' })
  builderId: string;

  @ManyToOne(() => Builder)
  @JoinColumn({ name: 'builder_id' })
  builder: Builder;

  @Column({ type: 'varchar', length: 30, default: 'claimed' })
  status: string;

  @Column({ name: 'bond_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  bondAmount: number | null;

  @Column({ name: 'reward_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  rewardAmount: number | null;

  @Column({ name: 'claimed_at', type: 'timestamptz', default: () => 'NOW()' })
  claimedAt: Date;

  @Column({ name: 'due_at', type: 'timestamptz', nullable: true })
  dueAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => FixProof, (fp) => fp.claim)
  fixProofs: FixProof[];
}
