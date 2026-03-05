import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClaimsModule } from '../claims/claims.module';
import { ComplaintsModule } from '../complaints/complaints.module';
import { IssuesModule } from '../issues/issues.module';
import { RoadSegment } from './entities/road-segment.entity';
import { RoadsController } from './roads.controller';
import { RoadsService } from './roads.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoadSegment]),
    IssuesModule,
    ComplaintsModule,
    ClaimsModule,
  ],
  controllers: [RoadsController],
  providers: [RoadsService],
  exports: [RoadsService],
})
export class RoadsModule {}
