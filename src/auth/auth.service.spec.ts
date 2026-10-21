import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('argon2', () => {
  const actual = jest.requireActual<typeof import('argon2')>('argon2');
  return {
    ...actual,
    hash: jest.fn(),
    verify: jest.fn(),
  };
});

const actualArgon2 = jest.requireActual<typeof import('argon2')>('argon2');

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };
  const jwt = {
    signAsync: jest.fn(),
  } satisfies Pick<JwtService, 'signAsync'>;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('stores a password hash and returns the public user', async () => {
    const createdAt = new Date('2026-10-21T00:00:00.000Z');
    jest.mocked(argon2.hash).mockResolvedValue('hashed-pw');
    prisma.user.create.mockResolvedValue({
      id: 3,
      email: 'alice@example.com',
      name: 'Alice',
      status: UserStatus.PENDING_VERIFICATION,
      passwordHash: 'hashed-pw',
      createdAt,
    });

    await expect(
      service.register({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password',
      }),
    ).resolves.toEqual({
      id: 3,
      email: 'alice@example.com',
      name: 'Alice',
      status: UserStatus.PENDING_VERIFICATION,
      createdAt,
    });

    expect(argon2.hash).toHaveBeenCalledWith('password', {
      type: argon2.argon2id,
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Alice',
        email: 'alice@example.com',
        passwordHash: 'hashed-pw',
      },
    });
  });

  it('returns an access token for a valid login', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 7,
      email: 'alice@example.com',
      passwordHash: 'hash',
    });
    jest.mocked(argon2.verify).mockResolvedValue(true);
    jwt.signAsync.mockResolvedValue('signed-token');

    await expect(
      service.login({ email: 'alice@example.com', password: '1234' }),
    ).resolves.toEqual({ accessToken: 'signed-token' });

    expect(argon2.verify).toHaveBeenCalledWith('hash', '1234');
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: '7' });
  });

  it('rejects an invalid login before signing a token', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: '1234' }),
    ).rejects.toMatchObject({
      name: 'UnauthorizedException',
      message: 'Invalid credentials',
    });
    expect(argon2.verify).not.toHaveBeenCalled();
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('rejects authentication when the user has no password hash', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 7,
      email: 'alice@example.com',
      passwordHash: null,
    });

    await expect(
      service.authenticate('alice@example.com', '1234'),
    ).rejects.toMatchObject({
      name: 'UnauthorizedException',
      message: 'Invalid credentials',
    });
  });

  it('rejects authentication when the password does not match', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 7,
      email: 'alice@example.com',
      passwordHash: 'hash',
    });
    jest.mocked(argon2.verify).mockResolvedValue(false);

    await expect(
      service.authenticate('alice@example.com', 'wrong'),
    ).rejects.toMatchObject({
      name: 'UnauthorizedException',
      message: 'Invalid credentials',
    });
  });

  it('finds a user by email', async () => {
    const user = { id: 7, email: 'alice@example.com' };
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(service.findByEmail('alice@example.com')).resolves.toBe(user);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'alice@example.com' },
    });
  });

  it('finds a user by a numeric id passed as a string', async () => {
    const user = { id: 9, email: 'alice@example.com' };
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(service.findById('9')).resolves.toBe(user);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 9 } });
  });

  it('hashes a password that later verifies', async () => {
    jest.mocked(argon2.hash).mockImplementation(actualArgon2.hash);
    jest.mocked(argon2.verify).mockImplementation(actualArgon2.verify);

    const hashed = await service.hash('secret');

    await expect(service.verifyPassword('secret', hashed)).resolves.toBe(true);
    await expect(service.verifyPassword('other', hashed)).resolves.toBe(false);
  });

  it('deletes a user by id', async () => {
    const deleted = { id: 4 };
    prisma.user.delete.mockResolvedValue(deleted);

    await expect(service.deleteUser(4)).resolves.toBe(deleted);
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 4 } });
  });
});
