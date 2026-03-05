import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClaimsService } from '../claims/claims.service';
import { Builder } from './entities/builder.entity';

@Injectable()
export class BuildersService {
  constructor(
    @InjectRepository(Builder)
    private readonly builderRepo: Repository<Builder>,
    private readonly claims: ClaimsService,
  ) {}

  async register(userId: string, dto: { businessName?: string; registrationNumber?: string }) {
    const existing = await this.builderRepo.findOne({ where: { userId } });
    if (existing) return existing;
    const builder = this.builderRepo.create({
      userId,
      businessName: dto.businessName ?? null,
      registrationNumber: dto.registrationNumber ?? null,
      bondBalance: 0,
    });
    await this.builderRepo.save(builder);
    return builder;
  }

  async getMe(userId: string) {
    const builder = await this.builderRepo.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!builder) throw new NotFoundException('Builder profile not found');
    const claims = await this.claims.findByBuilder(builder.id);
    return { ...builder, claims };
  }

  async claimIssue(userId: string, issueId: string, bondAmount: number) {
    const builder = await this.builderRepo.findOne({ where: { userId } });
    if (!builder) throw new BadRequestException('Register as builder first');
    return this.claims.create(builder.id, issueId, bondAmount);
  }

  async getMyClaims(userId: string) {
    const builder = await this.builderRepo.findOne({ where: { userId } });
    if (!builder) return [];
    return this.claims.findByBuilder(builder.id);
  }

  async submitFix(claimId: string, userId: string, dto: { afterPhotoUrl: string; beforePhotoUrl?: string; proofAt: string }) {
    const builder = await this.builderRepo.findOne({ where: { userId } });
    if (!builder) throw new NotFoundException('Builder not found');
    return this.claims.submitFix(claimId, builder.id, dto);
  }

  async cancelClaim(claimId: string, userId: string) {
    const builder = await this.builderRepo.findOne({ where: { userId } });
    if (!builder) throw new NotFoundException('Builder not found');
    return this.claims.cancel(claimId, builder.id);
  }
}
