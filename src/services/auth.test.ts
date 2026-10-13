import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { AUTH_USER, authUrl, sessionBody } from '../mocks/auth';

import { ApiError, AuthClient, REFRESH_TOKEN_STORAGE_KEY } from './auth';

const BASE = 'http://localhost:8000/api/v1';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  window.sessionStorage.clear();
});
afterAll(() => server.close());

const createClient = () => new AuthClient(BASE, window.sessionStorage);

/** Client already holding a session from a login, with access-1 / refresh-1. */
const loggedInClient = async () => {
  server.use(
    rest.post(authUrl('login/'), (_req, res, ctx) => res(ctx.status(200), ctx.json(sessionBody())))
  );
  const client = createClient();
  await client.login({ email: AUTH_USER.email, password: 'pw-12345' });
  return client;
};

describe('AuthClient registration and login', () => {
  it('posts register with password_confirm and stores only the refresh token', async () => {
    let body: unknown;
    server.use(
      rest.post(authUrl('register/'), (req, res, ctx) => {
        body = req.body;
        return res(ctx.status(201), ctx.json(sessionBody('acc', 'ref')));
      })
    );
    const client = createClient();
    const listener = jest.fn();
    client.subscribe(listener);

    const session = await client.register({
      email: AUTH_USER.email,
      password: 'pw-12345',
      passwordConfirm: 'pw-12345',
    });

    expect(body).toEqual({
      email: AUTH_USER.email,
      password: 'pw-12345',
      password_confirm: 'pw-12345',
    });
    expect(session.user).toEqual(AUTH_USER);
    expect(window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBe('ref');
    // The access token must never be persisted.
    expect(Object.values({ ...window.sessionStorage }).join(' ')).not.toContain('acc');
    expect(listener).toHaveBeenCalledWith(true);
  });

  it('omits password_confirm when it is not supplied', async () => {
    let body: Record<string, unknown> | undefined;
    server.use(
      rest.post(authUrl('register/'), (req, res, ctx) => {
        body = req.body as Record<string, unknown>;
        return res(ctx.status(201), ctx.json(sessionBody()));
      })
    );
    await createClient().register({ email: AUTH_USER.email, password: 'pw-12345' });
    expect(body).not.toHaveProperty('password_confirm');
  });

  it('surfaces DRF field errors from a rejected registration as ApiError', async () => {
    server.use(
      rest.post(authUrl('register/'), (_req, res, ctx) =>
        res(
          ctx.status(400),
          ctx.json({
            email: ['user with this email already exists.'],
            password: ['This password is too short.'],
          })
        )
      )
    );
    const client = createClient();

    const error = await client
      .register({ email: AUTH_USER.email, password: 'x' })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).fieldErrors).toEqual({
      email: ['user with this email already exists.'],
      password: ['This password is too short.'],
    });
    expect(client.hasSession()).toBe(false);
    expect(window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('logs in with email and password and stores the session', async () => {
    let body: unknown;
    server.use(
      rest.post(authUrl('login/'), (req, res, ctx) => {
        body = req.body;
        return res(ctx.status(200), ctx.json(sessionBody()));
      })
    );
    const client = createClient();

    const session = await client.login({ email: AUTH_USER.email, password: 'pw-12345' });

    expect(body).toEqual({ email: AUTH_USER.email, password: 'pw-12345' });
    expect(session.access).toBe('access-1');
    expect(client.hasSession()).toBe(true);
    expect(window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBe('refresh-1');
  });

  it('exposes DRF detail on a 401 login failure', async () => {
    server.use(
      rest.post(authUrl('login/'), (_req, res, ctx) =>
        res(
          ctx.status(401),
          ctx.json({ detail: 'No active account found with the given credentials' })
        )
      )
    );

    const error = await createClient()
      .login({ email: AUTH_USER.email, password: 'wrong' })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
    expect((error as ApiError).detail).toBe('No active account found with the given credentials');
    expect((error as ApiError).fieldErrors).toEqual({});
  });

  it('handles a non-JSON error body without inventing messages', async () => {
    server.use(
      rest.post(authUrl('login/'), (_req, res, ctx) =>
        res(ctx.status(502), ctx.text('Bad gateway'))
      )
    );

    const error = await createClient()
      .login({ email: AUTH_USER.email, password: 'pw' })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(502);
    expect((error as ApiError).detail).toBeNull();
    expect((error as ApiError).fieldErrors).toEqual({});
  });

  it('rejects with a TypeError when the network is unreachable', async () => {
    server.use(rest.post(authUrl('login/'), (_req, res) => res.networkError('Failed to connect')));

    const error = await createClient()
      .login({ email: AUTH_USER.email, password: 'pw' })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TypeError);
  });
});

describe('AuthClient authenticated requests and silent refresh', () => {
  it('sends the access token as a bearer header', async () => {
    let authHeader: string | null = null;
    const client = await loggedInClient();
    server.use(
      rest.get(authUrl('me/'), (req, res, ctx) => {
        authHeader = req.headers.get('Authorization');
        return res(ctx.status(200), ctx.json(AUTH_USER));
      })
    );

    await expect(client.getMe()).resolves.toEqual(AUTH_USER);
    expect(authHeader).toBe('Bearer access-1');
  });

  it('refreshes once after a 401 and retries, with one refresh shared by concurrent calls', async () => {
    const client = await loggedInClient();
    let refreshCalls = 0;
    server.use(
      rest.get(authUrl('me/'), (req, res, ctx) =>
        req.headers.get('Authorization') === 'Bearer access-2'
          ? res(ctx.status(200), ctx.json(AUTH_USER))
          : res(ctx.status(401), ctx.json({ detail: 'Given token not valid' }))
      ),
      rest.post(authUrl('token/refresh/'), (req, res, ctx) => {
        refreshCalls += 1;
        expect(req.body).toEqual({ refresh: 'refresh-1' });
        return res(ctx.delay(20), ctx.status(200), ctx.json({ access: 'access-2' }));
      })
    );

    const results = await Promise.all([client.getMe(), client.getMe(), client.getMe()]);

    expect(results).toEqual([AUTH_USER, AUTH_USER, AUTH_USER]);
    expect(refreshCalls).toBe(1);
  });

  it('stores a rotated refresh token when the backend returns one', async () => {
    const client = await loggedInClient();
    server.use(
      rest.get(authUrl('me/'), (req, res, ctx) =>
        req.headers.get('Authorization') === 'Bearer access-2'
          ? res(ctx.json(AUTH_USER))
          : res(ctx.status(401), ctx.json({ detail: 'expired' }))
      ),
      rest.post(authUrl('token/refresh/'), (_req, res, ctx) =>
        res(ctx.json({ access: 'access-2', refresh: 'refresh-2' }))
      )
    );

    await client.getMe();

    expect(window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBe('refresh-2');
  });

  it('ends the session and notifies listeners when the refresh token is rejected', async () => {
    const client = await loggedInClient();
    const listener = jest.fn();
    client.subscribe(listener);
    server.use(
      rest.get(authUrl('me/'), (_req, res, ctx) => res(ctx.status(401), ctx.json({ detail: 'x' }))),
      rest.post(authUrl('token/refresh/'), (_req, res, ctx) =>
        res(ctx.status(401), ctx.json({ detail: 'Token is invalid or expired' }))
      )
    );

    const error = await client.getMe().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
    expect(client.hasSession()).toBe(false);
    expect(window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(listener).toHaveBeenLastCalledWith(false);
  });

  it('keeps the session when the refresh request fails on the network', async () => {
    const client = await loggedInClient();
    server.use(
      rest.get(authUrl('me/'), (_req, res, ctx) => res(ctx.status(401), ctx.json({ detail: 'x' }))),
      rest.post(authUrl('token/refresh/'), (_req, res) => res.networkError('offline'))
    );

    await expect(client.getMe()).rejects.toBeInstanceOf(TypeError);
    expect(client.hasSession()).toBe(true);
    expect(window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBe('refresh-1');
  });

  it('does not retry a request that is still 401 after a successful refresh', async () => {
    const client = await loggedInClient();
    let meCalls = 0;
    server.use(
      rest.get(authUrl('me/'), (_req, res, ctx) => {
        meCalls += 1;
        return res(ctx.status(403), ctx.json({ detail: 'Forbidden' }));
      })
    );

    const error = await client.getMe().catch((caught: unknown) => caught);

    expect((error as ApiError).status).toBe(403);
    expect(meCalls).toBe(1);
  });
});

describe('AuthClient logout and session restore', () => {
  it('revokes the refresh token on the server and clears local state', async () => {
    const client = await loggedInClient();
    let body: unknown;
    let authHeader: string | null = null;
    server.use(
      rest.post(authUrl('logout/'), (req, res, ctx) => {
        body = req.body;
        authHeader = req.headers.get('Authorization');
        return res(ctx.status(205));
      })
    );

    await client.logout();

    expect(body).toEqual({ refresh: 'refresh-1' });
    expect(authHeader).toBe('Bearer access-1');
    expect(client.hasSession()).toBe(false);
    expect(window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('clears local state even when the logout request fails', async () => {
    const client = await loggedInClient();
    server.use(rest.post(authUrl('logout/'), (_req, res, ctx) => res(ctx.status(500))));

    await expect(client.logout()).resolves.toBeUndefined();
    expect(client.hasSession()).toBe(false);
  });

  it('clears local state even when the logout request cannot reach the server', async () => {
    const client = await loggedInClient();
    server.use(rest.post(authUrl('logout/'), (_req, res) => res.networkError('offline')));

    await client.logout();
    expect(window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('restores a stored session on load and returns the user', async () => {
    window.sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, 'refresh-1');
    server.use(
      rest.post(authUrl('token/refresh/'), (_req, res, ctx) =>
        res(ctx.json({ access: 'access-9' }))
      ),
      rest.get(authUrl('me/'), (req, res, ctx) =>
        req.headers.get('Authorization') === 'Bearer access-9'
          ? res(ctx.json(AUTH_USER))
          : res(ctx.status(401), ctx.json({ detail: 'x' }))
      )
    );
    const client = createClient();
    expect(client.hasSession()).toBe(true);

    await expect(client.restoreSession()).resolves.toEqual(AUTH_USER);
  });

  it('returns null and clears storage when the stored refresh token is no longer valid', async () => {
    window.sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, 'stale');
    server.use(
      rest.post(authUrl('token/refresh/'), (_req, res, ctx) => res(ctx.status(401), ctx.json({})))
    );
    const client = createClient();

    await expect(client.restoreSession()).resolves.toBeNull();
    expect(window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('keeps the stored token and returns null when restore fails on the network', async () => {
    window.sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, 'refresh-1');
    server.use(rest.post(authUrl('token/refresh/'), (_req, res) => res.networkError('offline')));
    const client = createClient();

    await expect(client.restoreSession()).resolves.toBeNull();
    expect(window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBe('refresh-1');
  });

  it('makes no network call when there is nothing to restore', async () => {
    // onUnhandledRequest is 'error', so any request here would fail the test.
    await expect(createClient().restoreSession()).resolves.toBeNull();
  });

  it('provides a current access token to authenticated feature services', async () => {
    const client = await loggedInClient();
    await expect(client.getAccessToken()).resolves.toBe('access-1');
  });

  it('returns null when no authenticated session exists', async () => {
    await expect(createClient().getAccessToken()).resolves.toBeNull();
  });
});

describe('AuthClient account and password endpoints', () => {
  it('sends the reset request with only the email', async () => {
    let body: unknown;
    server.use(
      rest.post(authUrl('password-reset/request/'), (req, res, ctx) => {
        body = req.body;
        return res(ctx.status(200), ctx.json({ detail: 'sent' }));
      })
    );

    await createClient().requestPasswordReset('reader@example.com');
    expect(body).toEqual({ email: 'reader@example.com' });
  });

  it('confirms a reset with the token and new password, including uid only when given', async () => {
    const bodies: unknown[] = [];
    server.use(
      rest.post(authUrl('password-reset/confirm/'), (req, res, ctx) => {
        bodies.push(req.body);
        return res(ctx.status(200), ctx.json({ detail: 'ok' }));
      })
    );
    const client = createClient();

    await client.confirmPasswordReset({ uid: 'MQ', token: 'tok', newPassword: 'new-pw-123' });
    await client.confirmPasswordReset({ token: 'tok', newPassword: 'new-pw-123' });

    expect(bodies).toEqual([
      { uid: 'MQ', token: 'tok', new_password: 'new-pw-123' },
      { token: 'tok', new_password: 'new-pw-123' },
    ]);
  });

  it('surfaces a rejected reset token as an ApiError on the token field', async () => {
    server.use(
      rest.post(authUrl('password-reset/confirm/'), (_req, res, ctx) =>
        res(ctx.status(400), ctx.json({ token: ['Invalid or expired token.'] }))
      )
    );

    const error = await createClient()
      .confirmPasswordReset({ token: 'bad', newPassword: 'new-pw-123' })
      .catch((caught: unknown) => caught);

    expect((error as ApiError).fieldErrors).toEqual({ token: ['Invalid or expired token.'] });
  });

  it('verifies an email token', async () => {
    let body: unknown;
    server.use(
      rest.post(authUrl('verify-email/'), (req, res, ctx) => {
        body = req.body;
        return res(ctx.status(204));
      })
    );

    await expect(createClient().verifyEmail('verify-token')).resolves.toBeUndefined();
    expect(body).toEqual({ token: 'verify-token' });
  });

  it('reads and patches the profile with the access token', async () => {
    const client = await loggedInClient();
    let patchBody: unknown;
    server.use(
      rest.get(authUrl('me/'), (_req, res, ctx) => res(ctx.json(AUTH_USER))),
      rest.patch(authUrl('me/'), (req, res, ctx) => {
        patchBody = req.body;
        return res(ctx.json({ ...AUTH_USER, email: 'new@example.com' }));
      })
    );

    await expect(client.getMe()).resolves.toEqual(AUTH_USER);
    await expect(client.updateMe({ email: 'new@example.com' })).resolves.toEqual({
      ...AUTH_USER,
      email: 'new@example.com',
    });
    expect(patchBody).toEqual({ email: 'new@example.com' });
  });
});
