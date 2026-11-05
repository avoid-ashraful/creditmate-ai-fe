import { render, screen } from '@testing-library/react';
import React from 'react';

import { LanguageProvider } from '../locales';

import FeeAnatomy from './FeeAnatomy';

const renderAnatomy = (props: Partial<React.ComponentProps<typeof FeeAnatomy>>) =>
  render(
    <LanguageProvider>
      <FeeAnatomy
        heading="How the net value is built"
        intro="Layer by layer."
        layers={[
          { label: 'Reward value', value: 6000, sign: 'add' },
          { label: 'Annual fee', value: 1500, sign: 'subtract' },
        ]}
        totalLabel="Net value"
        total={4500}
        noTotalNote="A net value can't be computed."
        {...props}
      />
    </LanguageProvider>
  );

describe('FeeAnatomy', () => {
  it('shows the layers and their sum as the total', () => {
    renderAnatomy({});
    expect(screen.getByText(/Reward value/)).toBeInTheDocument();
    expect(screen.getByText(/Annual fee/)).toBeInTheDocument();
    expect(screen.getByText('Net value')).toBeInTheDocument();
  });

  it('renders an unpublished layer as a Not published stratum, never dropped', () => {
    renderAnatomy({
      layers: [
        { label: 'Reward value', value: null, sign: 'add' },
        { label: 'Annual fee', value: 1500, sign: 'subtract' },
      ],
      total: null,
    });
    expect(screen.getByText('Not published')).toBeInTheDocument();
    expect(screen.getByText(/Reward value/)).toBeInTheDocument();
  });

  it('never shows a total when a layer is unknown — it says why instead', () => {
    renderAnatomy({ total: null });
    expect(screen.getByText("A net value can't be computed.")).toBeInTheDocument();
    expect(screen.queryByText('Net value')).not.toBeInTheDocument();
  });
});
