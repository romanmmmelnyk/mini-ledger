import {Body, Controller, Delete, Post, UseGuards} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {JwtAuthGuard} from "./guard/jwt-auth.guard";
import {CurrentUser} from "../common/decorators/current-user.decorator";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
  @Delete("delete")
  @UseGuards(JwtAuthGuard)
  deleteUser(@CurrentUser() user: {userId: number}) {
    return this.authService.deleteUser(user.userId);
  }
}
