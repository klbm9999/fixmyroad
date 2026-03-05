import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Builder } from '../builders/entities/builder.entity';
import { Issue } from '../issues/entities/issue.entity';
import { Claim } from './entities/claim.entity';
import { FixProof } from './entities/fix-proof.entity';

@Injectable()
export class ClaimsService {
  constructor(
    @InjectRepository(Claim)
    private readonly claimRepo: Repository<Claim>,
    @InjectRepository(FixProof)
    private readonly proofRepo: Repository<FixProof>,
    @InjectRepository(Builder)
    private readonly builderRepo: Repository<Builder>,
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,
    private readonly dataSource: DataSource,
    private readonly audit: AuditService,
  ) {}

  async create(builderId: string, issueId: string, bondAmount: number) {
    const existing = await this.claimRepo.findOne({ where: { issueId } });
    if (existing) throw new BadRequestException('Issue already claimed');
    const builder = await this.builderRepo.findOne({ where: { id: builderId } });
    if (!builder) throw new NotFoundException('Builder not found');
    const balance = Number(builder.bondBalance);
    if (balance < bondAmount) throw new BadRequestException('Insufficient bond balance');
    await this.builderRepo.update({ id: builderId }, { bondBalance: balance - bondAmount });
    const claim = this.claimRepo.create({
      issueId,
      builderId,
      bondAmount,
      status: 'claimed',
    });
    await this.claimRepo.save(claim);
    await this.issueRepo.update({ id: issueId }, { status: 'claimed' });
    await this.audit.log('claim', claim.id, 'created', builderId, undefined, { issueId, bondAmount, status: 'claimed' });
    return claim;
  }

  async findByBuilder(builderId: string) {
    return this.claimRepo.find({
      where: { builderId },
      relations: ['issue'],
      order: { claimedAt: 'DESC' },
    });
  }

  async findByIssueIds(issueIds: string[]): Promise<Claim[]> {
    if (issueIds.length === 0) return [];
    return this.claimRepo.find({
      where: { issueId: In(issueIds) },
      order: { completedAt: 'DESC' },
    });
  }

  async submitFix(claimId: string, builderId: string, dto: { afterPhotoUrl: string; beforePhotoUrl?: string; proofAt: string }) {
    const claim = await this.claimRepo.findOne({ where: { id: claimId, builderId } });
    if (!claim) throw new NotFoundException('Claim not found');
    const proof = this.proofRepo.create({
      claimId,
      afterPhotoUrl: dto.afterPhotoUrl,
      beforePhotoUrl: dto.beforePhotoUrl ?? null,
      proofAt: new Date(dto.proofAt),
    });
    await this.proofRepo.save(proof);
    await this.claimRepo.update({ id: claimId }, { status: 'fix_submitted' });
    await this.issueRepo.update({ id: claim.issueId }, { status: 'fixed_pending' });
    await this.audit.log('claim', claimId, 'fix_submitted', builderId, { status: 'claimed' }, { status: 'fix_submitted' });
    return proof;
  }

  async cancel(claimId: string, builderId: string) {
    const claim = await this.claimRepo.findOne({ where: { id: claimId, builderId } });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.status !== 'claimed' && claim.status !== 'in_progress') throw new BadRequestException('Cannot cancel');
    const bond = Number(claim.bondAmount ?? 0);
    await this.dataSource.query(
      'UPDATE builders SET bond_balance = bond_balance + $1 WHERE id = $2',
      [bond, builderId],
    );
    await this.claimRepo.update({ id: claimId }, { status: 'cancelled' });
    await this.issueRepo.update({ id: claim.issueId }, { status: 'reported' });
    return { ok: true };
  }
}
