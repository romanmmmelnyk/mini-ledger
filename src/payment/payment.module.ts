import { Module } from '@nestjs/common';
import {PaymentController} from "./payment.controller";
import {PaymentService} from "./payment.service";
import {BalanceService} from "../account/balance.service";
import {AccountService} from "../account/account.service";

@Module({
    imports: [],
    controllers: [PaymentController],
    providers: [PaymentService, BalanceService, AccountService],
})
export class PaymentModule {}
