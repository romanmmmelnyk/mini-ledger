import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyService } from './currency.service';

describe('CurrencyService', () => {
  let service: CurrencyService;
  const prisma = {
    currency: {
      findUnique: jest.fn(),
    },
  };
  const http = {
    get: jest.fn(),
  } satisfies Pick<HttpService, 'get'>;
  const config = {
    get: jest.fn(),
  } satisfies Pick<ConfigService, 'get'>;

  beforeEach(async () => {
    jest.resetAllMocks();
    config.get.mockReturnValue('api-key');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        { provide: PrismaService, useValue: prisma },
        { provide: HttpService, useValue: http },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(CurrencyService);
  });

  it('finds a currency by code', async () => {
    const currency = { code: 'UAH', name: 'Hryvnia' };
    prisma.currency.findUnique.mockResolvedValue(currency);

    await expect(service.findByCode('UAH')).resolves.toBe(currency);
    expect(prisma.currency.findUnique).toHaveBeenCalledWith({
      where: { code: 'UAH' },
    });
  });

  it('returns null when the currency code is unknown', async () => {
    prisma.currency.findUnique.mockResolvedValue(null);

    await expect(service.findByCode('XXX')).resolves.toBeNull();
  });

  it('reads the target rate from the currency API', async () => {
    http.get.mockReturnValue(of({ data: { data: { USD: { value: 0.024 } } } }));

    await expect(service.getExchangeRate('UAH', 'USD')).resolves.toBe(0.024);
    expect(http.get).toHaveBeenCalledWith(
      'https://api.currencyapi.com/v3/latest',
      {
        headers: {
          'Content-Type': 'application/json',
          apikey: 'api-key',
        },
        params: { base_currency: 'UAH', currencies: 'USD' },
      },
    );
    expect(config.get).toHaveBeenCalledWith('CURRENCY_API_SECRET');
  });

  it('propagates a failed rate request', async () => {
    http.get.mockReturnValue(throwError(() => new Error('network')));

    await expect(service.getExchangeRate('UAH', 'USD')).rejects.toThrow(
      'network',
    );
  });
});
