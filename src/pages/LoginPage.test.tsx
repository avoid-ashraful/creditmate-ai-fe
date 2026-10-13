import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { AUTH_USER, authUrl, sessionBody } from '../mocks/auth';
import { renderWithAuth } from '../mocks/renderAuth';
import { authClient, REFRESH_TOKEN_STORAGE_KEY } from '../services/auth';

import LoginPage from './LoginPage';

const server = setupServer();
const requests: string[] = [];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  requests.length = 0;
});
afterEach(() => {
  server.resetHandlers();
  authClient.clearLocalSession();
  window.sessionStorage.clear();
});
afterAll(() => server.close());

const routes = (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/account" element={<p>account home</p>} />
    <Route path="/compare" element={<p>compare page</p>} />
  </Routes>
);

const loginHandler = (status: number, body: object, delayMs = 0) =>
  rest.post(authUrl('login/'), (req, res, ctx) => {
    requests.push(JSON.stringify(req.body));
    return res(ctx.delay(delayMs), ctx.status(status), ctx.json(body));
  });

describe('LoginPage', () => {
  it('labels the fields and sets autocomplete hints', () => {
    renderWithAuth(routes, { route: '/login' });

    const email = screen.getByLabelText('Email');
    const password = screen.getByLabelText('Password');
    expect(email).toHaveAttribute('type', 'email');
    expect(email).toHaveAttribute('autocomplete', 'email');
    expect(password).toHaveAttribute('type', 'password');
    expect(password).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });

  it('blocks an empty submit, marks fields invalid and focuses the first one', async () => {
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/login' });

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    const email = screen.getByLabelText('Email');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('This field is required.');
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Please check the highlighted fields.');
    expect(email).toHaveFocus();
    expect(requests).toHaveLength(0);
  });

  it('shows the generic invalid-credentials message for a 401 and moves focus to it', async () => {
    server.use(loginHandler(401, { detail: 'No active account found with the given credentials' }));
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/login' });

    await user.type(screen.getByLabelText('Email'), 'reader@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-pass');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('The email or password is incorrect.');
    expect(alert).toHaveFocus();
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
  });

  it('shows a server field error on its input and focuses that input', async () => {
    server.use(loginHandler(400, { email: ['Enter a valid email address.'] }));
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/login' });

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'pw-12345');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    const email = await screen.findByLabelText('Email');
    await waitFor(() => expect(email).toHaveAccessibleDescription('Enter a valid email address.'));
    expect(email).toHaveFocus();
  });

  it('shows the network message when the server cannot be reached', async () => {
    server.use(rest.post(authUrl('login/'), (_req, res) => res.networkError('offline')));
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/login' });

    await user.type(screen.getByLabelText('Email'), 'reader@example.com');
    await user.type(screen.getByLabelText('Password'), 'pw-12345');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not reach the server. Please try again.'
    );
  });

  it('disables the submit button while the request is in flight', async () => {
    server.use(loginHandler(200, sessionBody(), 100));
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/login' });

    await user.type(screen.getByLabelText('Email'), 'reader@example.com');
    await user.type(screen.getByLabelText('Password'), 'pw-12345');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByRole('button', { name: 'Submitting…' })).toBeDisabled();
    expect(await screen.findByText('account home')).toBeInTheDocument();
  });

  it('returns to the page the visitor asked for after logging in', async () => {
    server.use(loginHandler(200, sessionBody()));
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/login', state: { from: '/compare' } });

    await user.type(screen.getByLabelText('Email'), `  ${AUTH_USER.email}  `);
    await user.type(screen.getByLabelText('Password'), 'pw-12345');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('compare page')).toBeInTheDocument();
    // Surrounding whitespace in the email is trimmed before it is sent.
    expect(requests[0]).toBe(JSON.stringify({ email: AUTH_USER.email, password: 'pw-12345' }));
    expect(window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBe('refresh-1');
  });

  it('ignores an unsafe return target and goes to the account page', async () => {
    server.use(loginHandler(200, sessionBody()));
    const user = userEvent.setup();
    renderWithAuth(routes, { route: '/login', state: { from: 'https://evil.example' } });

    await user.type(screen.getByLabelText('Email'), AUTH_USER.email);
    await user.type(screen.getByLabelText('Password'), 'pw-12345');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('account home')).toBeInTheDocument();
  });

  it('renders Bengali copy when the language is bn', () => {
    renderWithAuth(routes, { route: '/login', lang: 'bn' });

    expect(screen.getByRole('heading', { name: 'লগ ইন' })).toBeInTheDocument();
    expect(screen.getByLabelText('ইমেইল')).toBeInTheDocument();
  });
});
