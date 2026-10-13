import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { AuthProvider, AUTH_STATUS } from '../hooks/AuthProvider';
import { LanguageProvider } from '../locales';

import { AccountMenu } from './AccountMenu';

const mockAuthClient = {
  hasSession: () => false,
  subscribe: (cb: (active: boolean) => void) => {
    cb(false);
    return () => {};
  },
  restoreSession: async () => null,
  login: async () => ({ user: { id: '1', email: 'test@example.com', name: 'Test User' } }),
  register: async () => ({ user: { id: '1', email: 'test@example.com', name: 'Test User' } }),
  logout: async () => {},
};

const withProviders = (Story: React.FC) => (
  <MemoryRouter>
    <LanguageProvider initialLang="en">
      <AuthProvider client={mockAuthClient as any}>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <Story />
        </ul>
      </AuthProvider>
    </LanguageProvider>
  </MemoryRouter>
);

export default {
  title: 'Components/AccountMenu',
  component: AccountMenu,
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [withProviders],
};

/* State: anonymous user (shows login/register links) */
export const Anonymous = () => <AccountMenu />;

/* State: authenticated user (shows account menu with email) */
export const Authenticated = () => {
  const authenticatedClient = {
    ...mockAuthClient,
    hasSession: () => true,
    restoreSession: async () => ({ id: '1', email: 'user@example.com', name: 'Test User' }),
  };

  return (
    <MemoryRouter>
      <LanguageProvider initialLang="en">
        <AuthProvider client={authenticatedClient as any}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <AccountMenu />
          </ul>
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
};

/* State: authenticated user with long email */
export const LongEmail = () => {
  const longEmailClient = {
    ...mockAuthClient,
    hasSession: () => true,
    restoreSession: async () => ({
      id: '1',
      email: 'very.long.email.address@very-long-domain-name.example.com',
      name: 'Test User',
    }),
  };

  return (
    <MemoryRouter>
      <LanguageProvider initialLang="en">
        <AuthProvider client={longEmailClient as any}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <AccountMenu />
          </ul>
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
};

/* State: Bengali language */
export const Bengali = () => {
  const authenticatedClient = {
    ...mockAuthClient,
    hasSession: () => true,
    restoreSession: async () => ({ id: '1', email: 'user@example.com', name: 'Test User' }),
  };

  return (
    <MemoryRouter>
      <LanguageProvider initialLang="bn">
        <AuthProvider client={authenticatedClient as any}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <AccountMenu />
          </ul>
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
};

/* State: loading state (returns null) */
export const Loading = () => {
  const loadingClient = {
    ...mockAuthClient,
    hasSession: () => true,
    restoreSession: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { id: '1', email: 'user@example.com', name: 'Test User' };
    },
  };

  return (
    <MemoryRouter>
      <LanguageProvider initialLang="en">
        <AuthProvider client={loadingClient as any}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <AccountMenu />
          </ul>
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
};

/* State: authenticated user - menu open (interactive test) */
export const MenuOpen = () => {
  const authenticatedClient = {
    ...mockAuthClient,
    hasSession: () => true,
    restoreSession: async () => ({ id: '1', email: 'user@example.com', name: 'Test User' }),
  };

  return (
    <MemoryRouter>
      <LanguageProvider initialLang="en">
        <AuthProvider client={authenticatedClient as any}>
          <div style={{ padding: '2rem' }}>
            <p>Click the account button to open the menu. Press Escape to close.</p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <AccountMenu />
            </ul>
          </div>
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
};
