import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { apiService } from '../services/api';

import BanksPage from './BanksPage';

jest.mock('../services/api', () => {
  const actual = jest.requireActual('../services/api');
  return {
    ...actual,
    apiService: Object.assign(
      Object.create(Object.getPrototypeOf(actual.apiService)),
      actual.apiService,
      {
        getBanks: jest.fn(),
      }
    ),
  };
});

const mockGetBanks = apiService.getBanks as jest.Mock;

const bank = (id: number, name: string, credit_card_count: number) => ({
  id,
  name,
  logo: '',
  website: '',
  is_active: true,
  credit_card_count,
  created: '2026-01-01T00:00:00Z',
  modified: '2026-01-01T00:00:00Z',
});

beforeEach(() => {
  jest.clearAllMocks();
  document.head.innerHTML = '';
  document.title = '';
  mockGetBanks.mockResolvedValue({
    count: 3,
    next: null,
    previous: null,
    results: [
      bank(9, 'AB Bank PLC', 0),
      bank(13, 'BRAC Bank PLC', 10),
      bank(3, 'City Bank PLC', 4),
    ],
  });
});

const renderBanksPage = () =>
  render(
    <MemoryRouter initialEntries={['/banks']}>
      <BanksPage />
    </MemoryRouter>
  );

test('lists banks sorted by card count with links to bank pages', async () => {
  renderBanksPage();

  const bracLink = await screen.findByRole('link', { name: /BRAC Bank PLC/ });
  expect(bracLink).toHaveAttribute('href', '/bank/brac-bank-plc');
  expect(screen.getByRole('link', { name: /AB Bank PLC/ })).toHaveAttribute(
    'href',
    '/bank/ab-bank-plc'
  );
  expect(screen.getByText('10 cards')).toBeInTheDocument();

  const links = screen.getAllByRole('link');
  expect(links[0]).toHaveAttribute('href', '/bank/brac-bank-plc');
});

test('filters banks by the search box', async () => {
  renderBanksPage();

  await screen.findByRole('link', { name: /BRAC Bank PLC/ });
  fireEvent.change(screen.getByLabelText('Search banks by name'), {
    target: { value: 'city' },
  });

  expect(screen.getByRole('link', { name: /City Bank PLC/ })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /BRAC Bank PLC/ })).not.toBeInTheDocument();
});
