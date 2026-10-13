import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { expectNoAxeViolations } from '../a11y/axe';
import { authUrl } from '../mocks/auth';
import { renderWithAuth } from '../mocks/renderAuth';
import { authClient } from '../services/auth';

import ResetPasswordPage from './ResetPasswordPage';

const server = setupServer();
const bodies: unknown[] = [];

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
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/forgot-password" element={<p>forgot page</p>} />
    <Route path="/login" element={<p>login page</p>} />
  </Routes>
);

const SUCCESS = 'Your password has been changed. You can now log in.';

describe('ResetPasswordPage', () => {
  it('explains an invalid link and offers a new one when the token is missing', () => {
    renderWithAuth(routes, { route: '/reset-password?uid=MQ' });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This reset link is invalid or incomplete.'
    );
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request a new reset link' })).toHaveAttribute(
      'href',
      '/forgot-password'
    );
  });

  it('checks that the two passwords match before sending', async () => {
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/reset-password?token=tok&uid=MQ' });

    await user.type(screen.getByLabelText('New password'), 'new-pw-123');
    await user.type(screen.getByLabelText('Confirm password'), 'new-pw-124');
    await user.click(screen.getByRole('button', { name: 'Set new password' }));

    expect(screen.getByLabelText('Confirm password')).toHaveAccessibleDescription(
      'The passwords do not match.'
    );
    expect(screen.getByLabelText('Confirm password')).toHaveFocus();
    expect(bodies).toHaveLength(0);
  });

  it('sends uid, token and new_password, then confirms success', async () => {
    server.use(
      rest.post(authUrl('password-reset/confirm/'), (req, res, ctx) => {
        bodies.push(req.body);
        return res(ctx.status(200), ctx.json({ detail: 'ok' }));
      })
    );
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/reset-password?token=tok&uid=MQ' });

    await user.type(screen.getByLabelText('New password'), 'new-pw-123');
    await user.type(screen.getByLabelText('Confirm password'), 'new-pw-123');
    await user.click(screen.getByRole('button', { name: 'Set new password' }));

    expect(await screen.findByRole('status')).toHaveTextContent(SUCCESS);
    expect(bodies).toEqual([{ uid: 'MQ', token: 'tok', new_password: 'new-pw-123' }]);
  });

  it('omits uid when the link does not carry one', async () => {
    server.use(
      rest.post(authUrl('password-reset/confirm/'), (req, res, ctx) => {
        bodies.push(req.body);
        return res(ctx.status(200), ctx.json({ detail: 'ok' }));
      })
    );
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/reset-password?token=tok' });

    await user.type(screen.getByLabelText('New password'), 'new-pw-123');
    await user.type(screen.getByLabelText('Confirm password'), 'new-pw-123');
    await user.click(screen.getByRole('button', { name: 'Set new password' }));

    expect(await screen.findByRole('status')).toHaveTextContent(SUCCESS);
    expect(bodies).toEqual([{ token: 'tok', new_password: 'new-pw-123' }]);
  });

  it('shows a rejected token as a form-level message, since it has no input', async () => {
    server.use(
      rest.post(authUrl('password-reset/confirm/'), (_req, res, ctx) =>
        res(ctx.status(400), ctx.json({ token: ['Invalid or expired token.'] }))
      )
    );
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/reset-password?token=old&uid=MQ' });

    await user.type(screen.getByLabelText('New password'), 'new-pw-123');
    await user.type(screen.getByLabelText('Confirm password'), 'new-pw-123');
    await user.click(screen.getByRole('button', { name: 'Set new password' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid or expired token.');
    expect(alert).toHaveFocus();
  });

  it('puts a rejected password on its field', async () => {
    server.use(
      rest.post(authUrl('password-reset/confirm/'), (_req, res, ctx) =>
        res(ctx.status(400), ctx.json({ new_password: ['This password is too short.'] }))
      )
    );
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/reset-password?token=tok' });

    await user.type(screen.getByLabelText('New password'), 'short');
    await user.type(screen.getByLabelText('Confirm password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Set new password' }));

    const field = await screen.findByLabelText('New password');
    expect(field).toHaveAccessibleDescription('This password is too short.');
    expect(field).toHaveFocus();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithAuth(routes, { route: '/reset-password?token=tok&uid=MQ' });
    await expectNoAxeViolations(container);
  });
});
