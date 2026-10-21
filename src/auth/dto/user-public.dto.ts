import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class UserPublicDto {
  @ApiProperty({ example: 6 })
  id: string | number;

  @ApiProperty({ example: 'alice@example.com' })
  email: string;

  @ApiProperty({ example: 'Alice', nullable: true })
  name: string | null;

  @ApiProperty({ enum: UserStatus, example: UserStatus.PENDING_VERIFICATION })
  status: UserStatus;

  @ApiProperty({ example: '2026-10-21T00:00:00.000Z' })
  createdAt: Date;
}
