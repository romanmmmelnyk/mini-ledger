import { ApiProperty } from '@nestjs/swagger';

export class SendPaymentResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: 35 })
  transactionId: number;

  @ApiProperty({
    example: 1050,
    description: 'Debited amount in the sender currency minor units.',
  })
  amount: number;

  @ApiProperty({
    example: 1,
    description:
      'Rate at transaction time. 1 when both accounts use the same currency.',
  })
  rate: number;

  @ApiProperty({
    example: 90,
    description: 'Sender balance in major currency units.',
  })
  senderBalance: number;

  @ApiProperty({
    example: 10.5,
    description: 'Receiver balance in major currency units.',
  })
  receiverBalance: number;
}

export class TopUpResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: 1 })
  accountId: number;

  @ApiProperty({ example: 10000, description: 'Amount in minor units.' })
  amount: number;

  @ApiProperty({ example: 35 })
  transactionId: number;

  @ApiProperty({
    example: 100,
    description: 'Balance in major currency units.',
  })
  balance: number;
}
