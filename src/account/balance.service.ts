import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BalanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalanceByUserId(userId: number) {
    const entries = await this.prisma.entry.findMany({
      where: {
        OR: [{ sender_id: userId }, { receiver_id: userId }],
      },
      orderBy: [{ transaction: { date: 'asc' } }, { id: 'asc' }],
    });

    const balance = entries.reduce((total, entry) => {
      if (entry.receiver_id === userId) {
        total += entry.amount;
      }
      if (entry.sender_id === userId) {
        total -= entry.amount;
      }
      return total;
    }, 0);

    return { balance };
  }
}
