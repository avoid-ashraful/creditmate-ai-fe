import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';

import { ANALYTICS_EVENTS, analytics } from '../lib/analytics';
import { AUTH_USER, authUrl, sessionBody } from '../mocks/auth';
import { AuthClient, REFRESH_TOKEN_STORAGE_KEY } from '../services/auth';

import { AuthProvider, useAuth } from './AuthProvider';

const BASE = 'http://localhost:8000/api/v1';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  window.sessionStorage.clear();
  jest.restoreAllMocks();
});
afterAll(() => server.close());

const createClient = () => new AuthClient(BASE, window.sessionStorage);

/** Shows the auth state as text and exposes buttons that drive it. */
const Probe: React.FC<{ onReady?: (api: ReturnType<typeof useAuth>) => void }> = ({ onReady }) => {
  const auth = useAuth();
  onReady?.(auth);
  return (
    <div>
      <p data-testid="state">
        {auth.status}:{auth.user?.email ?? 'none'}
      </p>
    </div>
  );
};

describe('AuthProvider', () => {
  it('starts anonymous without any network call when no session is stored', () => {
    render(
      <AuthProvider client={createClient()}>
        <Probe />
      </AuthProvider>
    );
    expect(screen.getByTestId('state')).toHaveTextContent('anonymous:none');
  });

  it('restores a stored session and moves from loading to authenticated', async () => {
    window.sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, 'refresh-1');
    server.use(
      rest.post(authUrl('token/refresh/'), (_req, res, ctx) => res(ctx.json({ access: 'a2' }))),
      rest.get(authUrl('me/'), (_req, res, ctx) => res(ctx.json(AUTH_USER)))
    );

    render(
      <AuthProvider client={createClient()}>
        <Probe />
      </AuthProvider>
    );
    expect(screen.getByTestId('state')).toHaveTextContent('loading:none');

    await waitFor(() =>
      expect(screen.getByTestId('state')).toHaveTextContent(`authenticated:${AUTH_USER.email}`)
    );
  });

  it('becomes anonymous when the stored refresh token turns out to be invalid', async () => {
    window.sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, 'stale');
    server.use(
      rest.post(authUrl('token/refresh/'), (_req, res, ctx) => res(ctx.status(401), ctx.json({})))
    );

    render(
      <AuthProvider client={createClient()}>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('anonymous:none'));
  });

  it('logs in, exposes the user and tracks a login event with no properties', async () => {
    server.use(
      rest.post(authUrl('login/'), (_req, res, ctx) =>
        res(ctx.status(200), ctx.json(sessionBody()))
      )
    );
    const track = jest.spyOn(analytics, 'track').mockImplementation(() => undefined);
    const client = createClient();
    let api: ReturnType<typeof useAuth> | undefined;

    render(
      <AuthProvider client={client}>
        <Probe onReady={value => (api = value)} />
      </AuthProvider>
    );
    await act(async () => {
      await api?.login({ email: AUTH_USER.email, password: 'pw-12345' });
    });

    expect(screen.getByTestId('state')).toHaveTextContent(`authenticated:${AUTH_USER.email}`);
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(ANALYTICS_EVENTS.login);
    // No email, token or other personal data goes into analytics.
    expect(JSON.stringify(track.mock.calls)).not.toContain(AUTH_USER.email);
  });

  it('registers and tracks a signup event without properties', async () => {
    server.use(
      rest.post(authUrl('register/'), (_req, res, ctx) =>
        res(ctx.status(201), ctx.json({ detail: 'Registration successful.' }))
      )
    );
    const track = jest.spyOn(analytics, 'track').mockImplementation(() => undefined);
    let api: ReturnType<typeof useAuth> | undefined;

    render(
      <AuthProvider client={createClient()}>
        <Probe onReady={value => (api = value)} />
      </AuthProvider>
    );
    await act(async () => {
      await api?.register({ email: AUTH_USER.email, password: 'pw-12345' });
    });

    expect(track).toHaveBeenCalledWith(ANALYTICS_EVENTS.signup);
    expect(screen.getByTestId('state')).toHaveTextContent('anonymous');
  });

  it('does not track when registration is rejected', async () => {
    server.use(
      rest.post(authUrl('register/'), (_req, res, ctx) =>
        res(ctx.status(400), ctx.json({ email: ['Enter a valid email address.'] }))
      )
    );
    const track = jest.spyOn(analytics, 'track').mockImplementation(() => undefined);
    let api: ReturnType<typeof useAuth> | undefined;

    render(
      <AuthProvider client={createClient()}>
        <Probe onReady={value => (api = value)} />
      </AuthProvider>
    );
    await act(async () => {
      await expect(api?.register({ email: 'bad', password: 'pw' })).rejects.toBeTruthy();
    });

    expect(track).not.toHaveBeenCalled();
    expect(screen.getByTestId('state')).toHaveTextContent('anonymous:none');
  });

  it('logs out and returns to anonymous', async () => {
    server.use(
      rest.post(authUrl('login/'), (_req, res, ctx) =>
        res(ctx.status(200), ctx.json(sessionBody()))
      ),
      rest.post(authUrl('logout/'), (_req, res, ctx) => res(ctx.status(205)))
    );
    const user = userEvent.setup();

    function LogoutButton() {
      const { logout, login } = useAuth();
      return (
        <>
          <button type="button" onClick={() => void login({ email: 'a', password: 'b' })}>
            do-login
          </button>
          <button type="button" onClick={() => void logout()}>
            do-logout
          </button>
        </>
      );
    }

    render(
      <AuthProvider client={createClient()}>
        <Probe />
        <LogoutButton />
      </AuthProvider>
    );
    await user.click(screen.getByRole('button', { name: 'do-login' }));
    await waitFor(() =>
      expect(screen.getByTestId('state')).toHaveTextContent(`authenticated:${AUTH_USER.email}`)
    );

    await user.click(screen.getByRole('button', { name: 'do-logout' }));

    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('anonymous:none'));
    expect(window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('drops to anonymous when a background refresh ends the session', async () => {
    server.use(
      rest.post(authUrl('login/'), (_req, res, ctx) =>
        res(ctx.status(200), ctx.json(sessionBody()))
      ),
      rest.post(authUrl('token/refresh/'), (_req, res, ctx) =>
        res(ctx.status(401), ctx.json({ detail: 'Token is invalid or expired' }))
      )
    );
    const client = createClient();
    let api: ReturnType<typeof useAuth> | undefined;

    render(
      <AuthProvider client={client}>
        <Probe onReady={value => (api = value)} />
      </AuthProvider>
    );
    await act(async () => {
      await api?.login({ email: AUTH_USER.email, password: 'pw-12345' });
    });
    expect(screen.getByTestId('state')).toHaveTextContent('authenticated');

    await act(async () => {
      await client.refreshAccessToken().catch(() => undefined);
    });

    expect(screen.getByTestId('state')).toHaveTextContent('anonymous:none');
  });

  it('throws a descriptive error when useAuth is used outside the provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Probe />)).toThrow('useAuth must be used within an AuthProvider');
    consoleError.mockRestore();
  });
});
