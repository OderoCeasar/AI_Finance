import React, { createContext, useContext, useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { storage } from '@/lib/storage';

type AuthTokens = {
  access: string;
  refresh: string;
};

type AuthUser = {
  id: number;
  name: string;
  email: string;
  date_joined: string;
};

type AuthPayload = {
  user: AuthUser;
  tokens: AuthTokens;
};

type AuthResult = {
  ok: boolean;
  error?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isReady: boolean;
  signIn: (params: { email: string; password: string }) => Promise<AuthResult>;
  signUp: (params: { name: string; email: string; password: string }) => Promise<AuthResult>;
  signInWithGoogle: (idToken: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_USER_KEY = 'auth.user';
const STORAGE_TOKENS_KEY = 'auth.tokens';

const parseStored = <T,>(value: string | null): T | null => {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const [storedUser, storedTokens] = await Promise.all([
        storage.getItem(STORAGE_USER_KEY),
        storage.getItem(STORAGE_TOKENS_KEY),
      ]);
      setUser(parseStored<AuthUser>(storedUser));
      setTokens(parseStored<AuthTokens>(storedTokens));
      setIsReady(true);
    };

    hydrate();
  }, []);

  const persistAuth = async (payload: AuthPayload | null) => {
    if (!payload) {
      await Promise.all([
        storage.removeItem(STORAGE_USER_KEY),
        storage.removeItem(STORAGE_TOKENS_KEY),
      ]);
      setUser(null);
      setTokens(null);
      return;
    }

    setUser(payload.user);
    setTokens(payload.tokens);
    await Promise.all([
      storage.setItem(STORAGE_USER_KEY, JSON.stringify(payload.user)),
      storage.setItem(STORAGE_TOKENS_KEY, JSON.stringify(payload.tokens)),
    ]);
  };

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    const result = await api.post<AuthPayload>('auth/login/', { email, password });
    if (!result.ok || !result.data) {
      return { ok: false, error: result.message ?? 'Login failed.' };
    }
    await persistAuth(result.data);
    return { ok: true };
  };

  const signUp = async ({ name, email, password }: { name: string; email: string; password: string }) => {
    const result = await api.post<AuthPayload>('auth/register/', { name, email, password });
    if (!result.ok || !result.data) {
      return { ok: false, error: result.message ?? 'Registration failed.' };
    }
    await persistAuth(result.data);
    return { ok: true };
  };

  const signInWithGoogle = async (idToken: string) => {
    const result = await api.post<AuthPayload>('auth/google/', { id_token: idToken });
    if (!result.ok || !result.data) {
      return { ok: false, error: result.message ?? 'Google sign-in failed.' };
    }
    await persistAuth(result.data);
    return { ok: true };
  };

  const signOut = async () => {
    await persistAuth(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isReady,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
