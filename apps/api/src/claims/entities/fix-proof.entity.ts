import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Claim } from './claim.entity';

@Entity('fix_proofs')
export class FixProof {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'claim_id', type: 'uuid' })
  claimId: string;

  @ManyToOne(() => Claim, (c) => c.fixProofs)
  @JoinColumn({ name: 'claim_id' })
  claim: Claim;

  @Column({ name: 'before_photo_url', type: 'varchar', length: 1024, nullable: true })
  beforePhotoUrl: string | null;

  @Column({ name: 'after_photo_url', type: 'varchar', length: 1024 })
  afterPhotoUrl: string;

  @Column({ type: 'text', nullable: true, select: false, name: 'location' })
  location: string | null;

  @Column({ name: 'proof_at', type: 'timestamptz' })
  proofAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
