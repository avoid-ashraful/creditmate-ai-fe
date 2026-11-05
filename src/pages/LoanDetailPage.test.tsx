import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { ShortlistProvider } from '../hooks/ShortlistProvider';
import { fetchLoanFieldHistory, fetchLoanProduct, LoanProductDetail } from '../services/loans';

import LoanDetailPage from './LoanDetailPage';

jest.mock('../services/loans', () => {
  const actual = jest.requireActual('../services/loans');
  return {
    ...actual,
    fetchLoanProduct: jest.fn(),
    fetchLoanFieldHistory: jest.fn(),
    runLoanScenario: jest.fn(async () => ({
      loanType: 'personal',
      amount: 500000,
      tenureMonths: 60,
      monthlyIncome: null,
      results: [],
      notes: [],
    })),
  };
});
jest.mock('../services/auth', () => ({
  authClient: { hasSession: () => false, getAccessToken: async () => null },
}));
jest.mock('../hooks/AuthProvider', () => ({
  useAuth: () => ({ status: 'anonymous', user: null }),
}));
jest.mock('../utils/seo');

const mockFetchProduct = fetchLoanProduct as jest.Mock;
const mockFetchHistory = fetchLoanFieldHistory as jest.Mock;

const islamicDetail: LoanProductDetail = {
  id: 9,
  slug: 'sibl-islamic-consumer-finance',
  name: 'SIBL Islamic Consumer Finance',
  bank: 33,
  bankName: 'Social Islami Bank',
  institutionName: '',
  lenderName: 'Social Islami Bank',
  lenderType: 'bank',
  loanType: 'personal',
  segmentTags: ['salaried'],
  purposeTags: [],
  isIslamic: true,
  shariahMode: 'bai_muajjal',
  rateLabel: 'expected_profit',
  rateMin: 14.5,
  rateMax: 16.5,
  rateType: 'floating',
  rateSource: 'product_page',
  spreadOverDepositRate: null,
  usesSimpleInterest: false,
  effectiveRate: {
    min: 14.5,
    max: 16.5,
    source: 'product_page',
    label: 'expected_profit',
    category: null,
  },
  amountMinBdt: 50000,
  amountMaxBdt: 1000000,
  tenureMinMonths: 12,
  tenureMaxMonths: 60,
  ltvPercent: null,
  processingFeePercent: null,
  processingFeePercentMax: null,
  processingFeeCapBdt: null,
  minIncomeBySegment: {},
  incomeMetric: 'gross',
  sourceUrl: 'https://www.siblbd.com/retail/consumer-finance',
  verifiedAt: '2026-11-04T00:00:00Z',
  rateBasisText: 'Declared expected profit rate.',
  amountNotes: '',
  gracePeriodMonths: null,
  processingFeeNotes: '',
  earlySettlementPercent: null,
  earlySettlementNotes: '',
  partialPrepaymentPercent: null,
  partialPrepaymentRules: '',
  penalChargePercent: null,
  penalChargeNotes: '',
  supervisionChargePercent: null,
  minAge: null,
  maxAgeAtMaturity: null,
  experienceRequirements: {},
  guarantorRequired: false,
  guarantorCount: null,
  guarantorRules: '',
  collateralType: 'none',
  collateralRules: '',
  dbrMaxPercent: null,
  documentsChecklist: ['NID', 'e-TIN'],
  disbursementMode: '',
  jointApplicationAllowed: false,
  insuranceRequired: false,
  insuranceBundled: false,
  insuranceNotes: '',
  unsecuredMaxBdt: null,
  incomeMultipleMax: 12,
  securedBy: '',
  depositType: '',
  ltvOfDepositPercent: null,
  propertyTypes: [],
  maxAmountByPurpose: {},
  takeoverAllowed: false,
  nrbEligible: false,
  registrationCostIncluded: false,
  vehicleConditions: [],
  ltvByVehicleType: {},
  brtaRegistrationRequired: false,
  sourceKind: 'product_page',
  sourceEffectiveDate: null,
  verifiedBy: 'manual_research',
  regulatoryCapFlags: [],
  notes: '',
};

describe('LoanDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchProduct.mockResolvedValue(islamicDetail);
    mockFetchHistory.mockResolvedValue([]);
  });

  it('labels Islamic pricing as expected profit and shows provenance', async () => {
    render(
      <MemoryRouter initialEntries={['/loans/sibl-islamic-consumer-finance']}>
        <ShortlistProvider>
          <Routes>
            <Route path="/loans/:slug" element={<LoanDetailPage />} />
          </Routes>
        </ShortlistProvider>
      </MemoryRouter>
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: /SIBL Islamic Consumer Finance/ })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Expected profit/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('14.5% – 16.5%').length).toBeGreaterThan(0);
    expect(screen.getByText('https://www.siblbd.com/retail/consumer-finance')).toBeInTheDocument();
    // D1: change history is public — no sign-in note; the honest empty
    // state shows for everyone when nothing has been recorded.
    expect(
      screen.queryByText(/Sign in to see the recorded change history/)
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/No changes have been recorded for this product yet/)
    ).toBeInTheDocument();
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/pre-approved/i);
    expect(text).not.toMatch(/guaranteed/i);
  });

  it('renders the type-specific terms block (personal: income multiple)', async () => {
    render(
      <MemoryRouter initialEntries={['/loans/sibl-islamic-consumer-finance']}>
        <ShortlistProvider>
          <Routes>
            <Route path="/loans/:slug" element={<LoanDetailPage />} />
          </Routes>
        </ShortlistProvider>
      </MemoryRouter>
    );
    expect(await screen.findByText('Product-specific terms')).toBeInTheDocument();
    expect(screen.getByText('Maximum income multiple')).toBeInTheDocument();
    expect(screen.getByText('12×')).toBeInTheDocument();
  });
});
