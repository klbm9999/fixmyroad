import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from '../issues/entities/issue.entity';
import { IssuesModule } from '../issues/issues.module';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';
import { Complaint } from './entities/complaint.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Complaint, Issue]),
    IssuesModule,
  ],
  controllers: [ComplaintsController],
  providers: [ComplaintsService],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
