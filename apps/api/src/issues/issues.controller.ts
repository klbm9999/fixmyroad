import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { IssuesService } from './issues.service';

@Controller('issues')
export class IssuesController {
  constructor(private readonly issues: IssuesService) {}

  @Get()
  async list(
    @Query('claimable') claimable: string,
    @Query('issue_type') issueType?: string,
    @Query('limit') limit = '20',
    @Query('cursor') cursor?: string,
  ) {
    if (claimable === 'true') {
      return this.issues.findClaimable(undefined, issueType, parseInt(limit, 10) || 20, cursor);
    }
    return { items: [], nextCursor: null };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.issues.findById(id);
  }
}
