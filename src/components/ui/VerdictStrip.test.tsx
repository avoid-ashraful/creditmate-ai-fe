import { render, screen } from '@testing-library/react';
import React from 'react';

import VerdictStrip from './VerdictStrip';

describe('VerdictStrip', () => {
  it('renders labelled items under a summary-verdict label', () => {
    render(
      <VerdictStrip
        items={[
          { label: 'Lowest cost', value: '৳3,450' },
          { label: 'Best value-back', value: '2.1%' },
        ]}
      />
    );
    const strip = screen.getByLabelText('Summary verdict');
    expect(strip).toHaveTextContent('Lowest cost: ৳3,450');
    expect(strip).toHaveTextContent('Best value-back: 2.1%');
    expect(screen.getByText('2.1%').tagName).toBe('STRONG');
  });
});
