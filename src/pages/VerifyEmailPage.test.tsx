import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { expectNoAxeViolations } from '../a11y/axe';
import { getAuthCopy } from '../locales/auth';
import { authUrl } from '../mocks/auth';
import { renderWithAuth } from '../mocks/renderAuth';
import { authClient } from '../services/auth';

import VerifyEmailPage from './VerifyEmailPage';

const server = setupServer();
const copy = getAuthCopy('en');

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  authClient.clearLocalSession();
  window.sessionStorage.clear();
});
afterAll(() => server.close());

const routes = (
  <Routes>
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/login" element={<p>login page</p>} />
    <Route path="/register" element={<p>register page</p>} />
  </Routes>
);

describe('VerifyEmailPage', () => {
  it('shows loading state while verifying', () => {
    server.use(
      rest.post(authUrl('verify-email/'), (_req, res, ctx) =>
        res(ctx.delay(100), ctx.status(200), ctx.json({ detail: 'ok' }))
      )
    );
    renderWithAuth(routes, { route: '/verify-email?token=valid-token' });

    expect(screen.getByText(copy.verifyLoading)).toBeInTheDocument();
  });

  it('shows success message and login link on successful verification', async () => {
    server.use(
      rest.post(authUrl('verify-email/'), (_req, res, ctx) =>
        res(ctx.status(200), ctx.json({ detail: 'Email verified successfully.' }))
      )
    );
    renderWithAuth(routes, { route: '/verify-email?token=valid-token' });

    await screen.findByText(copy.verifySuccess);
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });

  it('shows error when token is missing from URL', () => {
    renderWithAuth(routes, { route: '/verify-email' });

    expect(screen.getByRole('alert')).toHaveTextContent(copy.verifyInvalidLink);
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });

  it('shows form-level error when token is invalid (field error goes to form because token has no input)', async () => {
    server.use(
      rest.post(authUrl('verify-email/'), (_req, res, ctx) =>
        res(ctx.status(400), ctx.json({ token: ['Invalid verification link.'] }))
      )
    );
    renderWithAuth(routes, { route: '/verify-email?token=bad-token' });

    // The token field error becomes a form-level message since there's no token input field
    await screen.findByText(copy.checkFields);
  });

  it('resends the verification email for a typed address on an invalid link', async () => {
    let body: unknown;
    server.use(
      rest.post(authUrl('resend-verification/'), (req, res, ctx) => {
        body = req.body;
        return res(ctx.status(200), ctx.json({ detail: 'generic' }));
      })
    );
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/verify-email' });

    await user.click(screen.getByRole('button', { name: copy.resendButton }));
    expect(screen.getByLabelText(copy.emailLabel)).toHaveAccessibleDescription(copy.fieldRequired);
    expect(body).toBeUndefined();

    await user.type(screen.getByLabelText(copy.emailLabel), 'reader@example.com');
    await user.click(screen.getByRole('button', { name: copy.resendButton }));

    expect(await screen.findByText(copy.resendSent)).toBeInTheDocument();
    expect(body).toEqual({ email: 'reader@example.com' });
  });

  it('shows the rate-limit message when resend is throttled', async () => {
    server.use(
      rest.post(authUrl('resend-verification/'), (_req, res, ctx) =>
        res(ctx.status(429), ctx.json({ detail: 'Request was throttled.' }))
      )
    );
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/verify-email' });

    await user.type(screen.getByLabelText(copy.emailLabel), 'reader@example.com');
    await user.click(screen.getByRole('button', { name: copy.resendButton }));

    // The invalid-link alert is already on screen; wait for the throttle alert to join it.
    await waitFor(() =>
      expect(screen.getAllByRole('alert').map(node => node.textContent)).toContain(
        copy.resendRateLimited
      )
    );
  });

  it('has no accessibility violations on the invalid-link page with resend', async () => {
    const { container } = renderWithAuth(routes, { route: '/verify-email' });
    await expectNoAxeViolations(container);
  });

  it('has no accessibility violations on success', async () => {
    server.use(
      rest.post(authUrl('verify-email/'), (_req, res, ctx) =>
        res(ctx.status(200), ctx.json({ detail: 'Email verified successfully.' }))
      )
    );
    const { container } = renderWithAuth(routes, { route: '/verify-email?token=valid-token' });
    await expectNoAxeViolations(container);
  });
});
