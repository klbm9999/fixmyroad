import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { IssuesModule } from '../issues/issues.module';
import { RoadsModule } from '../roads/roads.module';
import { IssueReport } from './entities/issue-report.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([IssueReport]),
    AuthModule,
    RoadsModule,
    IssuesModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
