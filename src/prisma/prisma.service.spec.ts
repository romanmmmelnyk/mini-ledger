import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('connects when the module starts', async () => {
    const connect = jest
      .spyOn(PrismaClient.prototype, '$connect')
      .mockResolvedValue();
    const service = new PrismaService();
    connect.mockClear();

    await service.onModuleInit();

    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('disconnects when the module shuts down', async () => {
    const disconnect = jest
      .spyOn(PrismaClient.prototype, '$disconnect')
      .mockResolvedValue();
    const service = new PrismaService();
    disconnect.mockClear();

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
