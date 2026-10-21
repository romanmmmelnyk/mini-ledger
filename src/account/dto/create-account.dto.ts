import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';

export class CreateAccountDto {
  @ApiProperty({ enum: AccountType, example: AccountType.STANDARD })
  type: AccountType;

  @ApiProperty({ example: 'UAH', minLength: 3, maxLength: 3 })
  currency_code: string;
}
