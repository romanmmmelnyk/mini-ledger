import { Test, TestingModule } from '@nestjs/testing';
import { AccountType } from '@prisma/client';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

describe('AccountController', () => {
  let controller: AccountController;
  const accountService = {
    createAccount: jest.fn(),
    getMyAccounts: jest.fn(),
    getBalance: jest.fn(),
    getHistory: jest.fn(),
    deleteAccount: jest.fn(),
  } satisfies Pick<
    AccountService,
    | 'createAccount'
    | 'getMyAccounts'
    | 'getBalance'
    | 'getHistory'
    | 'deleteAccount'
  >;
  const user = { userId: '8' };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [{ provide: AccountService, useValue: accountService }],
    }).compile();

    controller = module.get(AccountController);
  });

  it('opens an account for the current user', async () => {
    const dto = { type: AccountType.SAVING, currency_code: 'EUR' };
    const created = { id: 1 };
    accountService.createAccount.mockResolvedValue(created);

    await expect(controller.createAccount(dto, user)).resolves.toBe(created);
    expect(accountService.createAccount).toHaveBeenCalledWith(dto, '8');
  });

  it('lists the current user accounts', async () => {
    const accounts = [{ id: 1, balance: 2 }];
    accountService.getMyAccounts.mockResolvedValue(accounts);

    await expect(controller.getMyAccounts(user)).resolves.toBe(accounts);
    expect(accountService.getMyAccounts).toHaveBeenCalledWith('8');
  });

  it('reads one account balance', async () => {
    const balance = { balance: 10 };
    accountService.getBalance.mockResolvedValue(balance);

    await expect(controller.getBalance(3, user)).resolves.toBe(balance);
    expect(accountService.getBalance).toHaveBeenCalledWith(3, '8');
  });

  it('deletes one account', async () => {
    const deleted = { id: 3 };
    accountService.deleteAccount.mockResolvedValue(deleted);

    await expect(controller.deleteAccount(3, user)).resolves.toBe(deleted);
    expect(accountService.deleteAccount).toHaveBeenCalledWith(3, '8');
  });

  it('reads the history of all accounts', async () => {
    const history = [{ id: 1 }];
    accountService.getHistory.mockResolvedValue(history);

    await expect(controller.getHistory(user)).resolves.toBe(history);
    expect(accountService.getHistory).toHaveBeenCalledWith('8');
  });

  it('reads the history of one account', async () => {
    const history = [{ id: 2 }];
    accountService.getHistory.mockResolvedValue(history);

    await expect(controller.getAccountHistory(5, user)).resolves.toBe(history);
    expect(accountService.getHistory).toHaveBeenCalledWith('8', 5);
  });
});
