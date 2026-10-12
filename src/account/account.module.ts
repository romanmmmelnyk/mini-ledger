import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { BalanceService } from './balance.service';

@Module({
  controllers: [AccountController],
  providers: [AccountService, BalanceService],
})
export class AccountModule {}
