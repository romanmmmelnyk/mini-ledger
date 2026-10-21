import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Not enough funds' })
  message: string;

  @ApiProperty({ example: 'Bad Request' })
  error: string;
}
