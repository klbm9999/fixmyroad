import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: Repository<User>;
  let jwtService: JwtService;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed',
    name: 'Test',
    phone: null,
    role: 'citizen',
    emailVerifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('token'),
            verify: jest.fn().mockReturnValue({ sub: mockUser.id, email: mockUser.email, type: 'refresh' }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return user + tokens', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);
      (userRepo.create as jest.Mock).mockReturnValue(mockUser);
      (userRepo.save as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test',
        role: 'citizen',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictException if email exists', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.register({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return user and tokens for valid credentials', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('token');
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for unknown email', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getMe', () => {
    it('should return sanitized user when found', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getMe('user-1');
      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should return null when user not found', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);
      expect(await service.getMe('missing')).toBeNull();
    });
  });
});
