import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountType, TransactionType } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { BalanceService } from '../balance/balance.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentDto } from './dto/payment.dto';
import { TopUpDto } from './dto/topup.dto';
import {CurrencyService} from "../currency/currency.service";

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly balanceService: BalanceService,
    private readonly currencyService: CurrencyService
  ) {}

  async sendPayment(dto: PaymentDto, userId: string) {
    this.assertAmount(dto.amount);
    let receiver_amount = dto.amount;
    let rate = 1;

    if (dto.senderAccountId === dto.receiverAccountId) {
      throw new BadRequestException('Use two different accounts');
    }

    const sender = await this.ownedAccount(dto.senderAccountId, userId);
    const receiver = await this.prisma.account.findFirst({
      where: { id: dto.receiverAccountId, user_id: { not: null } },
      select: {id: true, entries: true, currency: true}
    });
    if (!receiver) {
      throw new NotFoundException('Receiver account not found');
    }

    const senderBalance = await this.balanceService.getBalanceByAccountId(
      sender.id,
    );
    if (dto.amount > senderBalance) {
      throw new BadRequestException('Not enough funds');
    }

    if (sender.currency.code !== receiver.currency.code) {
      rate = await this.currencyService.getExchangeRate(sender.currency.code, receiver.currency.code);
      receiver_amount = dto.amount * rate;
    }
    console.log(rate)

    const transaction = await this.prisma.transaction.create({
      data: {
        idempotency_key: randomUUID(),
        type: TransactionType.TRANSFER,
        rate: rate,
        entries: {
          create: [
            { account_id: sender.id, amount: -dto.amount },
            { account_id: receiver.id, amount: receiver_amount },
          ],
        },
      },
    });

    return {
      status: 'ok',
      transactionId: transaction.id,
      amount: dto.amount,
      rate,
      senderBalance:
        (await this.balanceService.getBalanceByAccountId(sender.id)) / 100,
      receiverBalance:
        (await this.balanceService.getBalanceByAccountId(receiver.id)) / 100,
    };
  }

  async topUp(dto: TopUpDto, userId: string) {
    this.assertAmount(dto.amount);

    const account = await this.ownedAccount(dto.accountId, userId);
    const clearing = await this.clearingAccount(account.currency_code);

    const transaction = await this.prisma.transaction.create({
      data: {
        idempotency_key: randomUUID(),
        type: TransactionType.TOP_UP,
        entries: {
          create: [
            { account_id: clearing.id, amount: -dto.amount },
            { account_id: account.id, amount: dto.amount },
          ],
        },
      },
    });

    const balance = await this.balanceService.getBalanceByAccountId(account.id);

    return {
      status: 'ok',
      accountId: account.id,
      amount: dto.amount,
      transactionId: transaction.id,
      balance: balance / 100,
    };
  }

  private async ownedAccount(accountId: number, userId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, user_id: Number(userId) },
      select: {id: true, entries: true, currency: true, currency_code: true}
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  private async clearingAccount(currencyCode: string) {
    const existing = await this.prisma.account.findFirst({
      where: { user_id: null },
    });
    if (existing) {
      return existing;
    }

    return this.prisma.account.create({
      data: {
        type: AccountType.STANDARD,
        currency_code: currencyCode,
      },
    });
  }

  private assertAmount(amount: number) {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }
  }
}
