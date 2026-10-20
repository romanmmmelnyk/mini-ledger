import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BalanceModule } from '../balance/balance.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [AuthModule, BalanceModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
