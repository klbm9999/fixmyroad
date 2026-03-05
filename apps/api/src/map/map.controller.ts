import { Controller, Get, Query } from '@nestjs/common';
import { RoadsService } from '../roads/roads.service';

@Controller('map')
export class MapController {
  constructor(private readonly roads: RoadsService) {}

  @Get('geojson')
  async geojson(@Query('bbox') bbox: string) {
    const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
    if ([minLng, minLat, maxLng, maxLat].some(Number.isNaN)) {
      return { type: 'FeatureCollection', features: [] };
    }
    return this.roads.getGeoJsonByBbox(minLng, minLat, maxLng, maxLat);
  }
}
