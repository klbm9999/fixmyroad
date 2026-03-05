import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('builders')
export class Builder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'business_name', type: 'varchar', length: 255, nullable: true })
  businessName: string | null;

  @Column({ name: 'registration_number', type: 'varchar', length: 100, nullable: true })
  registrationNumber: string | null;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @Column({ name: 'bond_balance', type: 'decimal', precision: 12, scale: 2, default: 0 })
  bondBalance: number;

  @Column({ name: 'rating_avg', type: 'decimal', precision: 3, scale: 2, default: 0 })
  ratingAvg: number;

  @Column({ name: 'rating_count', default: 0 })
  ratingCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
