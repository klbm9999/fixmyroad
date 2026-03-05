import { Controller, Post } from '@nestjs/common';
import { RemindersService } from './reminders.service';

@Controller('internal/reminders')
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  @Post('process')
  process() {
    return this.reminders.processDue();
  }
}
