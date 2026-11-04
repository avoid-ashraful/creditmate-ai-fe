import { render, screen } from '@testing-library/react';
import React from 'react';

import DetailSummary from './DetailSummary';
import Money from './Money';

describe('DetailSummary', () => {
  it('renders identity, hero, facts, trust chip and actions', () => {
    render(
      <DetailSummary
        identity={{ bankName: 'BRAC Bank', productName: '1-year Fixed Deposit' }}
        heroValue={<Money value={112500} />}
        heroLabel="Maturity value after tax"
        facts={[{ label: 'Rate', value: '12.50%' }]}
        trustChip={<span>BB chart · Oct 2026 edition</span>}
        actions={<button type="button">Add to shortlist</button>}
      />
    );
    expect(screen.getByRole('heading', { name: '1-year Fixed Deposit' })).toBeInTheDocument();
    expect(screen.getByText('BRAC Bank')).toBeInTheDocument();
    expect(screen.getByText('৳1,12,500')).toBeInTheDocument();
    expect(screen.getByText('Maturity value after tax')).toBeInTheDocument();
    expect(screen.getByText('12.50%')).toBeInTheDocument();
    expect(screen.getByText('BB chart · Oct 2026 edition')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to shortlist' })).toBeInTheDocument();
  });
});
