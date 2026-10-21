import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from './current-user.decorator';

function currentUserFactory(): (
  data: unknown,
  context: ExecutionContext,
) => unknown {
  class Probe {
    handler(@CurrentUser() user: unknown) {
      return user;
    }
  }

  const metadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    Probe,
    'handler',
  ) as Record<
    string,
    { factory: (data: unknown, context: ExecutionContext) => unknown }
  >;

  return metadata[Object.keys(metadata)[0]].factory;
}

describe('CurrentUser', () => {
  it('returns the user stored on the request', () => {
    const user = { userId: '3' };
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as ExecutionContext;

    expect(currentUserFactory()(undefined, context)).toBe(user);
  });
});
