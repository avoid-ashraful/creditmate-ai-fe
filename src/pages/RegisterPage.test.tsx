import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { expectNoAxeViolations } from '../a11y/axe';
import { AUTH_USER, authUrl, sessionBody } from '../mocks/auth';
import { renderWithAuth } from '../mocks/renderAuth';
import { authClient } from '../services/auth';

import RegisterPage from './RegisterPage';

const server = setupServer();
const bodies: unknown[] = [];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  bodies.length = 0;
  authClient.clearLocalSession();
  window.sessionStorage.clear();
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => server.close());

const routes = (
  <Routes>
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/account" element={<p>account home</p>} />
  </Routes>
);

const fillForm = async (
  user: ReturnType<typeof userEvent.setup>,
  { email, password, confirm }: { email: string; password: string; confirm: string }
) => {
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.type(screen.getByLabelText('Confirm password'), confirm);
  await user.click(screen.getByRole('button', { name: 'Create account' }));
};

describe('RegisterPage', () => {
  it('rejects mismatched passwords locally and sends no request', async () => {
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/register' });

    await fillForm(user, { email: AUTH_USER.email, password: 'pw-12345', confirm: 'pw-99999' });

    const confirm = screen.getByLabelText('Confirm password');
    expect(confirm).toHaveAccessibleDescription('The passwords do not match.');
    expect(confirm).toHaveFocus();
    expect(bodies).toHaveLength(0);
  });

  it('creates the account, sends password_confirm and lands on the account page', async () => {
    server.use(
      rest.post(authUrl('register/'), (req, res, ctx) => {
        bodies.push(req.body);
        return res(ctx.status(201), ctx.json(sessionBody()));
      })
    );
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/register' });

    await fillForm(user, { email: AUTH_USER.email, password: 'pw-12345', confirm: 'pw-12345' });

    expect(await screen.findByText('account home')).toBeInTheDocument();
    expect(bodies).toEqual([
      { email: AUTH_USER.email, password: 'pw-12345', password_confirm: 'pw-12345' },
    ]);
  });

  it('maps DRF field errors onto their inputs and focuses the first one', async () => {
    server.use(
      rest.post(authUrl('register/'), (_req, res, ctx) =>
        res(
          ctx.status(400),
          ctx.json({
            email: ['user with this email already exists.'],
            password: ['This password is too common.'],
          })
        )
      )
    );
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/register' });

    await fillForm(user, { email: AUTH_USER.email, password: 'password', confirm: 'password' });

    const email = await screen.findByLabelText('Email');
    expect(email).toHaveAccessibleDescription('user with this email already exists.');
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(
      'This password is too common.'
    );
    expect(email).toHaveFocus();
  });

  it('shows a non-field error in the form alert', async () => {
    server.use(
      rest.post(authUrl('register/'), (_req, res, ctx) =>
        res(ctx.status(400), ctx.json({ non_field_errors: ['Registration is closed.'] }))
      )
    );
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/register' });

    await fillForm(user, { email: AUTH_USER.email, password: 'pw-12345', confirm: 'pw-12345' });

    expect(await screen.findByRole('alert')).toHaveTextContent('Registration is closed.');
  });

  it('shows the generic message for an unexpected server failure', async () => {
    server.use(rest.post(authUrl('register/'), (_req, res, ctx) => res(ctx.status(500))));
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/register' });

    await fillForm(user, { email: AUTH_USER.email, password: 'pw-12345', confirm: 'pw-12345' });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong. Please try again.'
    );
  });

  it('links to the login page', () => {
    renderWithAuth(routes, { route: '/register' });
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithAuth(routes, { route: '/register' });
    await expectNoAxeViolations(container);
  });
});
