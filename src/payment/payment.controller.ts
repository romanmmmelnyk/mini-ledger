import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { PaymentDto } from './dto/payment.dto';
import {
  SendPaymentResponseDto,
  TopUpResponseDto,
} from './dto/payment-response.dto';
import { TopUpDto } from './dto/topup.dto';
import { PaymentService } from './payment.service';

@ApiTags('payment')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@Controller('payment')
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Post('send')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Transfer between accounts',
    description:
      'Debits the sender account and credits the receiver. When the currencies differ, the receiver amount is multiplied by the rate at transaction time.',
  })
  @ApiCreatedResponse({ type: SendPaymentResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'Insufficient funds, a non-integer amount, or the same account on both sides',
  })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  sendPayment(
    @Body() dto: PaymentDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.sendPayment(dto, user.userId);
  }

  @Post('topup')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Top up an account' })
  @ApiCreatedResponse({ type: TopUpResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  topUp(@Body() dto: TopUpDto, @CurrentUser() user: { userId: string }) {
    return this.service.topUp(dto, user.userId);
  }
}
