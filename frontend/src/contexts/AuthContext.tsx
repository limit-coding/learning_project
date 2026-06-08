import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, type UserOut } from '../services/authApi';

interface AuthState {
  user: UserOut | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: UserOut) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'zhinan_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({ user: null, token: null, loading: true });

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setState({ user: null, token: null, loading: false });
      return;
    }
    authApi
      .me(stored)
      .then((user) => setState({ user, token: stored, loading: false }))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setState({ user: null, token: null, loading: false });
      });
  }, []);

  const login = useCallback((token: string, user: UserOut) => {
    localStorage.setItem(TOKEN_KEY, token);
    setState({ user, token, loading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setState({ user: null, token: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
