import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Issue } from '../../issues/entities/issue.entity';

@Entity('road_segments')
export class RoadSegment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'osm_way_id', type: 'bigint' })
  osmWayId: string;

  @Column({ name: 'osm_road_name', type: 'varchar', length: 500, nullable: true })
  osmRoadName: string | null;

  @Column({ type: 'text', select: false, name: 'geom' })
  geom: string;

  @Column({ name: 'start_junction_osm_id', type: 'bigint', nullable: true })
  startJunctionOsmId: string | null;

  @Column({ name: 'end_junction_osm_id', type: 'bigint', nullable: true })
  endJunctionOsmId: string | null;

  @Column({ name: 'length_m', type: 'decimal', precision: 10, scale: 2, nullable: true })
  lengthM: number | null;

  @Column({ name: 'ghmc_zone', type: 'varchar', length: 100, nullable: true })
  ghmcZone: string | null;

  @Column({ name: 'quality_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  qualityScore: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Issue, (issue) => issue.roadSegment)
  issues: Issue[];
}
