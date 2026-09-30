import type { LoginInput, UserDto } from '@kontora/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../api/endpoints';
import { session } from '../api/http';

interface AuthState {
  user: UserDto | null;
  /** true, поки перевіряємо збережений токен при старті. */
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(Boolean(session.token));

  const logout = useCallback(() => {
    session.clear();
    setUser(null);
    qc.clear();
  }, [qc]);

  useEffect(() => session.onUnauthorized(() => setUser(null)), []);

  useEffect(() => {
    if (!session.token) return;
    api.auth
      .me()
      .then(setUser)
      .catch(() => session.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const { token, user: me } = await api.auth.login(input);
    session.set(token);
    setUser(me);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
