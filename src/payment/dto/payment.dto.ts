import { ApiProperty } from '@nestjs/swagger';

export class PaymentDto {
  @ApiProperty({ example: 1 })
  senderAccountId: number;

  @ApiProperty({ example: 2 })
  receiverAccountId: number;

  @ApiProperty({
    example: 1050,
    description: 'Amount in the sender currency minor units. 1050 means 10.50.',
  })
  amount: number;
}
