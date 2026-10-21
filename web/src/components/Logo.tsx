export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <rect x="8" y="10" width="16" height="4" rx="2" fill="var(--accent-ink)" />
      <rect x="8" y="18" width="10" height="4" rx="2" fill="var(--accent-ink)" opacity=".7" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="logo">
      <LogoMark />
      <span>mini-ledger</span>
    </span>
  );
}
