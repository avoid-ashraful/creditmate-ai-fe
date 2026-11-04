import { render, screen } from '@testing-library/react';
import React from 'react';

import { LanguageProvider } from '../locales';
import { CreditCard } from '../types';

import ScoreBadge from './ScoreBadge';
import ScoreSection from './ScoreSection';

const renderWithLang = (ui: React.ReactElement) =>
  render(<LanguageProvider>{ui}</LanguageProvider>);

const breakdown = {
  annual_cost: { points: 2.0, max: 3, reason: 'annual fee BDT 2,500; fee waiver available' },
  interest: { points: 0.3, max: 2, reason: 'APR 25% — at the 25% regulatory cap' },
  rewards: { points: 1.55, max: 2.5, reason: 'earns up to 3 pts per BDT 100' },
  perks: { points: 1.2, max: 1.5, reason: 'international lounge: 4 visits/year' },
  data_confidence: { points: 0.95, max: 1, reason: 'verified card data' },
};

const baseCard: CreditCard = {
  id: 1,
  name: 'Scored Card',
  annualFee: 2500,
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
  creditmateScore: 7.0,
  creditmateScoreBreakdown: breakdown,
};

describe('ScoreBadge', () => {
  it('renders score and Excellent band at 7.0', () => {
    renderWithLang(<ScoreBadge score={7.0} />);
    expect(screen.getByText(/7\.0 Excellent/)).toBeInTheDocument();
  });

  it('labels mid-range and low scores truthfully', () => {
    const { rerender } = renderWithLang(<ScoreBadge score={5.5} />);
    expect(screen.getByText(/5\.5 Fair/)).toBeInTheDocument();
    rerender(
      <LanguageProvider>
        <ScoreBadge score={3.2} />
      </LanguageProvider>
    );
    expect(screen.getByText(/3\.2 Basic/)).toBeInTheDocument();
  });

  it('renders nothing without a score', () => {
    const { container } = renderWithLang(<ScoreBadge score={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('ScoreSection', () => {
  it('renders total, band and every breakdown component with reasons', () => {
    renderWithLang(<ScoreSection card={baseCard} />);
    expect(screen.getByRole('heading', { name: 'CreditMate Score' })).toBeInTheDocument();
    expect(screen.getByText('7.0')).toBeInTheDocument();
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    expect(screen.getByText('Annual cost')).toBeInTheDocument();
    expect(screen.getByText('Interest (APR)')).toBeInTheDocument();
    expect(screen.getByText('Rewards value')).toBeInTheDocument();
    expect(screen.getByText('Perks & lounge access')).toBeInTheDocument();
    expect(screen.getByText('Data confidence')).toBeInTheDocument();
    expect(screen.getByText(/annual fee BDT 2,500/)).toBeInTheDocument();
    expect(screen.getByText('2.00 of 3.0')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /How the CreditMate Score works/ })).toHaveAttribute(
      'href',
      '/methodology'
    );
  });

  it('renders nothing when the card has no breakdown', () => {
    const { container } = renderWithLang(
      <ScoreSection card={{ ...baseCard, creditmateScoreBreakdown: null }} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
