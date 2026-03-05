import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';

@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaints: ComplaintsService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.complaints.list({ status });
  }

  @Post('generate')
  generate() {
    return this.complaints.generate();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { status?: string; externalId?: string }) {
    return this.complaints.updateStatus(id, body.status ?? 'pending', body.externalId);
  }
}
