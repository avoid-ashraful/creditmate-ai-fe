import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

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

const Home = () => <p>home page: {(useLocation().state as { notice?: string } | null)?.notice}</p>;

const routes = (
  <Routes>
    <Route path="/account" element={<AccountPage />} />
    <Route path="/" element={<Home />} />
  </Routes>
);

const signIn = async (profile: Record<string, unknown> = {}) => {
  const me = {
    ...AUTH_USER,
    profile: { email_verified: true, marketing_opt_in: false, ...profile },
  };
  server.use(
    rest.post(authUrl('login/'), (_req, res, ctx) =>
      res(ctx.status(200), ctx.json({ ...sessionBody(), user: me }))
    ),
    rest.get(authUrl('me/'), (_req, res, ctx) => res(ctx.json(me)))
  );
  await authClient.login({ email: AUTH_USER.email, password: 'pw-12345' });
};

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

    expect(await screen.findByText(/^home page/)).toBeInTheDocument();
    await waitFor(() =>
      expect(window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull()
    );
  });

  it('saves the marketing emails toggle with a PATCH', async () => {
    await signIn();
    const bodies: unknown[] = [];
    server.use(
      rest.patch(authUrl('me/'), async (req, res, ctx) => {
        const body = await req.json();
        bodies.push(body);
        return res(ctx.json({ ...AUTH_USER, profile: { marketing_opt_in: true } }));
      })
    );
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/account' });

    const toggle = await screen.findByRole('checkbox', { name: 'Marketing emails' });
    expect(toggle).not.toBeChecked();
    await user.click(toggle);

    expect(await screen.findByText('Email preference saved.')).toBeInTheDocument();
    expect(toggle).toBeChecked();
    expect(bodies).toEqual([{ profile: { marketing_opt_in: true } }]);
  });

  it('keeps the toggle unchanged and shows an error when saving fails', async () => {
    await signIn();
    server.use(rest.patch(authUrl('me/'), (_req, res, ctx) => res(ctx.status(500))));
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/account' });

    const toggle = await screen.findByRole('checkbox', { name: 'Marketing emails' });
    await user.click(toggle);

    await waitFor(() =>
      expect(screen.getAllByRole('alert').map(node => node.textContent)).toContain(
        'Something went wrong. Please try again.'
      )
    );
    expect(toggle).not.toBeChecked();
  });

  it('downloads the data export as creditmate-data.json', async () => {
    await signIn();
    server.use(rest.get(authUrl('me/export/'), (_req, res, ctx) => res(ctx.json({ reviews: [] }))));
    const createObjectURL = jest.fn(() => 'blob:export');
    const revokeObjectURL = jest.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    let downloaded = '';
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloaded = this.download;
      });
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/account' });

    await user.click(await screen.findByRole('button', { name: 'Download my data' }));

    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(downloaded).toBe('creditmate-data.json');
    const blob = (createObjectURL.mock.calls[0] as unknown as [Blob])[0];
    expect(blob.type).toBe('application/json');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:export');
    click.mockRestore();
  });

  it('offers to resend verification when the email is not verified', async () => {
    await signIn({ email_verified: false });
    server.use(
      rest.post(authUrl('resend-verification/'), (_req, res, ctx) =>
        res(ctx.json({ detail: 'generic' }))
      )
    );
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/account' });

    await user.click(await screen.findByRole('button', { name: 'Resend verification email' }));

    expect(await screen.findByText(/we have sent a new verification link/)).toBeInTheDocument();
  });

  describe('delete account', () => {
    it('needs the password and the explicit confirmation and sends no request without them', async () => {
      await signIn();
      const requests: string[] = [];
      server.use(
        rest.delete(authUrl('me/'), (_req, res, ctx) => {
          requests.push('delete');
          return res(ctx.status(204));
        })
      );
      const user = userEvent.setup();
      renderWithAuth(routes, { route: '/account' });

      await user.click(await screen.findByRole('button', { name: 'Delete my account' }));
      expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(
        'This field is required.'
      );

      await user.type(screen.getByLabelText('Password'), 'pw-12345');
      await user.click(screen.getByRole('button', { name: 'Delete my account' }));
      expect(screen.getByRole('checkbox', { name: /I understand/ })).toHaveAccessibleDescription(
        'Confirm that you understand before deleting your account.'
      );
      expect(requests).toEqual([]);
    });

    it('explains a wrong password and keeps the session', async () => {
      await signIn();
      server.use(
        rest.delete(authUrl('me/'), (_req, res, ctx) =>
          res(ctx.status(400), ctx.json({ password: ['Current password is incorrect.'] }))
        )
      );
      const user = userEvent.setup();
      renderWithAuth(routes, { route: '/account' });

      await user.type(await screen.findByLabelText('Password'), 'wrong');
      await user.click(screen.getByRole('checkbox', { name: /I understand/ }));
      await user.click(screen.getByRole('button', { name: 'Delete my account' }));

      expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(
        'The password is incorrect. Your account was not deleted.'
      );
      expect(authClient.hasSession()).toBe(true);
      expect(screen.queryByText(/home page/)).not.toBeInTheDocument();
    });

    it('clears the session and goes home with a notice on 204', async () => {
      await signIn();
      let body: unknown;
      server.use(
        rest.delete(authUrl('me/'), async (req, res, ctx) => {
          body = await req.json();
          return res(ctx.status(204));
        })
      );
      const user = userEvent.setup();
      renderWithAuth(routes, { route: '/account' });

      await user.type(await screen.findByLabelText('Password'), 'pw-12345');
      await user.click(screen.getByRole('checkbox', { name: /I understand/ }));
      await user.click(screen.getByRole('button', { name: 'Delete my account' }));

      expect(
        await screen.findByText('home page: Your account and personal data have been deleted.')
      ).toBeInTheDocument();
      expect(body).toEqual({ password: 'pw-12345' });
      expect(authClient.hasSession()).toBe(false);
      expect(window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull();
    });

    it('shows a generic error when deletion fails for another reason', async () => {
      await signIn();
      server.use(rest.delete(authUrl('me/'), (_req, res, ctx) => res(ctx.status(500))));
      const user = userEvent.setup();
      renderWithAuth(routes, { route: '/account' });

      await user.type(await screen.findByLabelText('Password'), 'pw-12345');
      await user.click(screen.getByRole('checkbox', { name: /I understand/ }));
      await user.click(screen.getByRole('button', { name: 'Delete my account' }));

      await waitFor(() =>
        expect(screen.getAllByRole('alert').map(node => node.textContent)).toContain(
          'Something went wrong. Please try again.'
        )
      );
      expect(authClient.hasSession()).toBe(true);
    });
  });
});
