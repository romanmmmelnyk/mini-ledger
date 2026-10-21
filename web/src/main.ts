import './style.css';

const TOKEN_KEY = 'ledger_token';

type Currency = { code: string; name: string; symbol: string };
type Account = {
  id: number;
  type: string;
  currency: Currency;
  user_id: number;
  balance: number;
};

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) {
  throw new Error('Missing #app');
}
const app: HTMLDivElement = root;

let token = sessionStorage.getItem(TOKEN_KEY);
let mode: 'login' | 'register' = 'login';
let message = '';
let messageIsError = false;

function money(account: Account) {
  const amount = account.balance.toLocaleString('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount} ${account.currency.code}`;
}

function minorUnits(value: string) {
  const major = Number(value);
  if (!Number.isFinite(major) || major <= 0) {
    throw new Error('Amount must be greater than zero');
  }
  const minor = Math.round(major * 100);
  if (!Number.isInteger(minor) || minor <= 0) {
    throw new Error('Amount must be greater than zero');
  }
  return minor;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('content-type', 'application/json');
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, { ...options, headers });
  const text = await response.text();
  const body = text ? (JSON.parse(text) as { message?: string | string[] }) : {};
  if (!response.ok) {
    if (response.status === 401 && token) {
      token = null;
      sessionStorage.removeItem(TOKEN_KEY);
    }
    const errorMessage = Array.isArray(body.message)
      ? body.message.join(', ')
      : body.message;
    throw new Error(errorMessage || response.statusText);
  }
  return body as T;
}

function field(label: string, input: HTMLInputElement | HTMLSelectElement) {
  const wrap = document.createElement('label');
  wrap.append(label, input);
  return wrap;
}

function input(type: string, name: string, placeholder = '') {
  const node = document.createElement('input');
  node.type = type;
  node.name = name;
  node.required = true;
  node.placeholder = placeholder;
  node.autocomplete = name === 'password' ? 'current-password' : 'on';
  return node;
}

function showMessage(text: string, isError = false) {
  message = text;
  messageIsError = isError;
}

function renderAuth() {
  app.replaceChildren();
  const card = document.createElement('section');
  card.className = 'card stack';

  const title = document.createElement('h1');
  title.textContent = 'mini-ledger';

  const switcher = document.createElement('div');
  switcher.className = 'switch';
  const loginButton = document.createElement('button');
  loginButton.type = 'button';
  loginButton.className = mode === 'login' ? '' : 'quiet';
  loginButton.textContent = 'Увійти';
  loginButton.onclick = () => {
    mode = 'login';
    message = '';
    renderAuth();
  };
  const registerButton = document.createElement('button');
  registerButton.type = 'button';
  registerButton.className = mode === 'register' ? '' : 'quiet';
  registerButton.textContent = 'Реєстрація';
  registerButton.onclick = () => {
    mode = 'register';
    message = '';
    renderAuth();
  };
  switcher.append(loginButton, registerButton);

  const form = document.createElement('form');
  form.className = 'stack';
  const name = input('text', 'name', 'Імʼя');
  const email = input('email', 'email', 'email@example.com');
  const password = input('password', 'password');
  if (mode === 'register') {
    form.append(field('Імʼя', name));
  }
  form.append(field('Email', email), field('Пароль', password));

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = mode === 'login' ? 'Увійти' : 'Створити акаунт';
  form.append(submit);

  form.onsubmit = async (event) => {
    event.preventDefault();
    submit.disabled = true;
    try {
      if (mode === 'register') {
        await request('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: name.value,
            email: email.value,
            password: password.value,
          }),
        });
      }
      const session = await request<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.value,
          password: password.value,
        }),
      });
      token = session.accessToken;
      sessionStorage.setItem(TOKEN_KEY, token);
      message = '';
      await renderWallet();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Помилка', true);
      renderAuth();
    }
  };

  card.append(title, switcher, note(), form);
  app.append(card);
}

function note() {
  const node = document.createElement('p');
  node.className = `message${messageIsError ? ' error' : ''}`;
  node.textContent = message;
  return node;
}

async function renderWallet() {
  app.replaceChildren();
  let accounts: Account[] = [];
  try {
    accounts = await request<Account[]>('/account/my');
  } catch (error) {
    if (!token) {
      showMessage(error instanceof Error ? error.message : 'Сесія закінчилась', true);
      renderAuth();
      return;
    }
    showMessage(error instanceof Error ? error.message : 'Помилка', true);
  }

  const header = document.createElement('header');
  header.className = 'top';
  const title = document.createElement('h1');
  title.textContent = 'mini-ledger';
  const logout = document.createElement('button');
  logout.type = 'button';
  logout.className = 'quiet';
  logout.textContent = 'Вийти';
  logout.onclick = () => {
    token = null;
    sessionStorage.removeItem(TOKEN_KEY);
    message = '';
    renderAuth();
  };
  header.append(title, logout);

  const accountsCard = document.createElement('section');
  accountsCard.className = 'card';
  const accountsTitle = document.createElement('h2');
  accountsTitle.textContent = 'Рахунки';
  accountsCard.append(accountsTitle);
  if (accounts.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'Рахунків ще немає. Відкрий перший нижче.';
    accountsCard.append(empty);
  }
  for (const account of accounts) {
    const row = document.createElement('div');
    row.className = 'row';
    const meta = document.createElement('div');
    const id = document.createElement('div');
    id.textContent = `${account.type} · #${account.id}`;
    const hint = document.createElement('div');
    hint.className = 'muted';
    hint.textContent = 'Цей номер можна передати іншій людині';
    meta.append(id, hint);
    const balance = document.createElement('div');
    balance.className = 'balance';
    balance.textContent = money(account);
    row.append(meta, balance);
    accountsCard.append(row);
  }

  const openForm = document.createElement('form');
  openForm.className = 'card stack';
  const openTitle = document.createElement('h2');
  openTitle.textContent = 'Новий рахунок';
  const currency = document.createElement('select');
  currency.name = 'currency';
  for (const code of ['UAH', 'USD', 'EUR', 'GBP']) {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = code;
    currency.append(option);
  }
  const type = document.createElement('select');
  type.name = 'type';
  for (const value of ['STANDARD', 'SAVING', 'STUDENT', 'BUSINESS']) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    type.append(option);
  }
  const openSubmit = document.createElement('button');
  openSubmit.type = 'submit';
  openSubmit.textContent = 'Відкрити';
  openForm.append(
    openTitle,
    field('Валюта', currency),
    field('Тип', type),
    openSubmit,
  );
  openForm.onsubmit = async (event) => {
    event.preventDefault();
    openSubmit.disabled = true;
    try {
      await request('/account/create', {
        method: 'POST',
        body: JSON.stringify({
          type: type.value,
          currency_code: currency.value,
        }),
      });
      showMessage('Рахунок відкрито');
      await renderWallet();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Помилка', true);
      await renderWallet();
    }
  };

  const from = document.createElement('select');
  from.name = 'from';
  from.required = accounts.length > 0;
  for (const account of accounts) {
    const option = document.createElement('option');
    option.value = String(account.id);
    option.textContent = `#${account.id} ${account.currency.code} · ${money(account)}`;
    from.append(option);
  }

  const topupForm = document.createElement('form');
  topupForm.className = 'card stack';
  const topupTitle = document.createElement('h2');
  topupTitle.textContent = 'Поповнити';
  const topupAmount = input('number', 'amount', '100.00');
  topupAmount.step = '0.01';
  topupAmount.min = '0.01';
  const topupSubmit = document.createElement('button');
  topupSubmit.type = 'submit';
  topupSubmit.textContent = 'Поповнити';
  topupSubmit.disabled = accounts.length === 0;
  topupForm.append(
    topupTitle,
    field('Рахунок', from),
    field('Сума', topupAmount),
    topupSubmit,
  );
  topupForm.onsubmit = async (event) => {
    event.preventDefault();
    topupSubmit.disabled = true;
    try {
      await request('/payment/topup', {
        method: 'POST',
        body: JSON.stringify({
          accountId: Number(from.value),
          amount: minorUnits(topupAmount.value),
        }),
      });
      showMessage('Рахунок поповнено');
      await renderWallet();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Помилка', true);
      await renderWallet();
    }
  };

  const sendFrom = from.cloneNode(true) as HTMLSelectElement;
  const sendForm = document.createElement('form');
  sendForm.className = 'card stack';
  const sendTitle = document.createElement('h2');
  sendTitle.textContent = 'Надіслати гроші';
  const recipient = input('number', 'recipient', 'ID рахунку');
  recipient.min = '1';
  const sendAmount = input('number', 'amount', '10.00');
  sendAmount.step = '0.01';
  sendAmount.min = '0.01';
  const sendSubmit = document.createElement('button');
  sendSubmit.type = 'submit';
  sendSubmit.textContent = 'Надіслати';
  sendSubmit.disabled = accounts.length === 0;
  sendForm.append(
    sendTitle,
    field('З рахунку', sendFrom),
    field('Рахунок отримувача', recipient),
    field('Сума', sendAmount),
    sendSubmit,
  );
  sendForm.onsubmit = async (event) => {
    event.preventDefault();
    sendSubmit.disabled = true;
    try {
      await request('/payment/send', {
        method: 'POST',
        body: JSON.stringify({
          senderAccountId: Number(sendFrom.value),
          receiverAccountId: Number(recipient.value),
          amount: minorUnits(sendAmount.value),
        }),
      });
      showMessage('Переказ надіслано');
      await renderWallet();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Помилка', true);
      await renderWallet();
    }
  };

  app.append(header, note(), accountsCard, openForm, topupForm, sendForm);
}

if (token) {
  void renderWallet();
} else {
  renderAuth();
}
