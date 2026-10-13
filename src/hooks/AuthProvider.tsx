import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ANALYTICS_EVENTS, analytics } from '../lib/analytics';
import { AuthClient, AuthUser, LoginInput, RegisterInput, authClient } from '../services/auth';

export const AUTH_STATUS = {
  loading: 'loading',
  authenticated: 'authenticated',
  anonymous: 'anonymous',
} as const;

export type AuthStatus = (typeof AUTH_STATUS)[keyof typeof AUTH_STATUS];

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
}

const ANONYMOUS: AuthState = { status: AUTH_STATUS.anonymous, user: null };

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
  /** Inject a client (tests). Defaults to the shared app client. */
  client?: AuthClient;
}

/**
 * Holds the signed-in user and exposes login, register and logout. Starts in
 * `loading` only when a stored refresh token exists, and then restores the
 * session in the background.
 *
 * Analytics: login and signup events are sent with no properties. No email,
 * name or token is ever attached to an event.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children, client = authClient }) => {
  const [state, setState] = useState<AuthState>(() =>
    client.hasSession() ? { status: AUTH_STATUS.loading, user: null } : ANONYMOUS
  );

  useEffect(() => {
    let cancelled = false;

    // A failed refresh anywhere in the app ends the session here too.
    const unsubscribe = client.subscribe(active => {
      if (!active && !cancelled) setState(ANONYMOUS);
    });

    if (client.hasSession()) {
      client.restoreSession().then(user => {
        if (cancelled) return;
        setState(user ? { status: AUTH_STATUS.authenticated, user } : ANONYMOUS);
      });
    }

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [client]);

  const login = useCallback(
    async (input: LoginInput) => {
      const session = await client.login(input);
      setState({ status: AUTH_STATUS.authenticated, user: session.user });
      analytics.track(ANALYTICS_EVENTS.login);
    },
    [client]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      await client.register(input);
      setState(ANONYMOUS);
      analytics.track(ANALYTICS_EVENTS.signup);
    },
    [client]
  );

  const logout = useCallback(async () => {
    await client.logout();
    setState(ANONYMOUS);
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({ status: state.status, user: state.user, login, register, logout }),
    [state, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/** Access the auth state. Must be used inside an {@link AuthProvider}. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
