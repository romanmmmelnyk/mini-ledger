import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { BalanceService } from './balance.service';

describe('BalanceService', () => {
  let service: BalanceService;
  const prisma = {
    entry: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [BalanceService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(BalanceService);
  });

  it('sums entries for one account', async () => {
    prisma.entry.aggregate.mockResolvedValue({ _sum: { amount: 250 } });

    await expect(service.getBalanceByAccountId(3)).resolves.toBe(250);
    expect(prisma.entry.aggregate).toHaveBeenCalledWith({
      where: { account_id: 3 },
      _sum: { amount: true },
    });
  });

  it('returns zero when an account has no entries', async () => {
    prisma.entry.aggregate.mockResolvedValue({ _sum: { amount: null } });

    await expect(service.getBalanceByAccountId(3)).resolves.toBe(0);
  });

  it('returns an empty map without querying when no accounts are given', async () => {
    await expect(service.getBalancesByAccountIds([])).resolves.toEqual(
      new Map(),
    );
    expect(prisma.entry.groupBy).not.toHaveBeenCalled();
  });

  it('groups entry totals by account and treats a null sum as zero', async () => {
    prisma.entry.groupBy.mockResolvedValue([
      { account_id: 1, _sum: { amount: 40 } },
      { account_id: 2, _sum: { amount: null } },
    ]);

    await expect(service.getBalancesByAccountIds([1, 2])).resolves.toEqual(
      new Map<number, number>([
        [1, 40],
        [2, 0],
      ]),
    );
    expect(prisma.entry.groupBy).toHaveBeenCalledWith({
      by: ['account_id'],
      where: { account_id: { in: [1, 2] } },
      _sum: { amount: true },
    });
  });
});
