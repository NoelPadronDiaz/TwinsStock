import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import {
  AuthResponse,
  clearStoredAuth,
  getStoredAuth,
  login as loginRequest,
  setStoredAuth,
  UNAUTHORIZED_EVENT,
  User,
} from '../api/client';

interface AuthContextValue {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthResponse | null>(() => getStoredAuth());

  useEffect(() => {
    const handleUnauthorized = () => setAuth(null);
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: auth?.user ?? null,
      login: async (username: string, password: string) => {
        const result = await loginRequest(username, password);
        setStoredAuth(result);
        setAuth(result);
      },
      logout: () => {
        clearStoredAuth();
        setAuth(null);
      },
    }),
    [auth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
