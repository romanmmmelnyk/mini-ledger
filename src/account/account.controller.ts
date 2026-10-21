import {Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards} from '@nestjs/common';
import {JwtAuthGuard} from "../auth/guard/jwt-auth.guard";
import {CurrentUser} from "../common/decorators/current-user.decorator";
import {AccountService} from "./account.service";
import {CreateAccountDto} from "./dto/create-account.dto";

@Controller('account')
export class AccountController {
    constructor(private readonly service: AccountService) {}
    @Post('create')
    @UseGuards(JwtAuthGuard)
    createAccount(@Body() dto: CreateAccountDto, @CurrentUser() user: {userId: string}) {
        return this.service.createAccount(dto, user.userId)
    }

    @Get('my')
    @UseGuards(JwtAuthGuard)
    getMyAccounts(@CurrentUser() user: {userId: string}) {
        return this.service.getMyAccounts(user.userId)
    }

    @Get(':id/balance')
    @UseGuards(JwtAuthGuard)
    getBalance(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: {userId: string}) {
        return this.service.getBalance(id, user.userId)
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    deleteAccount(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: {userId: string}) {
        return this.service.deleteAccount(id, user.userId)
    }
}
