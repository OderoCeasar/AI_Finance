import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

import { api, apiRequest } from '@/lib/api';
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
  user: AuthUser | null;
  tokens: AuthTokens;
};

type AuthResult = {
  ok: boolean;
  error?: string;
  errors?: unknown;
};

type AuthContextValue = {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isReady: boolean;
  signIn: (params: { email: string; password: string }) => Promise<AuthResult>;
  signUp: (params: { name: string; email: string; password: string }) => Promise<AuthResult>;
  signInWithGoogle: (idToken: string) => Promise<AuthResult>;
  refreshAccessToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_USER_KEY = 'auth.user';
const STORAGE_TOKENS_KEY = 'auth.tokens';
const STORAGE_FIRST_LOGIN_PREFIX = 'auth.first_login.';
let refreshPromise: Promise<string | null> | null = null;

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
  const didSetAuth = useRef(false);

  useEffect(() => {
    const hydrate = async () => {
      const [storedUser, storedTokens] = await Promise.all([
        storage.getItem(STORAGE_USER_KEY),
        storage.getItem(STORAGE_TOKENS_KEY),
      ]);
      if (!didSetAuth.current) {
        setUser(parseStored<AuthUser>(storedUser));
        setTokens(parseStored<AuthTokens>(storedTokens));
      }
      setIsReady(true);
    };

    hydrate();
  }, []);

  const persistAuth = async (payload: AuthPayload | null) => {
    console.log('[Auth] persistAuth called:', { hasPayload: !!payload, hasUser: !!payload?.user, hasTokens: !!payload?.tokens });
    didSetAuth.current = true;
    if (!payload) {
      console.log('[Auth] Clearing auth (no payload)');
      await Promise.all([
        storage.removeItem(STORAGE_USER_KEY),
        storage.removeItem(STORAGE_TOKENS_KEY),
      ]);
      setUser(null);
      setTokens(null);
      return;
    }

    console.log('[Auth] Setting user and tokens in state');
    setUser(payload.user);
    setTokens(payload.tokens);
    const storageTasks = [storage.setItem(STORAGE_TOKENS_KEY, JSON.stringify(payload.tokens))];
    if (payload.user) {
      storageTasks.push(storage.setItem(STORAGE_USER_KEY, JSON.stringify(payload.user)));
    } else {
      storageTasks.push(storage.removeItem(STORAGE_USER_KEY));
    }
    console.log('[Auth] Saving to storage...');
    await Promise.all(storageTasks);
    console.log('[Auth] Auth persisted successfully');
  };

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    console.log('[Auth] Attempting login with:', { email });
    const result = await api.post<AuthPayload>('auth/login/', { email, password });
    console.log('[Auth] Login result:', { ok: result.ok, status: result.status, message: result.message, hasData: !!result.data });
    if (!result.ok || !result.data) {
      console.log('[Auth] Login failed:', result.message);
      return { ok: false, error: result.message ?? 'Login failed.', errors: result.errors };
    }
    console.log('[Auth] Login successful, persisting auth...');
    await persistAuth(result.data);
    console.log('[Auth] Auth persisted, tokens:', !!result.data.tokens);
    return { ok: true };
  };

  const signUp = async ({ name, email, password }: { name: string; email: string; password: string }) => {
    console.log('[Auth] Attempting signup with:', { name, email });
    const result = await api.post<AuthPayload>('auth/register/', { name, email, password });
    console.log('[Auth] Signup result:', { ok: result.ok, status: result.status, message: result.message, hasData: !!result.data });
    if (!result.ok || !result.data) {
      console.log('[Auth] Signup failed:', result.message);
      return { ok: false, error: result.message ?? 'Registration failed.', errors: result.errors };
    }
    console.log('[Auth] Signup successful, persisting auth...');
    await persistAuth(result.data);
    if (result.data.user?.id) {
      await storage.setItem(`${STORAGE_FIRST_LOGIN_PREFIX}${result.data.user.id}`, 'true');
    }
    console.log('[Auth] Auth persisted, tokens:', !!result.data.tokens);
    return { ok: true };
  };

  const signInWithGoogle = async (idToken: string) => {
    const result = await api.post<AuthPayload>('auth/google/', { id_token: idToken });
    if (!result.ok || !result.data) {
      return { ok: false, error: result.message ?? 'Google sign-in failed.', errors: result.errors };
    }
    await persistAuth(result.data);
    return { ok: true };
  };

  const refreshAccessToken = async () => {
    if (!tokens?.refresh) {
      return null;
    }
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        const result = await apiRequest<{ access: string; refresh?: string }>('auth/refresh/', {
          method: 'POST',
          body: { refresh: tokens.refresh },
        });

        if (!result.ok || !result.data?.access) {
          await persistAuth(null);
          return null;
        }

        const nextTokens: AuthTokens = {
          access: result.data.access,
          refresh: result.data.refresh ?? tokens.refresh,
        };
        await persistAuth({ user, tokens: nextTokens });
        return nextTokens.access;
      } catch (error) {
        await persistAuth(null);
        return null;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
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
        refreshAccessToken,
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
