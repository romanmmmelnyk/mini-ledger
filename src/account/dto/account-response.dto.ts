import { ApiProperty } from '@nestjs/swagger';
import { AccountType, TransactionType } from '@prisma/client';

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

export class HistoryEntryDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: 35 })
  transactionId: number;

  @ApiProperty({ enum: TransactionType, example: TransactionType.TRANSFER })
  type: TransactionType;

  @ApiProperty({ example: '2026-10-21T10:15:00.000Z' })
  date: Date;

  @ApiProperty({ example: 1 })
  accountId: number;

  @ApiProperty({ example: 'UAH' })
  currency_code: string;

  @ApiProperty({
    example: -10.5,
    description: 'Signed amount in major units. Negative means money left the account.',
  })
  amount: number;

  @ApiProperty({
    example: 89.5,
    description: 'Account balance in major units right after this entry.',
  })
  balance: number;

  @ApiProperty({
    example: 2,
    nullable: true,
    description: 'The other account of a transfer. Null for top-ups.',
  })
  counterpartyAccountId: number | null;

  @ApiProperty({ example: 1, description: 'Rate at transaction time.' })
  rate: number;
}
