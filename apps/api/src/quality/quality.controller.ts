import { Controller, Post } from '@nestjs/common';
import { QualityService } from './quality.service';

@Controller('internal')
export class QualityController {
  constructor(private readonly quality: QualityService) {}

  @Post('quality/refresh')
  async refresh() {
    await this.quality.refreshSegmentScores();
    return { ok: true };
  }
}
