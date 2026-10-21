import NumberFlow from '@number-flow/react';
import { useMemo, useState, type ComponentProps } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Account, HistoryEntry } from '../lib/api';
import { balanceSeries, periodStats, type Range } from '../lib/analytics';
import { formatShortDay } from '../lib/format';
import { formatMoney, totalsByCurrency } from '../lib/money';
import { Segmented } from './Segmented';

type Props = { accounts: Account[]; entries: HistoryEntry[] };

const RANGES = [
  { value: 7, label: '7D' },
  { value: 30, label: '30D' },
  { value: 90, label: '90D' },
] as const;

type FlowFormat = NonNullable<ComponentProps<typeof NumberFlow>['format']>;

const moneyFormat = (currency: string): FlowFormat => ({
  style: 'currency',
  currency,
  currencyDisplay: 'narrowSymbol',
});

function ChartTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: { payload: { t: number; value: number } }[];
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="chart-tip">
      <span>{formatShortDay(point.t)}</span>
      <strong className="num">{formatMoney(point.value, currency)}</strong>
    </div>
  );
}

function Stat({
  label,
  value,
  currency,
  tone,
}: {
  label: string;
  value: number;
  currency?: string;
  tone?: 'in' | 'out';
}) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value num" data-tone={tone}>
        <NumberFlow
          value={value}
          locales="en-US"
          format={currency ? moneyFormat(currency) : undefined}
        />
      </span>
    </div>
  );
}

export function OverviewPanel({ accounts, entries }: Props) {
  const totals = useMemo(() => totalsByCurrency(accounts), [accounts]);
  const [picked, setPicked] = useState<string | null>(null);
  const [days, setDays] = useState<Range>(30);

  const currency = totals.some((total) => total.code === picked) ? picked! : totals[0].code;
  const total = totals.find((item) => item.code === currency)!;

  const series = useMemo(() => balanceSeries(entries, currency, days), [entries, currency, days]);
  const stats = useMemo(
    () => periodStats(entries, accounts, currency, days),
    [entries, accounts, currency, days],
  );

  const start = series[0].value;
  const delta = Math.round((total.amount - start) * 100) / 100;
  const percent = start > 0 ? delta / start : null;
  const tone = delta > 0 ? 'in' : delta < 0 ? 'out' : undefined;

  return (
    <section className="overview" aria-label="Balance overview">
      <div className="overview-main">
        <div className="overview-top">
          {totals.length > 1 ? (
            <Segmented
              label="Currency"
              options={totals.map((item) => ({ value: item.code, label: item.code }))}
              value={currency}
              onChange={setPicked}
            />
          ) : (
            <span className="overview-label">Total balance, {currency}</span>
          )}
          <Segmented
            label="Period"
            options={RANGES.map((range) => ({ value: range.value, label: range.label }))}
            value={days}
            onChange={setDays}
          />
        </div>

        <div className="overview-value num">
          <NumberFlow value={total.amount} locales="en-US" format={moneyFormat(currency)} />
        </div>
        <p className="overview-delta" data-tone={tone}>
          <span className="num">
            <NumberFlow
              value={delta}
              locales="en-US"
              format={{ ...moneyFormat(currency), signDisplay: 'exceptZero' }}
            />
            {percent !== null ? (
              <>
                {' '}
                <NumberFlow
                  value={percent}
                  locales="en-US"
                  format={{ style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' }}
                />
              </>
            ) : null}
          </span>
          <span className="overview-delta-note"> over {days} days</span>
        </p>

        <div className="chart" role="img" aria-label={`${currency} balance over ${days} days`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={formatShortDay}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={48}
                stroke="var(--muted)"
                fontSize={12}
              />
              <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip
                content={<ChartTooltip currency={currency} />}
                cursor={{ stroke: 'var(--line-strong)' }}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--accent)"
                strokeWidth={2}
                fill="url(#balanceFill)"
                isAnimationActive={false}
                activeDot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overview-stats">
        <Stat label={`Income, ${days}D`} value={stats.income} currency={currency} tone="in" />
        <Stat label={`Spending, ${days}D`} value={stats.spending} currency={currency} tone="out" />
        <Stat label="Transactions" value={stats.count} />
      </div>
    </section>
  );
}
