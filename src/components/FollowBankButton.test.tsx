/**
 * FollowBankButton (redesign Phase 2, D4): the follow is a real
 * server-side subscription. Signed-out visitors get a sign-in prompt;
 * signed-in users toggle against the alerts bank-follows endpoints.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { AUTH_STATUS, AuthStatus } from '../hooks/AuthProvider';
import { LanguageProvider } from '../locales/LanguageContext';
import { alertsClient } from '../services/alerts';

import FollowBankButton from './FollowBankButton';

let mockAuthStatus: AuthStatus = AUTH_STATUS.anonymous;

jest.mock('../hooks/AuthProvider', () => ({
  ...jest.requireActual('../hooks/AuthProvider'),
  useAuth: () => ({ status: mockAuthStatus }),
}));

jest.mock('../services/alerts', () => ({
  alertsClient: {
    listBankFollows: jest.fn(),
    followBank: jest.fn(),
    unfollowBank: jest.fn(),
  },
}));

const mockList = alertsClient.listBankFollows as jest.Mock;
const mockFollow = alertsClient.followBank as jest.Mock;
const mockUnfollow = alertsClient.unfollowBank as jest.Mock;

const renderButton = () =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <FollowBankButton bankId={7} bankName="BRAC Bank PLC" />
      </LanguageProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthStatus = AUTH_STATUS.anonymous;
  mockList.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
  mockFollow.mockResolvedValue({
    id: 1,
    bank: 7,
    bank_name: 'BRAC Bank PLC',
    created: '2026-11-05T00:00:00Z',
  });
  mockUnfollow.mockResolvedValue(undefined);
});

test('signed-out visitors get a sign-in prompt, not a toggle', () => {
  renderButton();
  expect(screen.getByText(/sign in to follow this bank/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Follow this bank' })).toHaveAttribute('href', '/login');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(mockList).not.toHaveBeenCalled();
});

test('signed-in user can follow and unfollow', async () => {
  mockAuthStatus = AUTH_STATUS.authenticated;
  renderButton();

  const button = await screen.findByRole('button', { name: 'Follow this bank: BRAC Bank PLC' });
  expect(button).toHaveAttribute('aria-pressed', 'false');

  await userEvent.click(button);
  expect(mockFollow).toHaveBeenCalledWith(7);
  await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));
  expect(button).toHaveTextContent('Following this bank');

  await userEvent.click(button);
  expect(mockUnfollow).toHaveBeenCalledWith(7);
  await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'));
});

test('an existing follow renders in the following state', async () => {
  mockAuthStatus = AUTH_STATUS.authenticated;
  mockList.mockResolvedValue({
    count: 1,
    next: null,
    previous: null,
    results: [{ id: 3, bank: 7, bank_name: 'BRAC Bank PLC', created: '2026-11-01T00:00:00Z' }],
  });
  renderButton();
  const button = await screen.findByRole('button', { name: 'Following this bank: BRAC Bank PLC' });
  expect(button).toHaveAttribute('aria-pressed', 'true');
});

test('a failed toggle shows an honest error and keeps state', async () => {
  mockAuthStatus = AUTH_STATUS.authenticated;
  mockFollow.mockRejectedValue(new Error('network'));
  renderButton();
  const button = await screen.findByRole('button', { name: 'Follow this bank: BRAC Bank PLC' });
  await userEvent.click(button);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not update your bank follow. Please try again.'
  );
  expect(button).toHaveAttribute('aria-pressed', 'false');
});
