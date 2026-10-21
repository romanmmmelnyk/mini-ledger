import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentDto } from './dto/payment.dto';
import { TopUpDto } from './dto/topup.dto';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Post('send')
  @UseGuards(JwtAuthGuard)
  sendPayment(
    @Body() dto: PaymentDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.sendPayment(dto, user.userId);
  }

  @Post('topup')
  @UseGuards(JwtAuthGuard)
  topUp(@Body() dto: TopUpDto, @CurrentUser() user: { userId: string }) {
    return this.service.topUp(dto, user.userId);
  }
}
