import { Module } from '@nestjs/common';
import { BalanceModule } from '../balance/balance.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import {CurrencyModule} from "../currency/currency.module";
import {CurrencyService} from "../currency/currency.service";

@Module({
  imports: [BalanceModule, CurrencyModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
