import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BalanceModule } from '../balance/balance.module';
import { CurrencyModule } from '../currency/currency.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [AuthModule, BalanceModule, CurrencyModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
