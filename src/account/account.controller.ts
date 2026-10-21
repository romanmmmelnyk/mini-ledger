import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { AccountService } from './account.service';
import {
  AccountDto,
  AccountWithBalanceDto,
  BalanceDto,
} from './dto/account-response.dto';
import { CreateAccountDto } from './dto/create-account.dto';

@ApiTags('account')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@Controller('account')
export class AccountController {
  constructor(private readonly service: AccountService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Open an account' })
  @ApiCreatedResponse({ type: AccountDto })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description:
      'Unknown currency, or this account type already exists in this currency',
  })
  createAccount(
    @Body() dto: CreateAccountDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.createAccount(dto, user.userId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List my accounts with balances' })
  @ApiOkResponse({ type: AccountWithBalanceDto, isArray: true })
  getMyAccounts(@CurrentUser() user: { userId: string }) {
    return this.service.getMyAccounts(user.userId);
  }

  @Get(':id/balance')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get an account balance' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: BalanceDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  getBalance(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.getBalance(id, user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete an account' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: AccountDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'The account already has entries',
  })
  deleteAccount(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.deleteAccount(id, user.userId);
  }
}
