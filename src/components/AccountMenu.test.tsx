import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { expectNoAxeViolations } from '../a11y/axe';
import { AUTH_USER, authUrl, sessionBody } from '../mocks/auth';
import { renderWithAuth } from '../mocks/renderAuth';
import { authClient, REFRESH_TOKEN_STORAGE_KEY } from '../services/auth';

import { AccountMenu, accountInitials } from './AccountMenu';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  authClient.clearLocalSession();
  window.sessionStorage.clear();
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => server.close());

const routes = (
  <>
    <AccountMenu />
    <Routes>
      <Route path="/" element={<p>home page</p>} />
      <Route path="/my/profile" element={<p>profile page</p>} />
      <Route path="/login" element={<p>login page</p>} />
    </Routes>
  </>
);

const signIn = async () => {
  server.use(
    rest.post(authUrl('login/'), (_req, res, ctx) => res(ctx.status(200), ctx.json(sessionBody())))
  );
  await authClient.login({ email: AUTH_USER.email, password: 'pw-12345' });
  server.use(rest.get(authUrl('me/'), (_req, res, ctx) => res(ctx.json(AUTH_USER))));
};

describe('AccountMenu', () => {
  it('offers Sign in and Register links to anonymous visitors', () => {
    renderWithAuth(routes);

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register');
    expect(screen.queryByRole('button', { name: /Account menu/ })).not.toBeInTheDocument();
  });

  it('shows initials (never the email) as a disclosure button that opens the menu', async () => {
    await signIn();
    const user = userEvent.setup();
    renderWithAuth(routes);

    const trigger = await screen.findByRole('button', { name: 'Account menu' });
    expect(trigger).toHaveTextContent('JD');
    expect(trigger).not.toHaveTextContent(AUTH_USER.email);
    expect(document.body.textContent).not.toContain(AUTH_USER.email);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', 'account-menu-panel');
    expect(screen.getByRole('menuitem', { name: 'Overview' })).toHaveAttribute('href', '/my');
    expect(screen.getByRole('menuitem', { name: 'Saved' })).toHaveAttribute('href', '/my/saved');
    expect(screen.getByRole('menuitem', { name: 'Alerts' })).toHaveAttribute('href', '/my/alerts');
    expect(screen.getByRole('menuitem', { name: 'Profile & settings' })).toHaveAttribute(
      'href',
      '/my/profile'
    );
    expect(screen.getByRole('button', { name: 'Log out' })).toBeVisible();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    await signIn();
    const user = userEvent.setup();
    renderWithAuth(routes);

    const trigger = await screen.findByRole('button', { name: 'Account menu' });
    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument();
  });

  it('navigates to a My CreditMate page from the menu', async () => {
    await signIn();
    const user = userEvent.setup();
    renderWithAuth(routes);

    await user.click(await screen.findByRole('button', { name: 'Account menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Profile & settings' }));

    expect(await screen.findByText('profile page')).toBeInTheDocument();
  });

  it('logs out, returns home and shows the anonymous links again', async () => {
    await signIn();
    server.use(rest.post(authUrl('logout/'), (_req, res, ctx) => res(ctx.status(205))));
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/my/profile' });

    await user.click(await screen.findByRole('button', { name: 'Account menu' }));
    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText('home page')).toBeInTheDocument();
    await waitFor(() =>
      expect(window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull()
    );
  });

  it('renders Bengali labels when the language is bn', () => {
    renderWithAuth(routes, { lang: 'bn' });

    expect(screen.getByRole('link', { name: 'সাইন ইন' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'নিবন্ধন' })).toBeInTheDocument();
  });

  it('has no accessibility violations (anonymous)', async () => {
    const { container } = renderWithAuth(routes);
    await expectNoAxeViolations(container);
  });

  it('has no accessibility violations (signed in)', async () => {
    await signIn();
    const { container } = renderWithAuth(routes);
    await expectNoAxeViolations(container);
  });
});

describe('accountInitials', () => {
  it('prefers first/last name initials', () => {
    expect(accountInitials(AUTH_USER)).toBe('JD');
  });

  it('falls back to the email local part, never the full address', () => {
    expect(accountInitials({ email: 'reader@example.com' })).toBe('RE');
  });

  it('handles null', () => {
    expect(accountInitials(null)).toBe('');
  });
});
