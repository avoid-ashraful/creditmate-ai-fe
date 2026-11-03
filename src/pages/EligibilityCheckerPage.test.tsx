import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { checkEligibility, EligibilityResponse } from '../services/eligibility';
import { CreditCard } from '../types';

import EligibilityCheckerPage from './EligibilityCheckerPage';

jest.mock('../services/eligibility', () => {
  const actual = jest.requireActual('../services/eligibility');
  return { ...actual, checkEligibility: jest.fn() };
});
jest.mock('../utils/seo');

const mockCheck = checkEligibility as jest.Mock;

const makeCard = (partial: Partial<CreditCard>): CreditCard => ({
  id: 1,
  bankId: 1,
  bankName: 'Test Bank',
  name: 'Card',
  annualFee: 1500,
  interestRateApr: 25,
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
  minMonthlyIncome: 30000,
  ...partial,
});

const response: EligibilityResponse = {
  counts: { eligible: 1, likely: 1, unknown: 1, not_yet: 1 },
  totalCards: 4,
  results: [
    {
      card: makeCard({ id: 1, name: 'Eligible Card' }),
      verdict: 'eligible',
      reasons: ['Your income of BDT 30,000 meets the published minimum of BDT 30,000.'],
    },
    {
      card: makeCard({ id: 2, name: 'Likely Card', minMonthlyIncome: 34000 }),
      verdict: 'likely',
      reasons: ['Published minimum income is BDT 34,000; yours is BDT 30,000 — within 20%.'],
    },
    {
      card: makeCard({ id: 3, name: 'Silent Card', minMonthlyIncome: null }),
      verdict: 'unknown',
      reasons: ['No published income requirement — the bank decides.'],
    },
    {
      card: makeCard({ id: 4, name: 'Premium Card', minMonthlyIncome: 70000 }),
      verdict: 'not_yet',
      reasons: ['Published minimum income is BDT 70,000; yours is BDT 30,000.'],
    },
  ],
  notes: ['Most banks ask for an e-TIN certificate.'],
  method: 'Verdicts use only each card’s published minimum monthly income.',
  disclaimer: 'This is an estimate. The issuing bank makes the final decision.',
};

const renderPage = () =>
  render(
    <BrowserRouter>
      <EligibilityCheckerPage />
    </BrowserRouter>
  );

const fillAndSubmit = async () => {
  await userEvent.type(screen.getByLabelText(/Monthly income/), '30000');
  await userEvent.click(screen.getByRole('button', { name: /Check my eligibility/ }));
};

describe('EligibilityCheckerPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the estimate banner at the top before any check', () => {
    renderPage();
    expect(screen.getAllByText(/not an approval/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText(/Monthly income/)).toBeInTheDocument();
  });

  it('rejects an empty income without calling the service', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /Check my eligibility/ }));
    expect(await screen.findByText(/Enter your monthly income/)).toBeInTheDocument();
    expect(mockCheck).not.toHaveBeenCalled();
  });

  it('submits the profile and groups results by verdict with reasons', async () => {
    mockCheck.mockResolvedValue(response);
    renderPage();
    await fillAndSubmit();

    await waitFor(() => expect(mockCheck).toHaveBeenCalledTimes(1));
    expect(mockCheck).toHaveBeenCalledWith(
      expect.objectContaining({
        monthlyIncome: 30000,
        employmentType: 'salaried',
        cibStatus: 'unknown',
        islamicOnly: false,
      })
    );

    expect(await screen.findByText('Your estimated results')).toBeInTheDocument();
    expect(screen.getByText(/Eligible on published criteria \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Not yet \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/No published requirement \(1\)/)).toBeInTheDocument();
    expect(screen.getByText('Eligible Card')).toBeInTheDocument();
    expect(
      screen.getByText(/Your income of BDT 30,000 meets the published minimum/)
    ).toBeInTheDocument();
    expect(screen.getByText(/No published income requirement/)).toBeInTheDocument();
    // Transparency: only 3 of 4 fixture cards publish a minimum income.
    expect(screen.getByText(/Only 3 of 4 cards publish a minimum income/)).toBeInTheDocument();
    expect(screen.getByText(/Most banks ask for an e-TIN/)).toBeInTheDocument();
    expect(screen.getByText(/issuing bank makes the final decision/)).toBeInTheDocument();
  });

  it('groups render in eligible-first order', async () => {
    mockCheck.mockResolvedValue(response);
    renderPage();
    await fillAndSubmit();
    const headings = await screen.findAllByRole('heading', { level: 3 });
    const groupHeadings = headings
      .map(heading => heading.textContent ?? '')
      .filter(text => /\(1\)$/.test(text));
    expect(groupHeadings[0]).toContain('Eligible on published criteria');
    expect(groupHeadings[groupHeadings.length - 1]).toContain('Not yet');
  });

  it('card tiles link to the card detail and compare pages', async () => {
    mockCheck.mockResolvedValue(response);
    renderPage();
    await fillAndSubmit();
    const detailLink = await screen.findByRole('link', { name: 'Eligible Card' });
    expect(detailLink).toHaveAttribute('href', '/card/test-bank/eligible-card');
    const compareLinks = screen.getAllByRole('link', { name: 'Compare' });
    expect(compareLinks[0]).toHaveAttribute('href', '/compare?ids=1');
  });

  it('sends islamic_only and CIB answers when chosen', async () => {
    mockCheck.mockResolvedValue({ ...response, totalCards: 0, results: [] });
    renderPage();
    await userEvent.type(screen.getByLabelText(/Monthly income/), '20000');
    await userEvent.selectOptions(screen.getByLabelText(/CIB status/), 'has_issues');
    await userEvent.click(screen.getByLabelText(/Islamic/));
    await userEvent.click(screen.getByRole('button', { name: /Check my eligibility/ }));
    await waitFor(() => expect(mockCheck).toHaveBeenCalled());
    expect(mockCheck).toHaveBeenCalledWith(
      expect.objectContaining({ cibStatus: 'has_issues', islamicOnly: true })
    );
    expect(await screen.findByText(/No cards matched those answers/)).toBeInTheDocument();
  });

  it('shows an error state when the service fails', async () => {
    mockCheck.mockRejectedValue(new Error('boom'));
    renderPage();
    await fillAndSubmit();
    expect(await screen.findByText(/could not run the check/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try again/ })).toBeInTheDocument();
  });

  it('never uses approval-promising language', () => {
    renderPage();
    expect(document.body.textContent?.toLowerCase()).not.toContain('pre-approved');
    expect(document.body.textContent?.toLowerCase()).not.toContain('guaranteed');
  });
});
