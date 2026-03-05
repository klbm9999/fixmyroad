import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Complaint } from '../complaints/entities/complaint.entity';
import { Reminder } from './entities/reminder.entity';

const UNRESOLVED_DAYS = 14;
const REMINDER_INTERVAL_DAYS = 7;

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(Reminder)
    private readonly reminderRepo: Repository<Reminder>,
    @InjectRepository(Complaint)
    private readonly complaintRepo: Repository<Complaint>,
    private readonly dataSource: DataSource,
  ) {}

  @Cron('0 9 * * *')
  async scheduleReminders(): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - UNRESOLVED_DAYS);
    const complaints = await this.complaintRepo
      .createQueryBuilder('c')
      .where('c.status NOT IN (:...statuses)', { statuses: ['resolved'] })
      .andWhere('c.filed_at < :cutoff', { cutoff })
      .getMany();
    for (const c of complaints) {
      const lastReminder = await this.reminderRepo.findOne({
        where: { complaintId: c.id },
        order: { scheduledAt: 'DESC' },
      });
      const intervalOk = !lastReminder || (Date.now() - lastReminder.scheduledAt.getTime()) > REMINDER_INTERVAL_DAYS * 86400 * 1000;
      if (!intervalOk) continue;
      const reminder = this.reminderRepo.create({
        complaintId: c.id,
        reminderType: 'complaint_unresolved',
        scheduledAt: new Date(),
      });
      await this.reminderRepo.save(reminder);
    }
  }

  async processDue(): Promise<{ sent: number }> {
    const due = await this.reminderRepo
      .createQueryBuilder('r')
      .where('r.sent_at IS NULL')
      .andWhere('r.scheduled_at <= NOW()')
      .take(50)
      .getMany();
    let sent = 0;
    for (const r of due) {
      await this.reminderRepo.update({ id: r.id }, { sentAt: new Date() });
      if (r.complaintId) {
        await this.dataSource.query(
          'UPDATE complaints SET last_reminder_at = NOW() WHERE id = $1',
          [r.complaintId],
        );
      }
      sent++;
    }
    return { sent };
  }
}
