import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {HttpService} from "@nestjs/axios";
import { firstValueFrom } from 'rxjs';
import {ConfigService} from "@nestjs/config";

@Injectable()
export class CurrencyService {
  constructor(
      private readonly prisma: PrismaService,
      private readonly http: HttpService,
      private readonly configService: ConfigService
  ) {}

  findByCode(code: string) {
    return this.prisma.currency.findUnique({
      where: { code },
    });
  }

  async getExchangeRate(base_currency: string, target_currency: string) {
    const { data } = await firstValueFrom(
        this.http.get('https://api.currencyapi.com/v3/latest', {
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.configService.get<string>('CURRENCY_API_SECRET'),
            'base_currency': base_currency,
          },
        }),
    );
  return data.data[target_currency].value;
  }
}
