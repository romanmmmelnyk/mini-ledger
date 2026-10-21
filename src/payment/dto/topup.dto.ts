import { ApiProperty } from '@nestjs/swagger';

export class TopUpDto {
  @ApiProperty({ example: 1 })
  accountId: number;

  @ApiProperty({
    example: 10000,
    description: 'Amount in minor units. 10000 means 100.00.',
  })
  amount: number;
}
