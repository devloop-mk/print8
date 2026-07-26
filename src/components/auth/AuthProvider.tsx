'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type AccountCustomer = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  defaultCity: string | null;
  defaultAddress: string | null;
  pointsBalance: number;
  pointsPendingBalance: number;
  firstOrderBonusGranted: boolean;
};

type AuthContextValue = {
  loading: boolean;
  customer: AccountCustomer | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<AccountCustomer | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      const data = await res.json();
      if (data.authenticated && data.customer) {
        setCustomer(data.customer as AccountCustomer);
      } else {
        setCustomer(null);
      }
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCustomer(null);
  }, []);

  const value = useMemo(
    () => ({ loading, customer, refresh, logout }),
    [loading, customer, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}
