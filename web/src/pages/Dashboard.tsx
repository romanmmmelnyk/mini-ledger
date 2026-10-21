import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BankCard } from '../components/BankCard';
import { OpenAccountDialog, SendDialog, TopUpDialog } from '../components/dialogs';
import { HistoryRow } from '../components/HistoryRow';
import { OverviewPanel } from '../components/OverviewPanel';
import { ArrowUpRight, Check, Copy, Download, Logout, Plus } from '../components/icons';
import { Logo } from '../components/Logo';
import { api, errorText, type Account, type HistoryEntry } from '../lib/api';
import { accountTypeLabel } from '../lib/money';
import { useSession } from '../lib/session';

type Status = 'loading' | 'ready' | 'error';
type DialogKind = 'topup' | 'send' | 'open';
type DialogState = { kind: DialogKind; accountId: number | null; open: boolean };

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function CopyNumber({ id }: { id: number }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(String(id));
      setCopied(true);
    } catch {
      toast.error('Couldn’t copy the number');
    }
  }

  return (
    <button
      type="button"
      className="card-icon-btn"
      onClick={copy}
      aria-label={copied ? 'Number copied' : `Copy account number ${id}`}
    >
      {copied ? <Check width={16} height={16} /> : <Copy width={16} height={16} />}
    </button>
  );
}

function Skeletons() {
  return (
    <div className="accounts-grid" aria-hidden="true">
      {[0, 1, 2].map((key) => (
        <div key={key} className="skeleton skeleton-card" />
      ))}
    </div>
  );
}

export function Dashboard() {
  const logout = useSession((state) => state.logout);
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [dialog, setDialog] = useState<DialogState>({ kind: 'send', accountId: null, open: false });

  const load = useCallback(async () => {
    try {
      const [mine, history] = await Promise.all([
        api<Account[]>('/account/my'),
        api<HistoryEntry[]>('/account/history'),
      ]);
      setAccounts(mine);
      setEntries(history);
      setStatus('ready');
    } catch (cause) {
      if (!useSession.getState().token) {
        toast.error(errorText(cause));
        return;
      }
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openDialog = (kind: DialogKind, accountId: number | null = null) =>
    setDialog({ kind, accountId, open: true });
  const setDialogOpen = (kind: DialogKind) => (open: boolean) =>
    setDialog((current) => (current.kind === kind ? { ...current, open } : current));

  function signOut() {
    logout();
    navigate('/', { replace: true });
  }

  const ownIds = new Set(accounts.map((account) => account.id));
  const hasAccounts = accounts.length > 0;
  const dialogProps = (kind: DialogKind) => ({
    open: dialog.open && dialog.kind === kind,
    onOpenChange: setDialogOpen(kind),
    accounts,
    accountId: dialog.accountId,
    onDone: load,
  });

  return (
    <div className="dash">
      <header className="dash-nav">
        <div className="container dash-nav-inner">
          <Logo />
          <button type="button" className="btn btn-ghost btn-sm" onClick={signOut}>
            <Logout width={18} height={18} />
            Sign out
          </button>
        </div>
      </header>

      <main className="container dash-main">
        <section className="dash-hero">
          <div>
            <p className="dash-eyebrow">{greeting()}</p>
            <h1>Your accounts</h1>
          </div>
          <div className="dash-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!hasAccounts}
              onClick={() => openDialog('send')}
            >
              <ArrowUpRight width={18} height={18} />
              Send
            </button>
            <button
              type="button"
              className="btn"
              disabled={!hasAccounts}
              onClick={() => openDialog('topup')}
            >
              <Download width={18} height={18} />
              Top up
            </button>
            <button type="button" className="btn" onClick={() => openDialog('open')}>
              <Plus width={18} height={18} />
              New account
            </button>
          </div>
        </section>

        {status === 'loading' ? (
          <>
            <Skeletons />
            <div className="skeleton skeleton-overview" aria-hidden="true" />
          </>
        ) : null}

        {status === 'error' ? (
          <div className="state-card" role="alert">
            <h2>Couldn't load your accounts</h2>
            <p>Check your connection to the server and try again.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setStatus('loading');
                void load();
              }}
            >
              Try again
            </button>
          </div>
        ) : null}

        {status === 'ready' && !hasAccounts ? (
          <div className="state-card empty">
            <div className="empty-art" aria-hidden="true">
              <span />
              <span />
            </div>
            <h2>Open your first account</h2>
            <p>
              Choose a currency and account type, then top up your balance and send money.
            </p>
            <button type="button" className="btn btn-primary btn-lg" onClick={() => openDialog('open')}>
              <Plus width={18} height={18} />
              Open account
            </button>
          </div>
        ) : null}

        {status === 'ready' && hasAccounts ? (
          <>
            <h2 className="section-title section-title-first">Accounts</h2>
            <section className="accounts-grid" aria-label="Accounts">
              {accounts.map((account) => (
                <BankCard
                  key={account.id}
                  className="account-card"
                  code={account.currency.code}
                  label={accountTypeLabel(account.type)}
                  number={`#${account.id}`}
                  href={`/app/accounts/${account.id}`}
                  linkLabel={`Open account #${account.id}`}
                  balance={account.balance}
                  footer={
                    <div className="card-actions">
                      <CopyNumber id={account.id} />
                      <button
                        type="button"
                        className="card-icon-btn"
                        aria-label={`Top up account ${account.id}`}
                        onClick={() => openDialog('topup', account.id)}
                      >
                        <Download width={16} height={16} />
                      </button>
                      <button
                        type="button"
                        className="card-action"
                        onClick={() => openDialog('send', account.id)}
                      >
                        Send
                        <ArrowUpRight width={16} height={16} />
                      </button>
                    </div>
                  }
                />
              ))}
            </section>

            <h2 className="section-title">Analytics</h2>
            <OverviewPanel accounts={accounts} entries={entries} />

            {entries.length > 0 ? (
              <>
                <h2 className="section-title">Recent activity</h2>
                <ul className="tx-list tx-card">
                  {entries.slice(0, 6).map((entry) => {
                    const owner = accounts.find((account) => account.id === entry.accountId);
                    return (
                      <HistoryRow
                        key={entry.id}
                        entry={entry}
                        ownAccountIds={ownIds}
                        to={`/app/accounts/${entry.accountId}`}
                        accountLabel={owner ? `${accountTypeLabel(owner.type)} #${owner.id}` : undefined}
                      />
                    );
                  })}
                </ul>
              </>
            ) : null}
          </>
        ) : null}
      </main>

      <TopUpDialog {...dialogProps('topup')} />
      <SendDialog {...dialogProps('send')} />
      <OpenAccountDialog
        open={dialog.open && dialog.kind === 'open'}
        onOpenChange={setDialogOpen('open')}
        onDone={load}
      />
    </div>
  );
}
