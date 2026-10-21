import NumberFlow from '@number-flow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AccountSettingsDialog, SendDialog, TopUpDialog } from '../components/dialogs';
import { HistoryRow } from '../components/HistoryRow';
import { ArrowLeft, ArrowUpRight, Download, Logout, Settings } from '../components/icons';
import { api, errorText, type Account, type HistoryEntry } from '../lib/api';
import { dayKey, formatDateTime, formatDayHeading } from '../lib/format';
import { accountTypeLabel } from '../lib/money';
import { useSession } from '../lib/session';

type Status = 'loading' | 'ready' | 'missing' | 'error';
type DialogKind = 'topup' | 'send' | 'settings';

const BALANCE_TIMING = { duration: 380, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' };

export function AccountPage() {
  const accountId = Number(useParams().id);
  const logout = useSession((state) => state.logout);
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [active, setActive] = useState(0);
  const [dialog, setDialog] = useState<{ kind: DialogKind; open: boolean }>({
    kind: 'topup',
    open: false,
  });
  const stickyRef = useRef<HTMLDivElement>(null);

  const account = accounts.find((item) => item.id === accountId);

  const load = useCallback(async () => {
    try {
      const mine = await api<Account[]>('/account/my');
      setAccounts(mine);
      if (!mine.some((item) => item.id === accountId)) {
        setStatus('missing');
        return;
      }
      setEntries(await api<HistoryEntry[]>(`/account/${accountId}/history`));
      setStatus('ready');
    } catch (cause) {
      if (!useSession.getState().token) {
        toast.error(errorText(cause));
        return;
      }
      setStatus('error');
    }
  }, [accountId]);

  useEffect(() => {
    setStatus('loading');
    void load();
  }, [load]);

  useEffect(() => {
    if (status !== 'ready') return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const bar = stickyRef.current;
      if (!bar) return;
      const edge = bar.getBoundingClientRect().bottom;
      const rows = document.querySelectorAll<HTMLElement>('[data-row]');
      let next = Math.max(rows.length - 1, 0);
      for (const row of rows) {
        const box = row.getBoundingClientRect();
        if (box.top + box.height / 2 > edge) {
          next = Number(row.dataset.index);
          break;
        }
      }
      setActive(next);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [status, entries]);

  const groups = useMemo(() => {
    const result: { key: string; heading: string; items: { entry: HistoryEntry; index: number }[] }[] = [];
    entries.forEach((entry, index) => {
      const key = dayKey(entry.date);
      const last = result[result.length - 1];
      if (last?.key === key) last.items.push({ entry, index });
      else result.push({ key, heading: formatDayHeading(entry.date), items: [{ entry, index }] });
    });
    return result;
  }, [entries]);

  const openDialog = (kind: DialogKind) => setDialog({ kind, open: true });
  const setDialogOpen = (kind: DialogKind) => (open: boolean) =>
    setDialog((current) => (current.kind === kind ? { ...current, open } : current));

  function signOut() {
    logout();
    navigate('/', { replace: true });
  }

  const historical = entries.length > 0 && active > 0;
  const shownBalance = account ? (historical ? entries[active].balance : account.balance) : 0;
  const caption = historical
    ? `Balance on ${formatDateTime(entries[active].date)}`
    : 'Current balance';

  return (
    <div className="dash">
      <header className="dash-nav">
        <div className="container dash-nav-inner">
          <Link to="/app" className="btn btn-ghost btn-sm">
            <ArrowLeft width={18} height={18} />
            Accounts
          </Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={signOut}>
            <Logout width={18} height={18} />
            Sign out
          </button>
        </div>
      </header>

      <main className="container acct-main">
        {status === 'loading' ? (
          <div className="skeleton skeleton-bar" aria-hidden="true" />
        ) : null}

        {status === 'missing' ? (
          <div className="state-card">
            <h2>Account not found</h2>
            <p>It may have been deleted, or it belongs to someone else.</p>
            <Link to="/app" className="btn btn-primary">
              Back to accounts
            </Link>
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="state-card" role="alert">
            <h2>Couldn't load this account</h2>
            <p>Check your connection to the server and try again.</p>
            <button type="button" className="btn btn-primary" onClick={() => void load()}>
              Try again
            </button>
          </div>
        ) : null}

        {status === 'ready' && account ? (
          <>
            <div className="acct-sticky" ref={stickyRef}>
              <div className="bank-card acct-bar" data-currency={account.currency.code}>
                <div className="acct-bar-info">
                  <span className="bank-card-label num">
                    {accountTypeLabel(account.type)} · #{account.id} · {account.currency.code}
                  </span>
                  <span className="bank-card-balance num">
                    <NumberFlow
                      value={shownBalance}
                      locales="en-US"
                      transformTiming={BALANCE_TIMING}
                      spinTiming={BALANCE_TIMING}
                      opacityTiming={{ duration: 200, easing: 'ease-out' }}
                      format={{
                        style: 'currency',
                        currency: account.currency.code,
                        currencyDisplay: 'narrowSymbol',
                      }}
                    />
                  </span>
                  <span className="acct-bar-caption" aria-live="polite">
                    {caption}
                  </span>
                </div>
                <div className="card-actions">
                  <button type="button" className="card-action" onClick={() => openDialog('send')}>
                    Send
                    <ArrowUpRight width={16} height={16} />
                  </button>
                  <button
                    type="button"
                    className="card-icon-btn"
                    aria-label="Top up account"
                    onClick={() => openDialog('topup')}
                  >
                    <Download width={16} height={16} />
                  </button>
                  <button
                    type="button"
                    className="card-icon-btn"
                    aria-label="Account settings"
                    onClick={() => openDialog('settings')}
                  >
                    <Settings width={16} height={16} />
                  </button>
                </div>
              </div>
            </div>

            <section className="history" aria-label="Transaction history">
              <h1 className="history-title">Transaction history</h1>
              {groups.length === 0 ? (
                <div className="state-card empty-history">
                  <h2>No transactions yet</h2>
                  <p>Top up the account and your first transaction will show up here.</p>
                  <button type="button" className="btn btn-primary" onClick={() => openDialog('topup')}>
                    <Download width={18} height={18} />
                    Top up
                  </button>
                </div>
              ) : (
                groups.map((group) => (
                  <div key={group.key} className="day">
                    <h2 className="day-heading">{group.heading}</h2>
                    <ul className="tx-list">
                      {group.items.map(({ entry, index }) => (
                        <HistoryRow
                          key={entry.id}
                          entry={entry}
                          index={index}
                          showBalance
                          ownAccountIds={new Set(accounts.map((item) => item.id))}
                        />
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </section>

            <TopUpDialog
              open={dialog.open && dialog.kind === 'topup'}
              onOpenChange={setDialogOpen('topup')}
              accounts={accounts}
              accountId={account.id}
              onDone={load}
            />
            <SendDialog
              open={dialog.open && dialog.kind === 'send'}
              onOpenChange={setDialogOpen('send')}
              accounts={accounts}
              accountId={account.id}
              onDone={load}
            />
            <AccountSettingsDialog
              open={dialog.open && dialog.kind === 'settings'}
              onOpenChange={setDialogOpen('settings')}
              account={account}
              hasHistory={entries.length > 0}
              onDeleted={() => navigate('/app', { replace: true })}
            />
          </>
        ) : null}
      </main>
    </div>
  );
}
