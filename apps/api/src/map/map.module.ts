import { Module } from '@nestjs/common';
import { RoadsModule } from '../roads/roads.module';
import { MapController } from './map.controller';

@Module({
  imports: [RoadsModule],
  controllers: [MapController],
})
export class MapModule {}
