import { useRef, useState, type FormEvent, type RefObject } from 'react';
import { toast } from 'sonner';
import { api, errorText, type Account, type AccountType, type SendResult } from '../lib/api';
import {
  ACCOUNT_TYPES,
  accountTypeLabel,
  CURRENCIES,
  formatMoney,
  toMinorUnits,
} from '../lib/money';
import { AccountSelect } from './AccountSelect';
import { AmountField } from './AmountField';
import { Alert } from './icons';
import { Modal } from './Modal';

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  accountId: number | null;
  onDone: () => Promise<void> | void;
};

const rateFormat = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 5 });

const AMOUNT_ERROR = 'Enter an amount above zero, with up to two decimals';

function useSubmit(onSuccess: () => void) {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function run(task: () => Promise<void>) {
    setError('');
    setPending(true);
    try {
      await task();
      onSuccess();
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setPending(false);
    }
  }

  return { error, setError, pending, run };
}

function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="form-error" role="alert">
      <Alert />
      {message}
    </p>
  );
}

function SubmitButton({ pending, children }: { pending: boolean; children: string }) {
  return (
    <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending}>
      {pending ? <span className="spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

/* ───────── Top up ───────── */

export function TopUpDialog(props: DialogProps) {
  const focusRef = useRef<HTMLInputElement>(null);
  return (
    <Modal
      open={props.open}
      onOpenChange={props.onOpenChange}
      title="Top up account"
      description="Funds appear on the account right away."
      initialFocus={focusRef}
    >
      <TopUpForm {...props} focusRef={focusRef} />
    </Modal>
  );
}

function TopUpForm({
  accounts,
  accountId,
  onDone,
  onOpenChange,
  focusRef,
}: DialogProps & { focusRef: RefObject<HTMLInputElement | null> }) {
  const [from, setFrom] = useState<number | null>(accountId ?? accounts[0]?.id ?? null);
  const [amount, setAmount] = useState('');
  const { error, setError, pending, run } = useSubmit(() => onOpenChange(false));
  const account = accounts.find((item) => item.id === from);

  function submit(event: FormEvent) {
    event.preventDefault();
    const minor = toMinorUnits(amount);
    if (!account || minor === null) return setError(AMOUNT_ERROR);

    void run(async () => {
      await api('/payment/topup', { body: { accountId: account.id, amount: minor } });
      toast.success(`Topped up ${formatMoney(minor / 100, account.currency.code)}`);
      void onDone();
    });
  }

  return (
    <form className="dialog-form" onSubmit={submit} noValidate>
      <AccountSelect label="Account" accounts={accounts} value={from} onChange={setFrom} />
      <AmountField
        ref={focusRef}
        value={amount}
        onChange={setAmount}
        symbol={account?.currency.symbol ?? ''}
        invalid={!!error}
      />
      <div className="chips">
        {[100, 500, 1000].map((preset) => (
          <button key={preset} type="button" className="chip num" onClick={() => setAmount(String(preset))}>
            +{preset}
          </button>
        ))}
      </div>
      <FormError message={error} />
      <SubmitButton pending={pending}>Top up</SubmitButton>
    </form>
  );
}

/* ───────── Send ───────── */

export function SendDialog(props: DialogProps) {
  const focusRef = useRef<HTMLInputElement>(null);
  return (
    <Modal
      open={props.open}
      onOpenChange={props.onOpenChange}
      title="Send money"
      description="Enter the recipient’s account number. If the currencies differ, the amount is converted at the current rate."
      initialFocus={focusRef}
    >
      <SendForm {...props} focusRef={focusRef} />
    </Modal>
  );
}

function SendForm({
  accounts,
  accountId,
  onDone,
  onOpenChange,
  focusRef,
}: DialogProps & { focusRef: RefObject<HTMLInputElement | null> }) {
  const [from, setFrom] = useState<number | null>(accountId ?? accounts[0]?.id ?? null);
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const { error, setError, pending, run } = useSubmit(() => onOpenChange(false));
  const account = accounts.find((item) => item.id === from);
  const own = accounts.filter((item) => item.id !== from);

  function submit(event: FormEvent) {
    event.preventDefault();
    const receiverId = Number(receiver);
    const minor = toMinorUnits(amount);
    if (!account) return setError('Choose the account to send from');
    if (!Number.isInteger(receiverId) || receiverId <= 0) {
      return setError('Enter the recipient’s account number');
    }
    if (receiverId === account.id) return setError('Choose two different accounts');
    if (minor === null) return setError(AMOUNT_ERROR);
    if (minor / 100 > account.balance) return setError('Not enough funds in the account');

    void run(async () => {
      const result = await api<SendResult>('/payment/send', {
        body: { senderAccountId: account.id, receiverAccountId: receiverId, amount: minor },
      });
      const sent = formatMoney(minor / 100, account.currency.code);
      toast.success(
        result.rate !== 1
          ? `Sent ${sent} to account #${receiverId} at rate ${rateFormat.format(result.rate)}`
          : `Sent ${sent} to account #${receiverId}`,
      );
      void onDone();
    });
  }

  return (
    <form className="dialog-form" onSubmit={submit} noValidate>
      <AccountSelect label="From account" accounts={accounts} value={from} onChange={setFrom} />
      <div className="field">
        <label className="field-label" htmlFor="receiver">
          Recipient account
        </label>
        <input
          id="receiver"
          className="input num"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Account number, e.g. 1024"
          value={receiver}
          onChange={(event) => setReceiver(event.target.value.replace(/\D/g, ''))}
        />
        {own.length > 0 ? (
          <div className="chips">
            {own.map((item) => (
              <button
                key={item.id}
                type="button"
                className="chip num"
                onClick={() => setReceiver(String(item.id))}
              >
                My #{item.id} · {item.currency.code}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <AmountField
        ref={focusRef}
        value={amount}
        onChange={setAmount}
        symbol={account?.currency.symbol ?? ''}
        invalid={!!error}
        endSlot={
          account && account.balance > 0 ? (
            <button
              type="button"
              className="chip"
              onClick={() => setAmount(account.balance.toFixed(2))}
            >
              Max
            </button>
          ) : null
        }
      />
      <FormError message={error} />
      <SubmitButton pending={pending}>Send</SubmitButton>
    </form>
  );
}

/* ───────── Open account ───────── */

export function OpenAccountDialog({
  open,
  onOpenChange,
  onDone,
}: Pick<DialogProps, 'open' | 'onOpenChange' | 'onDone'>) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New account"
      description="You can open each account type only once per currency."
    >
      <OpenAccountForm onDone={onDone} onOpenChange={onOpenChange} />
    </Modal>
  );
}

function OpenAccountForm({
  onDone,
  onOpenChange,
}: Pick<DialogProps, 'onDone' | 'onOpenChange'>) {
  const [currency, setCurrency] = useState<string>('UAH');
  const [type, setType] = useState<AccountType>('STANDARD');
  const { error, pending, run } = useSubmit(() => onOpenChange(false));

  function submit(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      await api('/account/create', { body: { type, currency_code: currency } });
      toast.success('Account opened');
      void onDone();
    });
  }

  return (
    <form className="dialog-form" onSubmit={submit}>
      <fieldset className="field fieldset">
        <legend className="field-label">Currency</legend>
        <div className="choice-grid choice-grid-3">
          {CURRENCIES.map((item) => (
            <label key={item.code} className="choice">
              <input
                type="radio"
                name="currency"
                value={item.code}
                checked={currency === item.code}
                onChange={() => setCurrency(item.code)}
              />
              <span className="choice-body">
                <span className="choice-title num">
                  {item.symbol} {item.code}
                </span>
                <span className="choice-hint">{item.name}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="field fieldset">
        <legend className="field-label">Account type</legend>
        <div className="choice-grid">
          {ACCOUNT_TYPES.map((item) => (
            <label key={item.value} className="choice">
              <input
                type="radio"
                name="type"
                value={item.value}
                checked={type === item.value}
                onChange={() => setType(item.value)}
              />
              <span className="choice-body">
                <span className="choice-title">{item.label}</span>
                <span className="choice-hint">{item.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <FormError message={error} />
      <SubmitButton pending={pending}>Open account</SubmitButton>
    </form>
  );
}

/* ───────── Account settings ───────── */

type SettingsProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account;
  hasHistory: boolean;
  onDeleted: () => void;
};

export function AccountSettingsDialog({ open, onOpenChange, account, hasHistory, onDeleted }: SettingsProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Account settings"
      description={`${accountTypeLabel(account.type)} · ${account.currency.code} · #${account.id}`}
    >
      <SettingsBody account={account} hasHistory={hasHistory} onDeleted={onDeleted} onClose={() => onOpenChange(false)} />
    </Modal>
  );
}

function SettingsBody({
  account,
  hasHistory,
  onDeleted,
  onClose,
}: {
  account: Account;
  hasHistory: boolean;
  onDeleted: () => void;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const { error, pending, run } = useSubmit(() => undefined);

  function remove() {
    void run(async () => {
      await api(`/account/${account.id}`, { method: 'DELETE' });
      toast.success('Account deleted');
      onDeleted();
    });
  }

  return (
    <div className="dialog-form">
      <dl className="info-list">
        <div>
          <dt>Type</dt>
          <dd>{accountTypeLabel(account.type)}</dd>
        </div>
        <div>
          <dt>Currency</dt>
          <dd>
            {CURRENCIES.find((item) => item.code === account.currency.code)?.name ?? account.currency.name} ({account.currency.code})
          </dd>
        </div>
        <div>
          <dt>Account number</dt>
          <dd className="num">{account.id}</dd>
        </div>
        <div>
          <dt>Balance</dt>
          <dd className="num">{formatMoney(account.balance, account.currency.code)}</dd>
        </div>
      </dl>

      <section className="danger-zone">
        <h3>Delete account</h3>
        {hasHistory ? (
          <p>
            This account has transactions, so it can't be deleted — the transfer history
            has to be kept.
          </p>
        ) : (
          <p>This account has no transactions yet, so it can be deleted. This can't be undone.</p>
        )}
        <FormError message={error} />
        {confirming ? (
          <div className="confirm-row">
            <button type="button" className="btn" onClick={() => setConfirming(false)} disabled={pending}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger-solid" onClick={remove} disabled={pending}>
              {pending ? <span className="spinner" aria-hidden="true" /> : null}
              Yes, delete
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-danger"
            disabled={hasHistory}
            onClick={() => setConfirming(true)}
          >
            Delete account
          </button>
        )}
      </section>

      <button type="button" className="btn btn-block" onClick={onClose}>
        Done
      </button>
    </div>
  );
}
