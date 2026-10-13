import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { authUrl } from '../mocks/auth';
import { renderWithAuth } from '../mocks/renderAuth';
import { authClient } from '../services/auth';

import ForgotPasswordPage from './ForgotPasswordPage';

const server = setupServer();
const bodies: unknown[] = [];
const SENT_MESSAGE =
  'If an account exists for that email, we have sent password reset instructions. Check your inbox.';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  bodies.length = 0;
});
afterEach(() => {
  server.resetHandlers();
  authClient.clearLocalSession();
  window.sessionStorage.clear();
});
afterAll(() => server.close());

const routes = (
  <Routes>
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/login" element={<p>login page</p>} />
  </Routes>
);

describe('ForgotPasswordPage', () => {
  it('requires an email before sending anything', async () => {
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/forgot-password' });

    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('This field is required.');
    expect(screen.getByLabelText('Email')).toHaveFocus();
    expect(bodies).toHaveLength(0);
  });

  it('shows the same confirmation whatever the outcome, and removes the form', async () => {
    server.use(
      rest.post(authUrl('password-reset/'), (req, res, ctx) => {
        bodies.push(req.body);
        return res(ctx.status(200), ctx.json({ detail: 'ok' }));
      })
    );
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/forgot-password' });

    await user.type(screen.getByLabelText('Email'), ' nobody@example.com ');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(SENT_MESSAGE);
    expect(status).toHaveFocus();
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
    expect(bodies).toEqual([{ email: 'nobody@example.com' }]);
  });

  it('shows a server email error on the field', async () => {
    server.use(
      rest.post(authUrl('password-reset/'), (_req, res, ctx) =>
        res(ctx.status(400), ctx.json({ email: ['Enter a valid email address.'] }))
      )
    );
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/forgot-password' });

    await user.type(screen.getByLabelText('Email'), 'bad');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByLabelText('Email')).toHaveAccessibleDescription(
      'Enter a valid email address.'
    );
  });

  it('shows the generic alert when the request fails', async () => {
    server.use(rest.post(authUrl('password-reset/'), (_req, res) => res.networkError('x')));
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/forgot-password' });

    await user.type(screen.getByLabelText('Email'), 'reader@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not reach the server. Please try again.'
    );
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('links back to log in', () => {
    renderWithAuth(routes, { route: '/forgot-password' });
    expect(screen.getByRole('link', { name: 'Back to log in' })).toHaveAttribute('href', '/login');
  });
});
