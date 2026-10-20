import {BadRequestException, Body, Controller, Post, Req, UseGuards} from "@nestjs/common";
import {PaymentDto} from "./dto/payment.dto";
import {TopUpDto} from "./dto/topup.dto";
import {PrismaService} from "../prisma/prisma.service";
import {PaymentService} from "./payment.service";
import {CurrentUser} from "../common/decorators/current-user.decorator";
import {User} from "@prisma/client";
import {JwtAuthGuard} from "../auth/guard/jwt-auth.guard";

@Controller('payment')
export class PaymentController {
    constructor(private readonly service: PaymentService) {}

    @Post('send')
    @UseGuards(JwtAuthGuard)
    async sendPayment(@Body() dto: PaymentDto, @CurrentUser() user: {userId: string}) {
        const users = await this.service.checkUsers(dto, user.userId)
        if (!users) {
            throw new BadRequestException("Some problems with users.");
        }

        return this.service.sendPayment({sender: users.sender, receiver: users.receiver, amount: dto.amount});
    }

    @Post('topup')
    @UseGuards(JwtAuthGuard)
    async topUp(@Body() dto: TopUpDto, @CurrentUser() user: {userId: string}) {
        return this.service.topUp(dto, user.userId);
    }

}