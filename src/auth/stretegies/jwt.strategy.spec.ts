import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  const config = {
    getOrThrow: jest.fn<string, [string]>().mockReturnValue('test-secret'),
  } satisfies Pick<ConfigService, 'getOrThrow'>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy, { provide: ConfigService, useValue: config }],
    }).compile();

    strategy = module.get(JwtStrategy);
  });

  it('reads the access-token secret when it is constructed', () => {
    expect(config.getOrThrow).toHaveBeenCalledTimes(1);
    expect(config.getOrThrow).toHaveBeenCalledWith('JWT_ACCESS_SECRET');
  });

  it('exposes the token subject as the current user id', async () => {
    await expect(strategy.validate({ sub: '42' })).resolves.toEqual({
      userId: '42',
    });
  });
});
