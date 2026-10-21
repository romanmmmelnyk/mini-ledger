import { create } from 'zustand';

const TOKEN_KEY = 'ledger_token';

function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

type SessionState = {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
};

export const useSession = create<SessionState>((set) => ({
  token: readToken(),
  login: (token) => {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable: the session lives in memory only */
    }
    set({ token });
  },
  logout: () => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* nothing to clear */
    }
    set({ token: null });
  },
}));
