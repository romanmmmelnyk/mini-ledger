import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserPublicDto } from './dto/user-public.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await this.hash(dto.password);

    const user: User = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
      },
    });

    return this.toPublicUser(user);
  }

  async login(dto: LoginDto) {
    const user = await this.authenticate(dto.email, dto.password);
    const accessToken = await this.jwt.signAsync({
      sub: String(user.id),
    });

    return { accessToken };
  }

  async authenticate(email: string, password: string): Promise<User> {
    const user: User | null = await this.prisma.user.findUnique({ where: { email } });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const matches: boolean = await this.verifyPassword(
      password,
      user.passwordHash,
    );
    if (!matches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }
  async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { id: Number(id) } });
  }

  hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
    });
  }

  verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    return argon2.verify(passwordHash, password);
  }

  async deleteUser(userId: number) {
    return await this.prisma.user.delete({
      where: {id: Number(userId)},
    });
  }

  private toPublicUser(user: User): UserPublicDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      createdAt: user.createdAt,
    };
  }
}
