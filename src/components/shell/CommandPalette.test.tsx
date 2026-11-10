import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';

import { LanguageProvider } from '../../locales';
import { apiService, CreditCardApiResponse } from '../../services/api';
import { getAccountProducts } from '../../services/bankAccounts';
import { fetchAllBanks } from '../../services/banks';
import { getDepositProducts } from '../../services/deposits';
import { fetchLoanProducts } from '../../services/loans';

import CommandPalette, { resetPaletteCatalogueCache } from './CommandPalette';

jest.mock('../../services/api', () => {
  const actual = jest.requireActual('../../services/api');
  actual.apiService.getCreditCards = jest.fn();
  return actual;
});
jest.mock('../../services/banks', () => {
  const actual = jest.requireActual('../../services/banks');
  return { ...actual, fetchAllBanks: jest.fn() };
});
jest.mock('../../services/deposits', () => {
  const actual = jest.requireActual('../../services/deposits');
  return { ...actual, getDepositProducts: jest.fn() };
});
jest.mock('../../services/loans', () => {
  const actual = jest.requireActual('../../services/loans');
  return { ...actual, fetchLoanProducts: jest.fn() };
});
jest.mock('../../services/bankAccounts', () => {
  const actual = jest.requireActual('../../services/bankAccounts');
  return { ...actual, getAccountProducts: jest.fn() };
});

const mockGetCards = apiService.getCreditCards as jest.Mock;
const mockBanks = fetchAllBanks as jest.Mock;
const mockDepositList = getDepositProducts as jest.Mock;
const mockLoanList = fetchLoanProducts as jest.Mock;
const mockAccountList = getAccountProducts as jest.Mock;

const rawCard: CreditCardApiResponse = {
  id: 42,
  bank_name: 'Example Bank',
  name: 'Platinum Visa Card',
  annual_fee: '2000.00',
  interest_rate_apr: '25.00',
  lounge_access_international: '',
  lounge_access_domestic: '',
  has_lounge_access: false,
  has_annual_fee: true,
  is_active: true,
};

let currentPath = '';
const LocationProbe: React.FC = () => {
  const location = useLocation();
  currentPath = `${location.pathname}${location.search}`;
  return null;
};

const renderPalette = (onClose = jest.fn()) => {
  const utils = render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/']}>
        <CommandPalette onClose={onClose} />
        <LocationProbe />
      </MemoryRouter>
    </LanguageProvider>
  );
  return { ...utils, onClose };
};

describe('CommandPalette', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    resetPaletteCatalogueCache();
    currentPath = '';
    mockBanks.mockResolvedValue([
      { id: 1, name: 'Example Bank', name_bn: 'উদাহরণ ব্যাংক' },
      { id: 2, name: 'Beta Bank' },
    ]);
    mockGetCards.mockResolvedValue({ count: 1, next: null, previous: null, results: [rawCard] });
    mockDepositList.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
    mockLoanList.mockResolvedValue([]);
    mockAccountList.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
  });

  it('opens with focus in the search box and lists actions', async () => {
    renderPalette();
    const input = await screen.findByRole('combobox');
    expect(input).toHaveFocus();
    expect(screen.getByRole('option', { name: /check eligibility/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /compare/i })).toBeInTheDocument();
  });

  it('finds products and banks by name', async () => {
    const user = userEvent.setup();
    renderPalette();
    const input = await screen.findByRole('combobox');
    await user.type(input, 'platinum');
    expect(await screen.findByRole('option', { name: /Platinum Visa Card/ })).toBeInTheDocument();
    await user.clear(input);
    await user.type(input, 'example');
    // Exact name: the bank entry itself (the card entry carries its product name too).
    expect(await screen.findByRole('option', { name: 'Example Bank' })).toBeInTheDocument();
  });

  it('navigates with the keyboard: arrows move the active option, Enter follows it', async () => {
    const user = userEvent.setup();
    const { onClose } = renderPalette();
    const input = await screen.findByRole('combobox');
    await user.type(input, 'platinum');
    const option = await screen.findByRole('option', { name: /Platinum Visa Card/ });
    await waitFor(() => expect(input.getAttribute('aria-activedescendant')).toBe(option.id));
    await user.keyboard('{Enter}');
    expect(onClose).toHaveBeenCalled();
    expect(currentPath).toBe('/card/example-bank/platinum-visa-card');
    // The pick is remembered as a recent in the guest scope.
    const recents = JSON.parse(
      window.localStorage.getItem('creditmate.paletteRecents.v1:guest') ?? '[]'
    );
    expect(recents).toHaveLength(1);
  });

  it('keeps option ids unique when a recent duplicates an action, and points aria-activedescendant at the highlighted copy', async () => {
    // Seed a recent that is also an action (the EMI calculator).
    window.localStorage.setItem(
      'creditmate.paletteRecents.v1:guest',
      JSON.stringify([
        {
          id: 'action-emi',
          group: 'recent',
          label: 'EMI calculator',
          href: '/calculators',
          keywords: 'emi calculator loan instalment',
        },
      ])
    );
    const user = userEvent.setup();
    renderPalette();
    const input = await screen.findByRole('combobox');
    const options = screen.getAllByRole('option', { name: /EMI calculator/ });
    expect(options).toHaveLength(2);
    const [recentCopy, actionsCopy] = options;
    // Ids are namespaced per group — no duplicates in the document.
    expect(recentCopy.id).toBe('cm-palette-option-recent-action-emi');
    expect(actionsCopy.id).toBe('cm-palette-option-actions-action-emi');
    const allIds = screen.getAllByRole('option').map(option => option.id);
    expect(new Set(allIds).size).toBe(allIds.length);
    // Arrow down past the recent and the first three actions to the Actions
    // copy of the EMI calculator (flat order: recent, advisor, eligibility,
    // compare, emi).
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(input.getAttribute('aria-activedescendant')).toBe(actionsCopy.id);
    expect(actionsCopy).toHaveAttribute('aria-selected', 'true');
    expect(recentCopy).toHaveAttribute('aria-selected', 'false');
  });

  it('scopes recents per user: another account does not see them', async () => {
    window.localStorage.setItem(
      'creditmate.paletteRecents.v1:user-7',
      JSON.stringify([
        {
          id: 'action-emi',
          group: 'recent',
          label: 'EMI calculator',
          href: '/calculators',
          keywords: 'emi calculator loan instalment',
        },
      ])
    );
    const view = render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/']}>
          <CommandPalette userId={8} onClose={jest.fn()} />
        </MemoryRouter>
      </LanguageProvider>
    );
    await screen.findByRole('combobox');
    expect(screen.getAllByRole('option', { name: /EMI calculator/ })).toHaveLength(1);
    view.unmount();
    // Signed in as user 7: the recent appears alongside the action.
    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/']}>
          <CommandPalette userId={7} onClose={jest.fn()} />
        </MemoryRouter>
      </LanguageProvider>
    );
    await screen.findByRole('combobox');
    expect(screen.getAllByRole('option', { name: /EMI calculator/ })).toHaveLength(2);
  });

  it('Escape closes the palette', async () => {
    const user = userEvent.setup();
    const { onClose } = renderPalette();
    await screen.findByRole('combobox');
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
