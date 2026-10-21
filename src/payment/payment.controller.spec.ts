import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

describe('PaymentController', () => {
  let controller: PaymentController;
  const paymentService = {
    sendPayment: jest.fn(),
    topUp: jest.fn(),
  } satisfies Pick<PaymentService, 'sendPayment' | 'topUp'>;
  const user = { userId: '5' };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [{ provide: PaymentService, useValue: paymentService }],
    }).compile();

    controller = module.get(PaymentController);
  });

  it('sends a payment for the current user', async () => {
    const dto = { senderAccountId: 1, receiverAccountId: 2, amount: 1000 };
    const result = { status: 'ok', transactionId: 15 };
    paymentService.sendPayment.mockResolvedValue(result);

    await expect(controller.sendPayment(dto, user)).resolves.toBe(result);
    expect(paymentService.sendPayment).toHaveBeenCalledWith(dto, '5');
  });

  it('tops up an account for the current user', async () => {
    const dto = { accountId: 1, amount: 1000 };
    const result = { status: 'ok', accountId: 1 };
    paymentService.topUp.mockResolvedValue(result);

    await expect(controller.topUp(dto, user)).resolves.toBe(result);
    expect(paymentService.topUp).toHaveBeenCalledWith(dto, '5');
  });
});
