import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { LanguageProvider } from '../locales';
import type { BankFollowFeedEntry } from '../types/alerts';

import ChangeCard from './ChangeCard';

const entry = (overrides: Partial<BankFollowFeedEntry>): BankFollowFeedEntry => ({
  id: 'cards:1',
  vertical: 'cards',
  product_name: 'Example Platinum Card',
  product_key: '42',
  bank_id: 7,
  bank_name: 'Example Bank',
  field_name: 'annual_fee',
  old_value: 1500,
  new_value: 2000,
  source: 'bank_website',
  changed_at: '2026-10-12T10:00:00Z',
  is_new: false,
  ...overrides,
});

const renderCard = (e: BankFollowFeedEntry) =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <ChangeCard entry={e} />
      </LanguageProvider>
    </MemoryRouter>
  );

describe('ChangeCard (delta poster)', () => {
  it('shows old and new values, a neutral direction word, and the change date', () => {
    renderCard(entry({}));
    expect(screen.getByText('Annual fee')).toBeInTheDocument();
    expect(screen.getByText(/1,?500/)).toBeInTheDocument();
    expect(screen.getByText(/2,?000/)).toBeInTheDocument();
    // A rise is stated, never celebrated: the direction chip pairs the
    // arrow glyph with the neutral direction word.
    expect(screen.getByText(/Increased/)).toBeInTheDocument();
    expect(screen.getByText(/↑/)).toBeInTheDocument();
    // The change date is always present (locale-formatted), with source.
    expect(screen.getByText(/2026/)).toBeInTheDocument();
    expect(screen.getByText(/Bank website/)).toBeInTheDocument();
  });

  it('marks unseen changes with the New chip', () => {
    renderCard(entry({ is_new: true }));
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders a missing side as Not published, never blank', () => {
    renderCard(entry({ old_value: null }));
    expect(screen.getByText('Not published')).toBeInTheDocument();
  });

  it('compares rate bands by their top end', () => {
    renderCard(
      entry({
        field_name: 'rate_band',
        old_value: { rate_min: '12.00', rate_max: '13.50' },
        new_value: { rate_min: '12.00', rate_max: '13.00' },
      })
    );
    expect(screen.getByText(/Decreased/)).toBeInTheDocument();
  });
});
