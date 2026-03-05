import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('presigned-url')
  @UseGuards(AuthGuard('jwt'))
  getPresignedUrl(@Query('filename') filename?: string) {
    return this.reports.getPresignedUploadUrl(filename);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async create(@Body() dto: CreateReportDto, @CurrentUser() user: User) {
    return this.reports.create(dto, user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reports.findOne(id);
  }
}
