import {ConflictException, Injectable, NotFoundException, UnauthorizedException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {AuthService} from "../auth/auth.service";
import {BalanceService} from "../balance/balance.service";
import {CurrencyService} from "../currency/currency.service";
import {CreateAccountDto} from "./dto/create-account.dto";
import {AccountType} from "@prisma/client";

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
