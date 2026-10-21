import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    deleteUser: jest.fn(),
  } satisfies Pick<AuthService, 'register' | 'login' | 'deleteUser'>;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get(AuthController);
  });

  it('registers a user', async () => {
    const dto = { name: 'Alice', email: 'alice@example.com', password: 'pw' };
    const created = { id: 1, email: dto.email, name: dto.name };
    authService.register.mockResolvedValue(created);

    await expect(controller.register(dto)).resolves.toBe(created);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('logs a user in', async () => {
    const dto = { email: 'alice@example.com', password: 'pw' };
    authService.login.mockResolvedValue({ accessToken: 'token' });

    await expect(controller.login(dto)).resolves.toEqual({
      accessToken: 'token',
    });
    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('deletes the current user', async () => {
    const deleted = { id: 8 };
    authService.deleteUser.mockResolvedValue(deleted);

    await expect(controller.deleteUser({ userId: 8 })).resolves.toBe(deleted);
    expect(authService.deleteUser).toHaveBeenCalledWith(8);
  });
});
