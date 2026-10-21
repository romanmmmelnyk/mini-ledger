import { Test, TestingModule } from '@nestjs/testing';
import { AccountType, TransactionType } from '@prisma/client';
import { BalanceService } from '../balance/balance.service';
import { CurrencyService } from '../currency/currency.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from './payment.service';

jest.mock('node:crypto', () => ({
  ...jest.requireActual<typeof import('node:crypto')>('node:crypto'),
  randomUUID: () => '11111111-1111-4111-8111-111111111111',
}));

describe('PaymentService', () => {
  let service: PaymentService;
  const prisma = {
    account: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
  };
  const balanceService = {
    getBalanceByAccountId: jest.fn(),
  } satisfies Pick<BalanceService, 'getBalanceByAccountId'>;
  const currencyService = {
    getExchangeRate: jest.fn(),
  } satisfies Pick<CurrencyService, 'getExchangeRate'>;

  const sender = {
    id: 1,
    entries: [],
    currency: { code: 'UAH' },
    currency_code: 'UAH',
  };
  const receiver = {
    id: 2,
    entries: [],
    currency: { code: 'UAH' },
  };
  const payment = {
    senderAccountId: 1,
    receiverAccountId: 2,
    amount: 1000,
  };

  type AccountLookup = {
    where: {
      user_id?: number | null | { not: null };
    };
  };

  function useAccounts(
    options: {
      owned?: typeof sender | null;
      receiver?: typeof receiver | null;
      clearing?: { id: number } | null;
    } = {},
  ) {
    const owned = 'owned' in options ? options.owned : sender;
    const receiverAccount = 'receiver' in options ? options.receiver : receiver;
    const clearing = 'clearing' in options ? options.clearing : null;

    prisma.account.findFirst.mockImplementation((args: AccountLookup) => {
      const userId = args.where.user_id;
      if (userId === null) {
        return Promise.resolve(clearing);
      }
      if (typeof userId === 'number') {
        return Promise.resolve(owned);
      }
      if (typeof userId === 'object' && userId !== null && 'not' in userId) {
        return Promise.resolve(receiverAccount);
      }
      return Promise.reject(
        new Error(`Unexpected account query: ${JSON.stringify(args.where)}`),
      );
    });
  }

  beforeEach(async () => {
    jest.resetAllMocks();

    prisma.transaction.create.mockResolvedValue({ id: 15 });
    balanceService.getBalanceByAccountId.mockResolvedValue(10_000);
    currencyService.getExchangeRate.mockResolvedValue(2);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: prisma },
        { provide: BalanceService, useValue: balanceService },
        { provide: CurrencyService, useValue: currencyService },
      ],
    }).compile();

    service = module.get(PaymentService);
  });

  describe('sendPayment', () => {
    it.each([0, -10, 1.5])(
      'rejects a non-positive or fractional amount (%p)',
      async (amount) => {
        await expect(
          service.sendPayment({ ...payment, amount }, '5'),
        ).rejects.toMatchObject({
          name: 'BadRequestException',
          message: 'Amount must be a positive number',
        });
        expect(prisma.account.findFirst).not.toHaveBeenCalled();
      },
    );

    it('rejects a transfer to the same account', async () => {
      await expect(
        service.sendPayment(
          { senderAccountId: 1, receiverAccountId: 1, amount: 1000 },
          '5',
        ),
      ).rejects.toMatchObject({
        name: 'BadRequestException',
        message: 'Use two different accounts',
      });
      expect(prisma.account.findFirst).not.toHaveBeenCalled();
    });

    it('rejects an unknown sender account', async () => {
      useAccounts({ owned: null });

      await expect(service.sendPayment(payment, '5')).rejects.toMatchObject({
        name: 'NotFoundException',
        message: 'Account not found',
      });
      expect(prisma.transaction.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown receiver account', async () => {
      useAccounts({ receiver: null });

      await expect(service.sendPayment(payment, '5')).rejects.toMatchObject({
        name: 'NotFoundException',
        message: 'Receiver account not found',
      });
      expect(prisma.transaction.create).not.toHaveBeenCalled();
    });

    it('rejects a transfer that exceeds the sender balance', async () => {
      useAccounts();
      balanceService.getBalanceByAccountId.mockResolvedValue(999);

      await expect(service.sendPayment(payment, '5')).rejects.toMatchObject({
        name: 'BadRequestException',
        message: 'Not enough funds',
      });
      expect(prisma.transaction.create).not.toHaveBeenCalled();
    });

    it('transfers the same amount when both accounts share a currency', async () => {
      useAccounts();

      await expect(service.sendPayment(payment, '5')).resolves.toEqual({
        status: 'ok',
        transactionId: 15,
        amount: 1000,
        rate: 1,
        senderBalance: 100,
        receiverBalance: 100,
      });
      expect(currencyService.getExchangeRate).not.toHaveBeenCalled();
      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: {
          idempotency_key: '11111111-1111-4111-8111-111111111111',
          type: TransactionType.TRANSFER,
          rate: 1,
          entries: {
            create: [
              { account_id: 1, amount: -1000 },
              { account_id: 2, amount: 1000 },
            ],
          },
        },
      });
    });

    it('converts the receiver amount when the currencies differ', async () => {
      useAccounts({
        receiver: { id: 2, entries: [], currency: { code: 'USD' } },
      });

      await expect(service.sendPayment(payment, '5')).resolves.toMatchObject({
        rate: 2,
        amount: 1000,
      });
      expect(currencyService.getExchangeRate).toHaveBeenCalledWith(
        'UAH',
        'USD',
      );
      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: {
          idempotency_key: '11111111-1111-4111-8111-111111111111',
          type: TransactionType.TRANSFER,
          rate: 2,
          entries: {
            create: [
              { account_id: 1, amount: -1000 },
              { account_id: 2, amount: 2000 },
            ],
          },
        },
      });
    });
  });

  describe('topUp', () => {
    it('rejects a non-positive amount', async () => {
      await expect(
        service.topUp({ accountId: 1, amount: 0 }, '5'),
      ).rejects.toMatchObject({
        name: 'BadRequestException',
        message: 'Amount must be a positive number',
      });
      expect(prisma.account.findFirst).not.toHaveBeenCalled();
    });

    it('rejects an unknown account', async () => {
      useAccounts({ owned: null });

      await expect(
        service.topUp({ accountId: 1, amount: 1000 }, '5'),
      ).rejects.toMatchObject({
        name: 'NotFoundException',
        message: 'Account not found',
      });
    });

    it('credits the account from an existing clearing account', async () => {
      useAccounts({ clearing: { id: 9 } });
      balanceService.getBalanceByAccountId.mockResolvedValue(2500);

      await expect(
        service.topUp({ accountId: 1, amount: 1000 }, '5'),
      ).resolves.toEqual({
        status: 'ok',
        accountId: 1,
        amount: 1000,
        transactionId: 15,
        balance: 25,
      });
      expect(prisma.account.create).not.toHaveBeenCalled();
      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: {
          idempotency_key: '11111111-1111-4111-8111-111111111111',
          type: TransactionType.TOP_UP,
          entries: {
            create: [
              { account_id: 9, amount: -1000 },
              { account_id: 1, amount: 1000 },
            ],
          },
        },
      });
    });

    it('opens a clearing account when none exists', async () => {
      useAccounts({ clearing: null });
      prisma.account.create.mockResolvedValue({ id: 44 });

      await service.topUp({ accountId: 1, amount: 1000 }, '5');

      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          type: AccountType.STANDARD,
          currency_code: 'UAH',
        },
      });
      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: {
          idempotency_key: '11111111-1111-4111-8111-111111111111',
          type: TransactionType.TOP_UP,
          entries: {
            create: [
              { account_id: 44, amount: -1000 },
              { account_id: 1, amount: 1000 },
            ],
          },
        },
      });
    });
  });
});
