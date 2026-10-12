import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async checkUser(email: string, password: string) {
    const user = await this.getUserEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.password !== password) {
      throw new BadRequestException("Password doesn't match");
    }

    return user;
  }

  getUserEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {email},
      select: {id: true, email: true, name: true, password: true},
    });
  }
}
