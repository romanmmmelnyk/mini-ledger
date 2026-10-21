import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'alice@example.com' })
  email: string;

  @ApiProperty({ example: 'password', format: 'password' })
  password: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT for the Authorization: Bearer <accessToken> header.',
  })
  accessToken: string;
}
