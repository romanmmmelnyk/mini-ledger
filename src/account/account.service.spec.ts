import { Test, TestingModule } from '@nestjs/testing';
import { AccountType, TransactionType } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { BalanceService } from '../balance/balance.service';
import { CurrencyService } from '../currency/currency.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccountService } from './account.service';

describe('AccountService', () => {
  let service: AccountService;
  const prisma = {
    account: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    entry: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const authService = {
    findById: jest.fn(),
  } satisfies Pick<AuthService, 'findById'>;
  const balanceService = {
    getBalancesByAccountIds: jest.fn(),
    getBalanceByAccountId: jest.fn(),
  } satisfies Pick<
    BalanceService,
    'getBalancesByAccountIds' | 'getBalanceByAccountId'
  >;
  const currencyService = {
    findByCode: jest.fn(),
  } satisfies Pick<CurrencyService, 'findByCode'>;
  const user = { id: 4, email: 'alice@example.com' };
  const dto = { type: AccountType.STANDARD, currency_code: 'UAH' };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: authService },
        { provide: BalanceService, useValue: balanceService },
        { provide: CurrencyService, useValue: currencyService },
      ],
    }).compile();

    service = module.get(AccountService);
  });

  describe('createAccount', () => {
    it('rejects an unknown user', async () => {
      authService.findById.mockResolvedValue(null);

      await expect(service.createAccount(dto, '4')).rejects.toMatchObject({
        name: 'UnauthorizedException',
        message: 'User not found',
      });
      expect(currencyService.findByCode).not.toHaveBeenCalled();
    });

    it('rejects an unknown currency', async () => {
      authService.findById.mockResolvedValue(user);
      currencyService.findByCode.mockResolvedValue(null);

      await expect(service.createAccount(dto, '4')).rejects.toMatchObject({
        name: 'ConflictException',
        message: 'Invalid currency code',
      });
      expect(prisma.account.findFirst).not.toHaveBeenCalled();
    });

    it('rejects a duplicate account type in the same currency', async () => {
      authService.findById.mockResolvedValue(user);
      currencyService.findByCode.mockResolvedValue({ code: 'UAH' });
      prisma.account.findFirst.mockResolvedValue({ id: 1 });

      await expect(service.createAccount(dto, '4')).rejects.toMatchObject({
        name: 'ConflictException',
        message: 'This account type and currency are already in use.',
      });
      expect(prisma.account.create).not.toHaveBeenCalled();
    });

    it('creates an account for the user', async () => {
      const created = { id: 6, ...dto, user_id: user.id };
      authService.findById.mockResolvedValue(user);
      currencyService.findByCode.mockResolvedValue({ code: 'UAH' });
      prisma.account.findFirst.mockResolvedValue(null);
      prisma.account.create.mockResolvedValue(created);

      await expect(service.createAccount(dto, '4')).resolves.toBe(created);
      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          type: AccountType.STANDARD,
          currency_code: 'UAH',
          user_id: user.id,
        },
      });
    });
  });

  describe('getMyAccounts', () => {
    it('rejects an unknown user', async () => {
      authService.findById.mockResolvedValue(null);

      await expect(service.getMyAccounts('4')).rejects.toMatchObject({
        name: 'UnauthorizedException',
        message: 'User not found',
      });
      expect(prisma.account.findMany).not.toHaveBeenCalled();
    });

    it('attaches balances in major units and defaults a missing balance to zero', async () => {
      const accounts = [
        {
          id: 1,
          type: AccountType.STANDARD,
          currency: { code: 'UAH' },
          user_id: 4,
        },
        {
          id: 2,
          type: AccountType.SAVING,
          currency: { code: 'EUR' },
          user_id: 4,
        },
      ];
      authService.findById.mockResolvedValue(user);
      prisma.account.findMany.mockResolvedValue(accounts);
      balanceService.getBalancesByAccountIds.mockResolvedValue(
        new Map([[1, 150]]),
      );

      await expect(service.getMyAccounts('4')).resolves.toEqual([
        { ...accounts[0], balance: 1.5 },
        { ...accounts[1], balance: 0 },
      ]);
      expect(prisma.account.findMany).toHaveBeenCalledWith({
        where: { user_id: user.id },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          type: true,
          currency: true,
          user_id: true,
        },
      });
      expect(balanceService.getBalancesByAccountIds).toHaveBeenCalledWith([
        1, 2,
      ]);
    });
  });

  describe('getBalance', () => {
    it('rejects an unknown user', async () => {
      authService.findById.mockResolvedValue(null);

      await expect(service.getBalance(1, '4')).rejects.toMatchObject({
        name: 'UnauthorizedException',
        message: 'User not found',
      });
      expect(prisma.account.findFirst).not.toHaveBeenCalled();
    });

    it('rejects an account the user does not own', async () => {
      authService.findById.mockResolvedValue(user);
      prisma.account.findFirst.mockResolvedValue(null);

      await expect(service.getBalance(1, '4')).rejects.toMatchObject({
        name: 'NotFoundException',
        message: 'Account not found',
      });
    });

    it('returns the balance in major units', async () => {
      authService.findById.mockResolvedValue(user);
      prisma.account.findFirst.mockResolvedValue({ id: 1, user_id: 4 });
      balanceService.getBalanceByAccountId.mockResolvedValue(1050);

      await expect(service.getBalance(1, '4')).resolves.toEqual({
        balance: 10.5,
      });
      expect(prisma.account.findFirst).toHaveBeenCalledWith({
        where: { id: 1, user_id: user.id },
      });
      expect(balanceService.getBalanceByAccountId).toHaveBeenCalledWith(1);
    });
  });

  describe('getHistory', () => {
    it('rejects an unknown user', async () => {
      authService.findById.mockResolvedValue(null);

      await expect(service.getHistory('4')).rejects.toMatchObject({
        name: 'UnauthorizedException',
      });
      expect(prisma.entry.findMany).not.toHaveBeenCalled();
    });

    it('rejects an account the user does not own', async () => {
      authService.findById.mockResolvedValue(user);
      prisma.account.findMany.mockResolvedValue([]);

      await expect(service.getHistory('4', 9)).rejects.toMatchObject({
        name: 'NotFoundException',
        message: 'Account not found',
      });
      expect(prisma.account.findMany).toHaveBeenCalledWith({
        where: { user_id: user.id, id: 9 },
        select: { id: true, currency_code: true },
      });
    });

    it('returns newest first with running balances and counterparties', async () => {
      authService.findById.mockResolvedValue(user);
      prisma.account.findMany.mockResolvedValue([
        { id: 1, currency_code: 'UAH' },
      ]);
      const topUp = {
        id: 1,
        amount: 10000,
        account_id: 1,
        transaction: {
          id: 10,
          type: TransactionType.TOP_UP,
          date: new Date('2026-10-01T10:00:00Z'),
          rate: 1,
          entries: [{ account_id: 99 }, { account_id: 1 }],
        },
      };
      const transfer = {
        id: 3,
        amount: -2500,
        account_id: 1,
        transaction: {
          id: 11,
          type: TransactionType.TRANSFER,
          date: new Date('2026-10-02T10:00:00Z'),
          rate: '0.5',
          entries: [{ account_id: 1 }, { account_id: 7 }],
        },
      };
      prisma.entry.findMany.mockResolvedValue([topUp, transfer]);

      await expect(service.getHistory('4', 1)).resolves.toEqual([
        {
          id: 3,
          transactionId: 11,
          type: TransactionType.TRANSFER,
          date: transfer.transaction.date,
          accountId: 1,
          currency_code: 'UAH',
          amount: -25,
          balance: 75,
          counterpartyAccountId: 7,
          rate: 0.5,
        },
        {
          id: 1,
          transactionId: 10,
          type: TransactionType.TOP_UP,
          date: topUp.transaction.date,
          accountId: 1,
          currency_code: 'UAH',
          amount: 100,
          balance: 100,
          counterpartyAccountId: null,
          rate: 1,
        },
      ]);
    });
  });

  describe('deleteAccount', () => {
    it('rejects an unknown user', async () => {
      authService.findById.mockResolvedValue(null);

      await expect(service.deleteAccount(1, '4')).rejects.toMatchObject({
        name: 'UnauthorizedException',
        message: 'User not found',
      });
      expect(prisma.account.findFirst).not.toHaveBeenCalled();
    });

    it('rejects an account the user does not own', async () => {
      authService.findById.mockResolvedValue(user);
      prisma.account.findFirst.mockResolvedValue(null);

      await expect(service.deleteAccount(1, '4')).rejects.toMatchObject({
        name: 'NotFoundException',
        message: 'Account not found',
      });
      expect(prisma.entry.count).not.toHaveBeenCalled();
    });

    it('rejects an account that already has entries', async () => {
      authService.findById.mockResolvedValue(user);
      prisma.account.findFirst.mockResolvedValue({ id: 1 });
      prisma.entry.count.mockResolvedValue(2);

      await expect(service.deleteAccount(1, '4')).rejects.toMatchObject({
        name: 'ConflictException',
        message: 'Account has entries',
      });
      expect(prisma.account.delete).not.toHaveBeenCalled();
    });

    it('deletes an empty account', async () => {
      const deleted = { id: 1, user_id: 4 };
      authService.findById.mockResolvedValue(user);
      prisma.account.findFirst.mockResolvedValue(deleted);
      prisma.entry.count.mockResolvedValue(0);
      prisma.account.delete.mockResolvedValue(deleted);

      await expect(service.deleteAccount(1, '4')).resolves.toBe(deleted);
      expect(prisma.entry.count).toHaveBeenCalledWith({
        where: { account_id: 1 },
      });
      expect(prisma.account.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  it('looks up an account by type, currency, and owner', async () => {
    const row = { id: 3 };
    prisma.account.findFirst.mockResolvedValue(row);

    await expect(
      service.checkIfAccountTypeExists(AccountType.BUSINESS, 'USD', 4),
    ).resolves.toBe(row);
    expect(prisma.account.findFirst).toHaveBeenCalledWith({
      where: {
        user_id: 4,
        type: AccountType.BUSINESS,
        currency_code: 'USD',
      },
    });
  });
});
