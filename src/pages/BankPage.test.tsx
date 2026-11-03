import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { apiService } from '../services/api';

import BankPage from './BankPage';

// getBanks / getCreditCards are mocked; transformCreditCard (spread from the
// real service) keeps working.
jest.mock('../services/api', () => {
  const actual = jest.requireActual('../services/api');
  return {
    ...actual,
    apiService: Object.assign(
      Object.create(Object.getPrototypeOf(actual.apiService)),
      actual.apiService,
      {
        getBanks: jest.fn(),
        getCreditCards: jest.fn(),
      }
    ),
  };
});

jest.mock('../components/CardDetailsPopup', () => () => null);
jest.mock('../components/ComparisonBar', () => () => null);

const mockGetBanks = apiService.getBanks as jest.Mock;
const mockGetCreditCards = apiService.getCreditCards as jest.Mock;

const banksResponse = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: 13,
      name: 'BRAC Bank PLC',
      logo: '',
      website: 'https://www.bracbank.com',
      is_active: true,
      credit_card_count: 2,
      created: '2026-01-01T00:00:00Z',
      modified: '2026-01-01T00:00:00Z',
    },
    {
      id: 9,
      name: 'AB Bank PLC',
      logo: '',
      website: '',
      is_active: true,
      credit_card_count: 0,
      created: '2026-01-01T00:00:00Z',
      modified: '2026-01-01T00:00:00Z',
    },
  ],
};

const bracCardsResponse = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      bank_name: 'BRAC Bank PLC',
      name: 'BRAC Emerald Card',
      annual_fee: '3000.00',
      interest_rate_apr: '25.00',
      lounge_access_international: '3 visits',
      is_active: true,
    },
    {
      id: 2,
      bank_name: 'BRAC Bank PLC',
      name: 'BRAC Free Card',
      annual_fee: '0.00',
      interest_rate_apr: '20.00',
      is_active: true,
    },
  ],
};

const emptyCardsResponse = { count: 0, next: null, previous: null, results: [] };

const renderBankPage = (slug: string) =>
  render(
    <MemoryRouter initialEntries={[`/bank/${slug}`]}>
      <Routes>
        <Route path="/bank/:slug" element={<BankPage />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  jest.clearAllMocks();
  document.head.innerHTML = '';
  document.title = '';
  mockGetBanks.mockResolvedValue(banksResponse);
});

test('renders bank header, derived stats, and its cards', async () => {
  mockGetCreditCards.mockResolvedValue(bracCardsResponse);

  renderBankPage('brac-bank-plc');

  expect(await screen.findByRole('heading', { level: 1, name: 'BRAC Bank PLC' })).toBeTruthy();
  expect(mockGetCreditCards).toHaveBeenCalledWith(expect.objectContaining({ bankId: 13, page: 1 }));
  expect(await screen.findByText('BRAC Emerald Card')).toBeInTheDocument();
  expect(screen.getByText('BRAC Free Card')).toBeInTheDocument();
  // Stats derived from the two cards: fee range spans the free and paid card.
  expect(screen.getByText('BDT 0 – 3,000')).toBeInTheDocument();
  expect(screen.getByText('20 – 25% APR')).toBeInTheDocument();
  expect(document.title).toContain('BRAC Bank PLC');
});

test('shows the empty state for a bank with no cards', async () => {
  mockGetCreditCards.mockResolvedValue(emptyCardsResponse);

  renderBankPage('ab-bank-plc');

  expect(await screen.findByText('No cards listed yet')).toBeInTheDocument();
});

test('shows not found for an unknown bank slug without fetching cards', async () => {
  renderBankPage('no-such-bank');

  expect(await screen.findByText('Bank not found')).toBeInTheDocument();
  expect(mockGetCreditCards).not.toHaveBeenCalled();
  expect(screen.getByRole('link', { name: 'Browse all banks' })).toHaveAttribute('href', '/banks');
});
