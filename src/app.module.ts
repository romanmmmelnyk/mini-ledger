import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountModule } from './account/account.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import {PaymentModule} from "./payment/payment.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AccountModule,
      PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
