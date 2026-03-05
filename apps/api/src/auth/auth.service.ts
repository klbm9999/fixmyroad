import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from './entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    const user = this.userRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      name: dto.name ?? null,
      phone: dto.phone ?? null,
      role: dto.role ?? 'citizen',
    });
    await this.userRepo.save(user);

    const tokens = await this.issueTokens(user);
    return { user: this.sanitizeUser(user), tokens };
  }

  async login(dto: LoginDto): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (!user?.passwordHash) throw new UnauthorizedException('Invalid email or password');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid email or password');

    const tokens = await this.issueTokens(user);
    return { user: this.sanitizeUser(user), tokens };
  }

  async validateUserById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async getMe(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    return user ? this.sanitizeUser(user) : null;
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwt.verify<JwtPayload & { type: string }>(refreshToken);
      if (payload.type !== 'refresh') throw new UnauthorizedException('Invalid token');
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('User not found');
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = this.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwt.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: '7d' },
    );
    return {
      accessToken,
      expiresIn: 15 * 60,
      refreshToken,
    };
  }

  private sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash: _, ...rest } = user;
    return rest;
  }
}
