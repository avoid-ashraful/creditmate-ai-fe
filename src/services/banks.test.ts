import { CreditCard } from '../types';

import { apiService, BankApiResponse } from './api';
import { bankPath, bankSlug, computeBankCardStats, fetchAllBanks, findBankBySlug } from './banks';

jest.mock('./api', () => {
  const actual = jest.requireActual('./api');
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

const makeBank = (id: number, name: string, credit_card_count = 0): BankApiResponse => ({
  id,
  name,
  logo: '',
  website: '',
  is_active: true,
  credit_card_count,
  created: '2026-01-01T00:00:00Z',
  modified: '2026-01-01T00:00:00Z',
});

const makeCard = (partial: Partial<CreditCard>): CreditCard => ({
  id: 1,
  name: 'Card',
  annualFee: null,
  interestRateApr: null,
  loungeAccessInternational: null,
  loungeAccessDomestic: null,
  cashAdvanceFee: '',
  latePaymentFee: '',
  annualFeeWaiverPolicy: null,
  rewardPointsPolicy: '',
  additionalFeatures: [],
  sourceUrl: '',
  isActive: true,
  lastUpdated: null,
  images: [],
  ...partial,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('bankSlug / bankPath', () => {
  test('matches the bank slug convention used in card URLs', () => {
    expect(bankSlug({ name: 'BRAC Bank PLC' })).toBe('brac-bank-plc');
    expect(bankPath({ name: 'BRAC Bank PLC' })).toBe('/bank/brac-bank-plc');
    expect(bankSlug({ name: 'Al-Arafah Islami Bank PLC' })).toBe('al-arafah-islami-bank-plc');
  });
});

describe('findBankBySlug', () => {
  test('finds a bank by its slugified name', () => {
    const banks = [makeBank(1, 'AB Bank PLC'), makeBank(2, 'BRAC Bank PLC')];
    expect(findBankBySlug(banks, 'brac-bank-plc')?.id).toBe(2);
  });

  test('returns undefined for an unknown slug', () => {
    expect(findBankBySlug([makeBank(1, 'AB Bank PLC')], 'no-such-bank')).toBeUndefined();
  });
});

describe('fetchAllBanks', () => {
  test('follows pagination until next is null', async () => {
    mockGetBanks
      .mockResolvedValueOnce({
        count: 3,
        next: 'http://api/banks/?page=2',
        previous: null,
        results: [makeBank(1, 'A Bank'), makeBank(2, 'B Bank')],
      })
      .mockResolvedValueOnce({
        count: 3,
        next: null,
        previous: 'http://api/banks/',
        results: [makeBank(3, 'C Bank')],
      });

    const banks = await fetchAllBanks();

    expect(banks.map(bank => bank.id)).toEqual([1, 2, 3]);
    expect(mockGetBanks).toHaveBeenCalledTimes(2);
    expect(mockGetBanks).toHaveBeenNthCalledWith(2, undefined, undefined, 2);
  });
});

describe('computeBankCardStats', () => {
  test('derives ranges only from known fees and APRs', () => {
    const stats = computeBankCardStats([
      makeCard({ id: 1, annualFee: 3000, interestRateApr: 25 }),
      makeCard({ id: 2, annualFee: 0, interestRateApr: 20, loungeAccessDomestic: 'Unlimited' }),
      makeCard({ id: 3, annualFee: null, interestRateApr: null }),
    ]);

    expect(stats.totalCards).toBe(3);
    expect(stats.annualFeeMin).toBe(0);
    expect(stats.annualFeeMax).toBe(3000);
    expect(stats.aprMin).toBe(20);
    expect(stats.aprMax).toBe(25);
    expect(stats.freeCardCount).toBe(1);
    expect(stats.loungeCardCount).toBe(1);
  });

  test('empty card list yields null ranges and zero counts', () => {
    const stats = computeBankCardStats([]);
    expect(stats.totalCards).toBe(0);
    expect(stats.annualFeeMin).toBeNull();
    expect(stats.aprMax).toBeNull();
    expect(stats.freeCardCount).toBe(0);
  });
});
