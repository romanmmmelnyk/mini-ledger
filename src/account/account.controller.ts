import { Body, Controller, Post } from '@nestjs/common';
import { AccountService } from './account.service';
import { BalanceService } from './balance.service';
import { AccountDto } from './dto/account.dto';

@Controller('account')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly balanceService: BalanceService,
  ) {}

  @Post('balance')
  async getBalance(@Body() dto: AccountDto) {
    const { email, password } = dto;
    const user = await this.accountService.checkUser(email, password);

    return this.balanceService.getBalanceByUserId(user.id);
  }
}
