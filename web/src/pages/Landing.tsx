import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BankCard } from '../components/BankCard';
import { ArrowRight, ArrowUpRight, Globe, Scale, Shield, Swap } from '../components/icons';
import { Logo } from '../components/Logo';
import { Reveal } from '../components/Reveal';
import { useSession } from '../lib/session';

const FEATURES = [
  {
    icon: Scale,
    title: 'Double-entry',
    text: 'Every transaction is two entries: a debit and a credit. An account’s balance always equals the sum of its entries, so everything adds up to the cent.',
    wide: true,
  },
  {
    icon: Globe,
    title: 'Multiple currencies',
    text: 'Accounts in hryvnia, dollars and euros. Transfers between currencies use the rate at the time of the transaction.',
  },
  {
    icon: Swap,
    title: 'No rounding errors',
    text: 'Amounts are stored as whole numbers of cents, so there are no fractional errors, even across millions of transactions.',
  },
  {
    icon: Shield,
    title: 'Secure by default',
    text: 'Passwords are stored as argon2id hashes, and sessions expire automatically after 15 minutes. You only ever see your own accounts.',
    wide: true,
  },
] as const;

const STEPS = [
  { title: 'Create your account', text: 'A name, an email and a password — and you are in.' },
  { title: 'Open an account', text: 'Choose a currency and a type: checking, savings, student or business.' },
  { title: 'Top up and send', text: 'Share an account number and the money reaches the recipient.' },
] as const;

function HeroVisual() {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setBalance(48250.75), 500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="hero-visual" aria-hidden="true">
      <BankCard
        className="hero-card hero-card-back"
        code="USD"
        label="Savings"
        number="#2048"
        balance={1240.5}
      />
      <BankCard
        className="hero-card hero-card-front"
        code="UAH"
        label="Checking"
        number="#1024"
        balance={balance}
        footer={<span className="bank-card-pill">Active</span>}
      />
      <div className="hero-receipt">
        <span className="hero-receipt-icon">
          <ArrowUpRight width={18} height={18} />
        </span>
        <span className="hero-receipt-body">
          <strong>Transfer completed</strong>
          <small>To account #2048</small>
        </span>
        <span className="hero-receipt-amount num">−250,00 ₴</span>
      </div>
    </div>
  );
}

export function Landing() {
  const signedIn = useSession((state) => !!state.token);

  return (
    <div className="landing">
      <header className="nav">
        <div className="container nav-inner">
          <Link to="/" aria-label="mini-ledger — home">
            <Logo />
          </Link>
          <nav className="nav-links" aria-label="Sections">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
          </nav>
          <div className="nav-actions">
            {signedIn ? (
              <Link to="/app" className="btn btn-primary btn-sm">
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="hero container">
          <div className="hero-copy">
            <span className="eyebrow">Double-entry · Multi-currency</span>
            <h1>
              Money that always <em>adds up</em>.
            </h1>
            <p className="hero-lead">
              mini-ledger is simple, reliable account bookkeeping. Open accounts in different
              currencies, top them up and send money by account number — every transaction is
              recorded twice, so your balance never drifts apart.
            </p>
            <div className="hero-cta">
              <Link to={signedIn ? '/app' : '/register'} className="btn btn-primary btn-lg">
                {signedIn ? 'Go to dashboard' : 'Create account'}
                <ArrowRight />
              </Link>
              {signedIn ? null : (
                <Link to="/login" className="btn btn-lg">
                  Sign in
                </Link>
              )}
            </div>
          </div>
          <HeroVisual />
        </section>

        <section id="features" className="section container">
          <Reveal>
            <div className="section-head">
              <span className="eyebrow">Features</span>
              <h2>Everything you need for honest bookkeeping</h2>
            </div>
          </Reveal>
          <div className="bento">
            {FEATURES.map((feature, index) => (
              <Reveal
                key={feature.title}
                delay={(index % 2) * 60}
                className={'wide' in feature ? 'bento-wide' : undefined}
              >
                <article className="feature">
                  <span className="feature-icon">
                    <feature.icon />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="how" className="section container">
          <Reveal>
            <div className="section-head">
              <span className="eyebrow">How it works</span>
              <h2>Three steps to your first transfer</h2>
            </div>
          </Reveal>
          <div className="steps">
            {STEPS.map((step, index) => (
              <Reveal key={step.title} delay={index * 70}>
                <article className="step">
                  <span className="step-number num">{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="container final">
          <Reveal>
            <div className="final-card">
              <h2>Put your money in order today</h2>
              <p>Signing up takes less than a minute.</p>
              <Link to={signedIn ? '/app' : '/register'} className="btn btn-lg final-btn">
                {signedIn ? 'Go to dashboard' : 'Create account'}
                <ArrowRight />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="footer container">
        <Logo />
        <span>© {new Date().getFullYear()} mini-ledger</span>
      </footer>
    </div>
  );
}
