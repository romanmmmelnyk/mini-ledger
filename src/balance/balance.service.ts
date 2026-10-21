import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BalanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalanceByAccountId(accountId: number) {
    const total = await this.prisma.entry.aggregate({
      where: { account_id: accountId },
      _sum: { amount: true },
    });

    return total._sum.amount ?? 0;
  }

  async getBalancesByAccountIds(accountIds: number[]) {
    if (accountIds.length === 0) {
      return new Map<number, number>();
    }

    const totals = await this.prisma.entry.groupBy({
      by: ['account_id'],
      where: { account_id: { in: accountIds } },
      _sum: { amount: true },
    });

    return new Map(
      totals.map((row) => [row.account_id, row._sum.amount ?? 0]),
    );
  }
}
