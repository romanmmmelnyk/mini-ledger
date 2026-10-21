import type { Account } from './api';

const KOPIYKAS = /^\d+(?:[.,]\d{1,2})?$/;

export function toMinorUnits(value: string): number | null {
  const trimmed = value.trim().replace(/\s/g, '');
  if (!KOPIYKAS.test(trimmed)) return null;
  const [whole, fraction = ''] = trimmed.replace(',', '.').split('.');
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(minor) && minor > 0 ? minor : null;
}

export function formatMoney(amount: number, code: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
    currencyDisplay: 'narrowSymbol',
  }).format(amount);
}

export function totalsByCurrency(accounts: Account[]) {
  const totals = new Map<string, { code: string; symbol: string; amount: number }>();
  for (const account of accounts) {
    const entry = totals.get(account.currency.code) ?? {
      code: account.currency.code,
      symbol: account.currency.symbol,
      amount: 0,
    };
    entry.amount += account.balance;
    totals.set(account.currency.code, entry);
  }
  return [...totals.values()].sort((a, b) => b.amount - a.amount);
}

export const ACCOUNT_TYPES = [
  { value: 'STANDARD', label: 'Checking', hint: 'Everyday payments and transfers' },
  { value: 'SAVING', label: 'Savings', hint: 'Set money aside for goals' },
  { value: 'STUDENT', label: 'Student', hint: 'For studies and daily life' },
  { value: 'BUSINESS', label: 'Business', hint: 'For work and clients' },
] as const;

export const CURRENCIES = [
  { code: 'UAH', symbol: '₴', name: 'Hryvnia' },
  { code: 'USD', symbol: '$', name: 'US dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
] as const;

export function accountTypeLabel(type: string) {
  return ACCOUNT_TYPES.find((item) => item.value === type)?.label ?? type;
}
