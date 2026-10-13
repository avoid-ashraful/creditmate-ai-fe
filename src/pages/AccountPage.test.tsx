import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { AUTH_USER, authUrl, sessionBody } from '../mocks/auth';
import { renderWithAuth } from '../mocks/renderAuth';
import { authClient, REFRESH_TOKEN_STORAGE_KEY } from '../services/auth';

import AccountPage from './AccountPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  authClient.clearLocalSession();
  window.sessionStorage.clear();
});
afterAll(() => server.close());

const routes = (
  <Routes>
    <Route path="/account" element={<AccountPage />} />
    <Route path="/" element={<p>home page</p>} />
  </Routes>
);

describe('AccountPage', () => {
  it('shows the signed-in email and logs out to the home page', async () => {
    server.use(
      rest.post(authUrl('login/'), (_req, res, ctx) =>
        res(ctx.status(200), ctx.json(sessionBody()))
      ),
      rest.post(authUrl('logout/'), (_req, res, ctx) => res(ctx.status(205)))
    );
    await authClient.login({ email: AUTH_USER.email, password: 'pw-12345' });
    server.use(rest.get(authUrl('me/'), (_req, res, ctx) => res(ctx.json(AUTH_USER))));
    const user = userEvent.setup();

    renderWithAuth(routes, { route: '/account' });

    expect(screen.getByRole('heading', { name: 'Your account' })).toBeInTheDocument();
    expect(await screen.findByText(AUTH_USER.email)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByText('home page')).toBeInTheDocument();
    await waitFor(() =>
      expect(window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull()
    );
  });
});
