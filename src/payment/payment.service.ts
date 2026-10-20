import {BadRequestException, Injectable, NotFoundException} from "@nestjs/common";
import {PrismaService} from "../prisma/prisma.service";
import {PaymentDto} from "./dto/payment.dto";
import {TopUpDto} from "./dto/topup.dto";
import {AuthService} from "../auth/auth.service";
import {BalanceService} from "../balance/balance.service";
import {EntryType, User} from "@prisma/client";
import {randomUUID} from "node:crypto";

@Injectable()
export class PaymentService {
    constructor(private readonly prisma: PrismaService, private readonly authService: AuthService, private readonly balanceService: BalanceService) {}

    async sendPayment({sender, receiver, amount}: {
        sender: User;
        receiver: User;
        amount: number;
    }) {
        const balanceEligible = (await this.balanceService.getBalanceByUserId(sender.id)).balance;
        if (amount > balanceEligible) {
            throw new BadRequestException("Now enough funds");
        }

        const transaction = await this.prisma.transaction.create({
            data: {
                idempotency_key: randomUUID(),
                entries: {
                    create: {
                        type: EntryType.TRANSFER,
                        amount,
                        sender_id: sender.id,
                        receiver_id: receiver.id,
                    },
                },
            },
        });
        const senderBalance = await this.balanceService.getBalanceByUserId(sender.id);
        const receiverBalance = await this.balanceService.getBalanceByUserId(receiver.id);
        return {
            status: "ok",
            transactionId: transaction.id,
            amount,
            senderBalance: senderBalance.balance,
            receiverBalance: receiverBalance.balance,
        };

    }

    async checkUsers(dto: PaymentDto, senderId: string) {
        const sender = await this.authService.findById(senderId);

        const receiver = await this.authService.findByEmail(dto.receiverEmail);
        if (!receiver) {
            throw new NotFoundException("No receiver email match");
        } else if (!sender) {
            throw new NotFoundException("Getting problems finding you");
        }
        if (!dto.amount) {
            throw new BadRequestException("No amount found");
        }

        return {
            sender,
            receiver,
        }
    }

    async topUp(dto: TopUpDto, userId: string) {
        const user = await this.authService.findById(userId);

        if (!user) {
            throw new NotFoundException("No user found");
        }


        if (!Number.isInteger(dto.amount) || dto.amount <= 0) {
            throw new BadRequestException("Amount must be a positive number");
        }

        const transaction = await this.prisma.transaction.create({
            data: {
                idempotency_key: randomUUID(),
                entries: {
                    create: {
                        type: EntryType.TOP_UP,
                        amount: dto.amount,
                        receiver_id: user.id,
                    },
                },
            },
        });

        const {balance} = await this.balanceService.getBalanceByUserId(user.id);

        return {
            status: "ok",
            email: user.email,
            amount: dto.amount,
            transactionId: transaction.id,
            balance,
        };
    }
}