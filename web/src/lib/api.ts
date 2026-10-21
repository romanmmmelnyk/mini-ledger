import { useSession } from './session';

export type Currency = { code: string; name: string; symbol: string };
export type AccountType = 'STANDARD' | 'SAVING' | 'STUDENT' | 'BUSINESS';
export type Account = {
  id: number;
  type: AccountType;
  currency: Currency;
  user_id: number;
  balance: number;
};
export type SendResult = {
  status: string;
  transactionId: number;
  amount: number;
  rate: number;
  senderBalance: number;
  receiverBalance: number;
};

export type HistoryEntry = {
  id: number;
  transactionId: number;
  type: 'TRANSFER' | 'TOP_UP' | 'WITHDRAWAL';
  date: string;
  accountId: number;
  currency_code: string;
  amount: number;
  balance: number;
  counterpartyAccountId: number | null;
  rate: number;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const KNOWN_MESSAGES: Record<string, string> = {
  'Invalid credentials': 'Incorrect email or password',
  'Not enough funds': 'Not enough funds in the account',
  'Use two different accounts': 'Choose two different accounts',
  'Receiver account not found': 'Recipient account not found',
  'Account not found': 'Account not found',
  'This account type and currency are already in use.':
    'You already have this account type in this currency',
  'Invalid currency code': 'Unknown currency',
  'Amount must be a positive number': 'Amount must be greater than zero',
};

function translate(message: string) {
  return KNOWN_MESSAGES[message] ?? message;
}

export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const { token, logout } = useSession.getState();
  const headers = new Headers({ 'content-type': 'application/json' });
  if (token) headers.set('authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(path, {
      method: init.method ?? (init.body ? 'POST' : 'GET'),
      headers,
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError('Can’t reach the server', 0);
  }

  const text = await response.text();
  let body: { message?: string | string[] } = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    /* non-JSON error body */
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      logout();
      throw new ApiError('Your session has expired. Please sign in again', 401);
    }
    const raw = Array.isArray(body.message) ? body.message[0] : body.message;
    throw new ApiError(
      raw ? translate(raw) : 'Something went wrong. Please try again',
      response.status,
    );
  }
  return body as T;
}

export function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}
