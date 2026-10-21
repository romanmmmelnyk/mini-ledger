import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';

export class AccountDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: AccountType, example: AccountType.STANDARD })
  type: AccountType;

  @ApiProperty({ example: 'UAH' })
  currency_code: string;

  @ApiProperty({ example: 6, nullable: true })
  user_id: number | null;
}

export class AccountCurrencyDto {
  @ApiProperty({ example: 'UAH' })
  code: string;

  @ApiProperty({ example: 'Ukrainian hryvnia' })
  name: string;

  @ApiProperty({ example: '₴' })
  symbol: string;
}

export class AccountWithBalanceDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: AccountType, example: AccountType.STANDARD })
  type: AccountType;

  @ApiProperty({ type: AccountCurrencyDto })
  currency: AccountCurrencyDto;

  @ApiProperty({ example: 6 })
  user_id: number;

  @ApiProperty({
    example: 100,
    description: 'Balance in major currency units. 10.5 means 10.50.',
  })
  balance: number;
}

export class BalanceDto {
  @ApiProperty({
    example: 100,
    description: 'Balance in major currency units. 10.5 means 10.50.',
  })
  balance: number;
}
