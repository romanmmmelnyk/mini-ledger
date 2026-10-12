import {BadRequestException, Body, Controller, Post, Req} from "@nestjs/common";
import {PaymentDto} from "./dto/payment.dto";
import {TopUpDto} from "./dto/topup.dto";
import {PrismaService} from "../prisma/prisma.service";
import {PaymentService} from "./payment.service";

@Controller('payment')
export class PaymentController {
    constructor(private readonly service: PaymentService) {}
    @Post('send')
    async sendPayment(@Body() dto: PaymentDto) {
        const users = await this.service.checkUsers(dto)
        if (!users) {
            throw new BadRequestException("Some problems with users.");
        }
        const payment = this.service.sendPayment({sender: users.sender, receiver: users.receiver, amount: dto.amount});
        return payment;
    }

    @Post('topup')
    async topUp(@Body() dto: TopUpDto) {
        return this.service.topUp(dto);
    }

}