import { Select } from '@base-ui/react/select';
import type { Account } from '../lib/api';
import { accountTypeLabel, formatMoney } from '../lib/money';
import { Check, Chevrons } from './icons';

function Option({ account }: { account: Account }) {
  return (
    <span className="account-option">
      <span className="account-option-title">
        {accountTypeLabel(account.type)}
        <small className="num">
          {account.currency.code} · #{account.id}
        </small>
      </span>
      <span className="account-option-sub num">
        {formatMoney(account.balance, account.currency.code)}
      </span>
    </span>
  );
}

type Props = {
  label: string;
  accounts: Account[];
  value: number | null;
  onChange: (id: number) => void;
};

export function AccountSelect({ label, accounts, value, onChange }: Props) {
  const items = accounts.map((account) => ({
    value: account.id,
    label: `${accountTypeLabel(account.type)} ${account.currency.code}`,
  }));

  return (
    <Select.Root
      items={items}
      value={value}
      onValueChange={(next) => {
        if (typeof next === 'number') onChange(next);
      }}
    >
      <div className="field">
        <Select.Label className="field-label">{label}</Select.Label>
        <Select.Trigger className="select-trigger">
          <Select.Value placeholder="Select an account">
            {(id: number | null) => {
              const account = accounts.find((item) => item.id === id);
              return account ? <Option account={account} /> : 'Select an account';
            }}
          </Select.Value>
          <Select.Icon>
            <Chevrons width={18} height={18} />
          </Select.Icon>
        </Select.Trigger>
      </div>
      <Select.Portal>
        <Select.Positioner
          className="select-positioner"
          sideOffset={6}
          alignItemWithTrigger={false}
        >
          <Select.Popup className="select-popup">
            <Select.List>
              {accounts.map((account) => (
                <Select.Item key={account.id} value={account.id} className="select-item">
                  <Select.ItemText>
                    <Option account={account} />
                  </Select.ItemText>
                  <Select.ItemIndicator className="select-item-indicator">
                    <Check width={16} height={16} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
