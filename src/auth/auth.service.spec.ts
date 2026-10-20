import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  };
  const jwt = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('returns an access token for a valid login', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 7,
      email: 'alice@example.com',
      passwordHash: 'hash',
    });
    jest.spyOn(service, 'verifyPassword').mockResolvedValue(true);
    jwt.signAsync.mockResolvedValue('signed-token');

    await expect(
      service.login({ email: 'alice@example.com', password: '1234' }),
    ).resolves.toEqual({ accessToken: 'signed-token' });

    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: '7' });
  });
});
