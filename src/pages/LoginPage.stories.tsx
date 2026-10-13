import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { AuthProvider } from '../hooks/AuthProvider';
import { LanguageProvider } from '../locales';
import { AuthClient } from '../services/auth';

import LoginPage from './LoginPage';

const createMockClient = (overrides: Record<string, any> = {}): any => {
  let session: {
    user: { id: number; email: string; name: string };
    access: string;
    refresh: string;
  } | null = null;

  return {
    hasSession: () => !!session,
    subscribe: (cb: (active: boolean) => void) => {
      cb(!!session);
      return () => {};
    },
    restoreSession: async () =>
      session ? { id: session.user.id, email: session.user.email } : null,
    login: async (input: { email: string; password: string }) => {
      if (input.email === 'fail@example.com') {
        const error = new Error('Invalid credentials') as any;
        error.status = 401;
        throw error;
      }
      if (input.email === 'network@example.com') {
        const error = new Error('Network error') as any;
        error.status = 0;
        throw error;
      }
      session = {
        user: { id: 1, email: input.email, name: 'Test User' },
        access: 'mock-access',
        refresh: 'mock-refresh',
      };
      return session;
    },
    register: async (input: { email: string; password: string; passwordConfirm: string }) => {
      if (input.email === 'fail@example.com') {
        const error = new Error('Email already exists') as any;
        error.status = 400;
        throw error;
      }
      if (input.email === 'network@example.com') {
        const error = new Error('Network error') as any;
        error.status = 0;
        throw error;
      }
      if (input.password !== input.passwordConfirm) {
        const error = new Error('Passwords do not match') as any;
        error.status = 400;
        throw error;
      }
      session = {
        user: { id: 1, email: input.email, name: 'New User' },
        access: 'mock-access',
        refresh: 'mock-refresh',
      };
      return session;
    },
    logout: async () => {
      session = null;
    },
    ...overrides,
  };
};

const withProviders = (
  Story: React.ReactNode,
  {
    client = createMockClient(),
    initialLang = 'en',
    route = '/login',
    state,
  }: { client?: AuthClient; initialLang?: 'en' | 'bn'; route?: string; state?: unknown } = {}
) => (
  <MemoryRouter initialEntries={[{ pathname: route, state }]}>
    <LanguageProvider initialLang={initialLang}>
      <AuthProvider client={client}>{Story}</AuthProvider>
    </LanguageProvider>
  </MemoryRouter>
);

export default {
  title: 'Pages/LoginPage',
  component: LoginPage,
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [(Story: React.FC) => withProviders(<Story />)],
};

/* State: default empty form */
export const Default = () => <LoginPage />;

/* State: with return URL in state */
export const WithReturnUrl = () => {
  const client = createMockClient();
  return withProviders(<LoginPage />, { client, state: { from: '/compare?ids=1,2' } });
};

/* State: pre-filled email */
export const PrefilledEmail = () => {
  // Note: LoginPage manages its own state, so we can&apos;t easily pre-fill
  // This story documents the default state
  return <LoginPage />;
};

/* State: Bengali language */
export const Bengali = () => {
  const client = createMockClient();
  return withProviders(<LoginPage />, { client, initialLang: 'bn' });
};

/* State: failed login (401 error) */
export const FailedLogin = () => {
  const client = createMockClient();
  // The error will be triggered when user submits with email 'fail@example.com'
  return withProviders(<LoginPage />, { client });
};

/* State: network error */
export const NetworkError = () => {
  const client = createMockClient();
  return withProviders(<LoginPage />, { client });
};

/* State: submitting state (shows loading) */
export const Submitting = () => {
  const client = createMockClient({
    login: async () => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      return {
        user: { id: 1, email: 'slow@example.com', name: 'Slow User' },
        access: 'mock-access',
        refresh: 'mock-refresh',
      };
    },
  });
  return withProviders(<LoginPage />, { client });
};

/* State: dark mode */
export const DarkMode = () => {
  const client = createMockClient();
  return (
    <MemoryRouter initialEntries={[{ pathname: '/login' }]}>
      <LanguageProvider initialLang="en">
        <AuthProvider client={client}>
          <div data-theme="dark" style={{ padding: '1rem' }}>
            <LoginPage />
          </div>
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
};
