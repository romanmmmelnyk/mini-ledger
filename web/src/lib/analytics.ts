import type { Account, HistoryEntry } from './api';

export const DAY = 86_400_000;
export type Range = 7 | 30 | 90;

export type SeriesPoint = { t: number; value: number };

const round = (value: number) => Math.round(value * 100) / 100;

function balanceAt(timeline: { t: number; balance: number }[], t: number) {
  let low = 0;
  let high = timeline.length - 1;
  let found = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (timeline[mid].t <= t) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found < 0 ? 0 : timeline[found].balance;
}

export function balanceSeries(
  entries: HistoryEntry[],
  currency: string,
  days: number,
  now = Date.now(),
): SeriesPoint[] {
  const timelines = new Map<number, { t: number; balance: number }[]>();
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    if (entry.currency_code !== currency) continue;
    const list = timelines.get(entry.accountId) ?? [];
    list.push({ t: Date.parse(entry.date), balance: entry.balance });
    timelines.set(entry.accountId, list);
  }

  const points: SeriesPoint[] = [];
  for (let i = 0; i <= days; i++) {
    const t = now - (days - i) * DAY;
    let total = 0;
    for (const timeline of timelines.values()) total += balanceAt(timeline, t);
    points.push({ t, value: round(total) });
  }
  return points;
}

export function periodStats(
  entries: HistoryEntry[],
  accounts: Account[],
  currency: string,
  days: number,
  now = Date.now(),
) {
  const own = new Set(accounts.map((account) => account.id));
  const since = now - days * DAY;
  let income = 0;
  let spending = 0;
  let count = 0;

  for (const entry of entries) {
    if (entry.currency_code !== currency || Date.parse(entry.date) < since) continue;
    count += 1;
    const internal = entry.counterpartyAccountId !== null && own.has(entry.counterpartyAccountId);
    if (internal) continue;
    if (entry.amount > 0) income += entry.amount;
    else spending += -entry.amount;
  }
  return { income: round(income), spending: round(spending), count };
}
