import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { fetchLoanFieldHistory, fetchLoanProduct, LoanProductDetail } from '../services/loans';

import LoanDetailPage from './LoanDetailPage';

jest.mock('../services/loans', () => {
  const actual = jest.requireActual('../services/loans');
  return { ...actual, fetchLoanProduct: jest.fn(), fetchLoanFieldHistory: jest.fn() };
});
jest.mock('../services/auth', () => ({
  authClient: { hasSession: () => false, getAccessToken: async () => null },
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
  effectiveRate: { min: 14.5, max: 16.5, source: 'product_page', label: 'expected_profit' },
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
        <Routes>
          <Route path="/loans/:slug" element={<LoanDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText('SIBL Islamic Consumer Finance')).toBeInTheDocument();
    expect(screen.getByText(/Expected profit/)).toBeInTheDocument();
    expect(screen.getByText('14.5% – 16.5%')).toBeInTheDocument();
    expect(screen.getByText('https://www.siblbd.com/retail/consumer-finance')).toBeInTheDocument();
    expect(screen.getByText(/Sign in to see the recorded change history/)).toBeInTheDocument();
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/pre-approved/i);
    expect(text).not.toMatch(/guaranteed/i);
  });
});
