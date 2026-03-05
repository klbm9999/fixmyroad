import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssueReport } from '../reports/entities/issue-report.entity';
import { Issue } from './entities/issue.entity';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Issue, IssueReport]),
  ],
  controllers: [IssuesController],
  providers: [IssuesService],
  exports: [IssuesService],
})
export class IssuesModule {}
