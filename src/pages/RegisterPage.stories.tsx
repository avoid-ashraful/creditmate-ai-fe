import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { AuthProvider } from '../hooks/AuthProvider';
import { LanguageProvider } from '../locales';
import type { AuthClient } from '../services/auth';

import RegisterPage from './RegisterPage';

/** Minimal auth client shape used by AuthProvider and stories. */
interface MockAuthClient {
  hasSession: () => boolean;
  subscribe: (cb: (active: boolean) => void) => () => void;
  restoreSession: () => Promise<{ id: number; email: string } | null>;
  login: () => Promise<{
    user: { id: number; email: string; name: string };
    access: string;
    refresh: string;
  }>;
  register: (input: { email: string; password: string; passwordConfirm: string }) => Promise<{
    user: { id: number; email: string; name: string };
    access: string;
    refresh: string;
  }>;
  logout: () => Promise<void>;
}

const createMockClient = (overrides: Partial<MockAuthClient> = {}): MockAuthClient => {
  let session: {
    user: { id: number; email: string; name: string };
    access: string;
    refresh: string;
  } | null = null;

  const baseClient: MockAuthClient = {
    hasSession: () => !!session,
    subscribe: (cb: (active: boolean) => void) => {
      cb(!!session);
      return () => {};
    },
    restoreSession: async () =>
      session ? { id: session.user.id, email: session.user.email } : null,
    login: async () => {
      session = {
        user: { id: 1, email: 'test@example.com', name: 'Test User' },
        access: 'mock-access',
        refresh: 'mock-refresh',
      };
      return session;
    },
    register: async (input: { email: string; password: string; passwordConfirm: string }) => {
      if (input.email === 'fail@example.com') {
        const error = new Error('Email already exists') as Error & { status: number };
        error.status = 400;
        throw error;
      }
      if (input.email === 'network@example.com') {
        const error = new Error('Network error') as Error & { status: number };
        error.status = 0;
        throw error;
      }
      if (input.password !== input.passwordConfirm) {
        const error = new Error('Passwords do not match') as Error & { status: number };
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
  return baseClient;
};

const withProviders = (
  Story: React.ReactNode,
  {
    client = createMockClient(),
    initialLang = 'en',
  }: { client?: MockAuthClient; initialLang?: 'en' | 'bn' } = {}
) => (
  <MemoryRouter initialEntries={['/register']}>
    <LanguageProvider initialLang={initialLang}>
      <AuthProvider client={client as unknown as AuthClient}>{Story}</AuthProvider>
    </LanguageProvider>
  </MemoryRouter>
);

export default {
  title: 'Pages/RegisterPage',
  component: RegisterPage,
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [(Story: React.FC) => withProviders(<Story />)],
};

/* State: default empty form */
export const Default = () => <RegisterPage />;

/* State: Bengali language */
export const Bengali = () => {
  const client = createMockClient();
  return withProviders(<RegisterPage />, { client, initialLang: 'bn' });
};

/* State: failed registration (email exists) */
export const FailedRegistration = () => {
  const client = createMockClient();
  return withProviders(<RegisterPage />, { client });
};

/* State: network error */
export const NetworkError = () => {
  const client = createMockClient();
  return withProviders(<RegisterPage />, { client });
};

/* State: password mismatch error */
export const PasswordMismatch = () => {
  const client = createMockClient();
  return withProviders(<RegisterPage />, { client });
};

/* State: submitting state (shows loading) */
export const Submitting = () => {
  const client = createMockClient({
    register: async () => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      return {
        user: { id: 1, email: 'slow@example.com', name: 'Slow User' },
        access: 'mock-access',
        refresh: 'mock-refresh',
      };
    },
  });
  return withProviders(<RegisterPage />, { client });
};

/* State: dark mode */
export const DarkMode = () => {
  const client = createMockClient();
  return (
    <MemoryRouter initialEntries={['/register']}>
      <LanguageProvider initialLang="en">
        <AuthProvider client={client as unknown as AuthClient}>
          <div data-theme="dark" style={{ padding: '1rem' }}>
            <RegisterPage />
          </div>
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
};

/* State: with password validation hints visible */
export const WithValidation = () => {
  const client = createMockClient();
  return withProviders(<RegisterPage />, { client });
};
