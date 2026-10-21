import NumberFlow from '@number-flow/react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  code: string;
  label: string;
  number: string;
  balance: number;
  footer?: ReactNode;
  className?: string;
  href?: string;
  linkLabel?: string;
};

export function BankCard({ code, label, number, balance, footer, className, href, linkLabel }: Props) {
  return (
    <article className={`bank-card ${className ?? ''}`} data-currency={code} data-linked={href ? '' : undefined}>
      {href ? <Link to={href} className="bank-card-link" aria-label={linkLabel} /> : null}
      <header className="bank-card-top">
        <span className="bank-card-label">{label}</span>
        <span className="bank-card-code">{code}</span>
      </header>
      <div className="bank-card-balance num">
        <NumberFlow
          value={balance}
          locales="en-US"
          format={{
            style: 'currency',
            currency: code,
            currencyDisplay: 'narrowSymbol',
          }}
        />
      </div>
      <div className="bank-card-bottom">
        <span className="bank-card-number num">{number}</span>
        {footer}
      </div>
    </article>
  );
}
