import {ConflictException, Injectable, NotFoundException, UnauthorizedException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {AuthService} from "../auth/auth.service";
import {BalanceService} from "../balance/balance.service";
import {CurrencyService} from "../currency/currency.service";
import {CreateAccountDto} from "./dto/create-account.dto";
import {AccountType, TransactionType} from "@prisma/client";

@Injectable()
export class AccountService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authService: AuthService,
        private readonly balanceService: BalanceService,
        private readonly currencyService: CurrencyService,
    ) {}
    async createAccount(dto: CreateAccountDto, userId: string) {
        const user = await this.authService.findById(userId);
        if (!user) {
            throw new UnauthorizedException("User not found");
        }

        const currency = await this.currencyService.findByCode(dto.currency_code)

        if (!currency) {
            throw new ConflictException("Invalid currency code");
        }

        const account_exists = await this.checkIfAccountTypeExists(dto.type, dto.currency_code, user.id)
        if (account_exists) {
            throw new ConflictException("This account type and currency are already in use.");
        }

        return await this.prisma.account.create({
            data: {
                type: dto.type,
                currency_code: dto.currency_code,
                user_id: user.id,
            }
        });
    }

    async getMyAccounts(userId: string) {
        const user = await this.authService.findById(userId);
        if (!user) {
            throw new UnauthorizedException("User not found");
        }

        const accounts = await this.prisma.account.findMany({
            where: {user_id: user.id},
            orderBy: {id: 'asc'},
            select: {
                id: true,
                type: true,
                currency: true,
                user_id: true
            }
        });
        const balances = await this.balanceService.getBalancesByAccountIds(
            accounts.map((account) => account.id),
        );

        return accounts.map((account) => ({
            ...account,
            balance: (balances.get(account.id) ?? 0) / 100,
        }));
    }

    async getBalance(accountId: number, userId: string) {
        const user = await this.authService.findById(userId);
        if (!user) {
            throw new UnauthorizedException("User not found");
        }

        const account = await this.prisma.account.findFirst({
            where: {
                id: accountId,
                user_id: user.id,
            },
        });
        if (!account) {
            throw new NotFoundException("Account not found");
        }

        const balance = await this.balanceService.getBalanceByAccountId(account.id);
        return {balance: balance / 100};
    }

    async getHistory(userId: string, accountId?: number) {
        const user = await this.authService.findById(userId);
        if (!user) {
            throw new UnauthorizedException("User not found");
        }

        const accounts = await this.prisma.account.findMany({
            where: {
                user_id: user.id,
                ...(accountId === undefined ? {} : {id: accountId}),
            },
            select: {id: true, currency_code: true},
        });
        if (accountId !== undefined && accounts.length === 0) {
            throw new NotFoundException("Account not found");
        }

        const currencies = new Map(accounts.map((account) => [account.id, account.currency_code]));
        const entries = await this.prisma.entry.findMany({
            where: {account_id: {in: [...currencies.keys()]}},
            orderBy: [{transaction: {date: 'asc'}}, {id: 'asc'}],
            select: {
                id: true,
                amount: true,
                account_id: true,
                transaction: {
                    select: {
                        id: true,
                        type: true,
                        date: true,
                        rate: true,
                        entries: {select: {account_id: true}},
                    },
                },
            },
        });

        const running = new Map<number, number>();
        const history = entries.map((entry) => {
            const balance = (running.get(entry.account_id) ?? 0) + entry.amount;
            running.set(entry.account_id, balance);

            const counterparty = entry.transaction.type === TransactionType.TRANSFER
                ? entry.transaction.entries.find((other) => other.account_id !== entry.account_id)
                : undefined;

            return {
                id: entry.id,
                transactionId: entry.transaction.id,
                type: entry.transaction.type,
                date: entry.transaction.date,
                accountId: entry.account_id,
                currency_code: currencies.get(entry.account_id) as string,
                amount: entry.amount / 100,
                balance: balance / 100,
                counterpartyAccountId: counterparty?.account_id ?? null,
                rate: Number(entry.transaction.rate),
            };
        });

        return history.reverse();
    }

    async deleteAccount(accountId: number, userId: string) {
        const user = await this.authService.findById(userId);
        if (!user) {
            throw new UnauthorizedException("User not found");
        }

        const account = await this.prisma.account.findFirst({
            where: {
                id: accountId,
                user_id: user.id,
            },
        });
        if (!account) {
            throw new NotFoundException("Account not found");
        }

        const entries = await this.prisma.entry.count({
            where: {account_id: account.id},
        });
        if (entries > 0) {
            throw new ConflictException("Account has entries");
        }

        return this.prisma.account.delete({
            where: {id: account.id},
        });
    }

    async checkIfAccountTypeExists(type: AccountType, currency_code: string, user_id: number) {
        return await this.prisma.account.findFirst({
            where: {
                user_id,
                type,
                currency_code,
            }
        });
    }
}
