import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplaintsModule } from '../complaints/complaints.module';
import { Complaint } from '../complaints/entities/complaint.entity';
import { Reminder } from './entities/reminder.entity';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reminder, Complaint]),
    ComplaintsModule,
  ],
  controllers: [RemindersController],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}
