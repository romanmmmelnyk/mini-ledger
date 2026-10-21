import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'error'] })
  status: string;

  @ApiProperty({ example: 'up', enum: ['up', 'down'] })
  database: string;
}
