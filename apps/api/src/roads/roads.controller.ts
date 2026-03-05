import { Controller, Get, Param, ParseFloatPipe, ParseUUIDPipe, Query } from '@nestjs/common';
import { RoadsService } from './roads.service';

@Controller('roads')
export class RoadsController {
  constructor(private readonly roads: RoadsService) {}

  @Get('segment-by-point')
  async segmentByPoint(
    @Query('lat', new ParseFloatPipe()) lat: number,
    @Query('lng', new ParseFloatPipe()) lng: number,
  ) {
    const segment = await this.roads.findSegmentByPoint(lat, lng);
    if (!segment) return { segment: null };
    return { segment };
  }

  @Get(':id/details')
  async getDetails(@Param('id', ParseUUIDPipe) id: string) {
    const details = await this.roads.getSegmentDetails(id);
    if (!details) return { details: null };
    return { details };
  }

  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    const segment = await this.roads.getSegmentById(id);
    if (!segment) return { segment: null };
    return { segment };
  }
}
