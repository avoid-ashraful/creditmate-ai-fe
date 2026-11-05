import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { expectNoAxeViolations } from '../a11y/axe';
import { ToastProvider } from '../components/ui';
import { AUTH_USER } from '../mocks/auth';
import { server } from '../mocks/jest.setup';
import { renderWithAuth } from '../mocks/renderAuth';
import { authClient } from '../services/auth';
import { savedService } from '../services/saved';

import PlanPage from './PlanPage';

jest.mock('../services/saved', () => ({
  savedService: {
    getScenarios: jest.fn(),
    deleteScenario: jest.fn(),
    createScenario: jest.fn(),
  },
  savedErrorMessage: () => 'error',
}));
jest.mock('../hooks/useSeoMeta', () => ({ useSeoMeta: jest.fn() }));

const mockGetScenarios = savedService.getScenarios as jest.Mock;
const mockDeleteScenario = savedService.deleteScenario as jest.Mock;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  authClient.clearLocalSession();
});
afterAll(() => server.close());

const routes = (
  <ToastProvider>
    <Routes>
      <Route path="/plan" element={<PlanPage />} />
      <Route path="/plan/loan" element={<p>loan tool destination</p>} />
    </Routes>
  </ToastProvider>
);

const authenticated = async () => {
  const { rest } = await import('msw');
  const { authUrl } = await import('../mocks/auth');
  server.use(
    rest.post(authUrl('login/'), (_req, res, ctx) =>
      res(ctx.json({ access: 'access-1', refresh: 'refresh-1', user: AUTH_USER }))
    ),
    rest.get(authUrl('me/'), (_req, res, ctx) => res(ctx.json(AUTH_USER)))
  );
  await authClient.login({ email: AUTH_USER.email, password: 'pw' });
};

describe('PlanPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetScenarios.mockResolvedValue([]);
    mockDeleteScenario.mockResolvedValue(undefined);
  });

  it('lists every tool with the question it answers', async () => {
    const { container } = renderWithAuth(routes, { route: '/plan' });
    expect(await screen.findByRole('heading', { name: 'Plan' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
    // Each tool is linked from both the workspace sub-nav and the tool
    // list; every one of those links must land on the tool's route.
    const hrefsFor = (name: RegExp) =>
      screen.getAllByRole('link', { name }).map(link => link.getAttribute('href'));
    expect(hrefsFor(/EMI calculator/).every(href => href === '/plan/emi')).toBe(true);
    expect(hrefsFor(/Loan comparison/).every(href => href === '/plan/loan')).toBe(true);
    expect(hrefsFor(/Eligibility check/).every(href => href === '/eligibility-checker')).toBe(true);
  });

  it('tells guests plainly that saving scenarios needs an account', async () => {
    renderWithAuth(routes, { route: '/plan' });
    expect(
      await screen.findByText(/Sign in to save scenarios to your account/)
    ).toBeInTheDocument();
  });

  it('reopens and deletes saved scenarios for signed-in users', async () => {
    await authenticated();
    mockGetScenarios.mockResolvedValue([
      {
        id: 5,
        name: 'House loan sketch',
        tool: 'loan',
        params: { amount: '2000000', months: '120', type: 'home' },
        created: '2026-11-01T00:00:00Z',
        modified: '2026-11-01T00:00:00Z',
      },
    ]);
    renderWithAuth(routes, { route: '/plan' });
    const reopen = await screen.findByRole('link', { name: 'House loan sketch' });
    expect(reopen).toHaveAttribute('href', '/plan/loan?amount=2000000&months=120&type=home');

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    const { within } = await import('@testing-library/react');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(mockDeleteScenario).toHaveBeenCalledWith(5);
  });
});
