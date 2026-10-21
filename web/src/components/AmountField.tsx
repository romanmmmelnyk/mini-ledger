import { forwardRef, type ReactNode } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  symbol: string;
  invalid?: boolean;
  endSlot?: ReactNode;
};

export const AmountField = forwardRef<HTMLInputElement, Props>(function AmountField(
  { value, onChange, symbol, invalid, endSlot },
  ref,
) {
  return (
    <div className="field">
      <label className="field-label" htmlFor="amount">
        Amount
      </label>
      <div className="input-affix">
        <span className="affix num">{symbol}</span>
        <input
          ref={ref}
          id="amount"
          className="input num"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          value={value}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        {endSlot ? <span className="affix-end">{endSlot}</span> : null}
      </div>
    </div>
  );
});
