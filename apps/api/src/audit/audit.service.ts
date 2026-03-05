import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async log(entityType: string, entityId: string, action: string, actorId: string | null, oldState?: object, newState?: object) {
    const log = this.repo.create({
      entityType,
      entityId,
      action,
      actorId,
      oldState: oldState ?? null,
      newState: newState ?? null,
    });
    await this.repo.save(log);
  }
}
