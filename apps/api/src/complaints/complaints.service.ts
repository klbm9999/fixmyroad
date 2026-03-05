import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from '../issues/entities/issue.entity';
import { Complaint } from './entities/complaint.entity';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectRepository(Complaint)
    private readonly complaintRepo: Repository<Complaint>,
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,
  ) {}

  async list(filters: { status?: string } = {}) {
    const qb = this.complaintRepo.createQueryBuilder('c').leftJoinAndSelect('c.issue', 'issue').orderBy('c.filed_at', 'DESC');
    if (filters.status) qb.andWhere('c.status = :status', { status: filters.status });
    return qb.getMany();
  }

  async findByIssueIds(issueIds: string[]) {
    if (issueIds.length === 0) return [];
    return this.complaintRepo.find({
      where: issueIds.map((issueId) => ({ issueId })),
      order: { filedAt: 'DESC' },
    });
  }

  async generate(): Promise<{ created: number }> {
    const issues = await this.issueRepo.find({
      where: [{ status: 'under_review' }, { status: 'reported' }],
      take: 100,
    });
    let created = 0;
    for (const issue of issues) {
      for (const type of ['ghmc', 'rto'] as const) {
        const exists = await this.complaintRepo.findOne({ where: { issueId: issue.id, complaintType: type } });
        if (exists) continue;
        const complaint = this.complaintRepo.create({
          issueId: issue.id,
          complaintType: type,
          status: 'pending',
          payload: { generatedAt: new Date().toISOString(), issueType: issue.issueType },
        });
        await this.complaintRepo.save(complaint);
        created++;
      }
    }
    return { created };
  }

  async updateStatus(id: string, status: string, externalId?: string) {
    await this.complaintRepo.update({ id }, { status, ...(externalId && { externalId }) });
    return this.complaintRepo.findOne({ where: { id } });
  }
}
