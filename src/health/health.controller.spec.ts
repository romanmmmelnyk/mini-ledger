import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  const healthService = {
    check: jest.fn(),
  } satisfies Pick<HealthService, 'check'>;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: healthService }],
    }).compile();

    controller = module.get(HealthController);
  });

  it('returns the health check', async () => {
    const report = { status: 'ok', database: 'up' };
    healthService.check.mockResolvedValue(report);

    await expect(controller.check()).resolves.toBe(report);
    expect(healthService.check).toHaveBeenCalledWith();
  });
});
