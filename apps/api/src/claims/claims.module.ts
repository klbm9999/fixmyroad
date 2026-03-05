import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Builder } from '../builders/entities/builder.entity';
import { Issue } from '../issues/entities/issue.entity';
import { IssuesModule } from '../issues/issues.module';
import { ClaimsService } from './claims.service';
import { Claim } from './entities/claim.entity';
import { FixProof } from './entities/fix-proof.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Claim, FixProof, Builder, Issue]),
    IssuesModule,
  ],
  providers: [ClaimsService],
  exports: [ClaimsService],
})
export class ClaimsModule {}
