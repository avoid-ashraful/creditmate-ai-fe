import { screen } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import { AUTH_USER, authUrl, sessionBody } from '../mocks/auth';
import { renderWithAuth } from '../mocks/renderAuth';
import { AuthClient, authClient, REFRESH_TOKEN_STORAGE_KEY } from '../services/auth';

import { ProtectedRoute } from './ProtectedRoute';

const server = setupServer();
// A fresh client reads sessionStorage at construction, so it must be made after the test seeds it.
const createClient = () => new AuthClient('http://localhost:8000/api/v1', window.sessionStorage);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  authClient.clearLocalSession();
  window.sessionStorage.clear();
});
afterAll(() => server.close());

/** Shows where the login redirect landed and what router state it carried. */
const LoginProbe: React.FC = () => {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? 'none';
  return <p>login page; from={from}</p>;
};

const routes = (
  <Routes>
    <Route path="/login" element={<LoginProbe />} />
    <Route
      path="/account"
      element={
        <ProtectedRoute>
          <p>secret account</p>
        </ProtectedRoute>
      }
    />
  </Routes>
);

describe('ProtectedRoute', () => {
  it('redirects an anonymous visitor to /login and remembers the requested page', () => {
    renderWithAuth(routes, { route: '/account?tab=profile' });

    expect(screen.queryByText('secret account')).not.toBeInTheDocument();
    expect(screen.getByText('login page; from=/account?tab=profile')).toBeInTheDocument();
  });

  it('shows a status line while the stored session is being restored', async () => {
    window.sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, 'refresh-1');
    server.use(
      rest.post(authUrl('token/refresh/'), (_req, res, ctx) =>
        res(ctx.delay(50), ctx.json({ access: 'a2' }))
      ),
      rest.get(authUrl('me/'), (_req, res, ctx) => res(ctx.json(AUTH_USER)))
    );

    renderWithAuth(routes, { route: '/account', client: createClient() });

    expect(screen.getByRole('status')).toHaveTextContent('Checking your session…');
    expect(await screen.findByText('secret account')).toBeInTheDocument();
  });

  it('renders children for a signed-in user', async () => {
    server.use(
      rest.post(authUrl('login/'), (_req, res, ctx) =>
        res(ctx.status(200), ctx.json(sessionBody()))
      )
    );
    await authClient.login({ email: AUTH_USER.email, password: 'pw-12345' });
    server.use(rest.get(authUrl('me/'), (_req, res, ctx) => res(ctx.json(AUTH_USER))));

    renderWithAuth(routes, { route: '/account' });

    expect(await screen.findByText('secret account')).toBeInTheDocument();
  });

  it('shows the Bengali status line when the language is bn', () => {
    window.sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, 'refresh-1');
    server.use(
      rest.post(authUrl('token/refresh/'), (_req, res, ctx) =>
        res(ctx.delay(50), ctx.json({ access: 'a2' }))
      ),
      rest.get(authUrl('me/'), (_req, res, ctx) => res(ctx.json(AUTH_USER)))
    );

    renderWithAuth(routes, { route: '/account', lang: 'bn', client: createClient() });

    expect(screen.getByRole('status')).toHaveTextContent('আপনার সেশন যাচাই করা হচ্ছে…');
  });
});
