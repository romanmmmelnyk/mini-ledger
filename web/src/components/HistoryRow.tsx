import { Link } from 'react-router-dom';
import type { HistoryEntry } from '../lib/api';
import { formatTime } from '../lib/format';
import { formatMoney } from '../lib/money';

const rateFormat = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 5 });
import { ArrowRight, ArrowUpRight, Download, Swap } from './icons';

type Props = {
  entry: HistoryEntry;
  ownAccountIds?: Set<number>;
  accountLabel?: string;
  to?: string;
  showBalance?: boolean;
  index?: number;
};

function describe(entry: HistoryEntry, own?: Set<number>) {
  if (entry.type === 'TOP_UP') return { title: 'Top-up', icon: <Download width={18} height={18} /> };
  if (entry.type === 'WITHDRAWAL') return { title: 'Withdrawal', icon: <ArrowUpRight width={18} height={18} /> };

  const other = entry.counterpartyAccountId;
  const mine = other !== null && own?.has(other);
  const outgoing = entry.amount < 0;
  const title = mine
    ? outgoing
      ? `To your account #${other}`
      : `From your account #${other}`
    : outgoing
      ? `Transfer to #${other}`
      : `Transfer from #${other}`;
  return {
    title,
    icon: mine ? (
      <Swap width={18} height={18} />
    ) : outgoing ? (
      <ArrowUpRight width={18} height={18} />
    ) : (
      <ArrowRight width={18} height={18} style={{ rotate: '135deg' }} />
    ),
  };
}

export function HistoryRow({ entry, ownAccountIds, accountLabel, to, showBalance, index }: Props) {
  const { title, icon } = describe(entry, ownAccountIds);
  const sign = entry.amount > 0 ? 'in' : 'out';
  const sub = [
    formatTime(entry.date),
    accountLabel,
    entry.type === 'TRANSFER' && entry.rate !== 1 ? `rate ${rateFormat.format(entry.rate)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const body = (
    <>
      <span className="tx-icon" data-sign={sign}>
        {icon}
      </span>
      <span className="tx-body">
        <span className="tx-title">{title}</span>
        <span className="tx-sub num">{sub}</span>
      </span>
      <span className="tx-amounts">
        <span className="tx-amount num" data-sign={sign}>
          {entry.amount > 0 ? '+' : ''}
          {formatMoney(entry.amount, entry.currency_code)}
        </span>
        {showBalance ? (
          <span className="tx-balance num">{formatMoney(entry.balance, entry.currency_code)}</span>
        ) : null}
      </span>
    </>
  );

  return (
    <li className="tx-item" data-row data-index={index}>
      {to ? (
        <Link to={to} className="tx">
          {body}
        </Link>
      ) : (
        <div className="tx">{body}</div>
      )}
    </li>
  );
}
