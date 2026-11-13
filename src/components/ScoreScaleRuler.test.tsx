import { render, screen } from '@testing-library/react';
import React from 'react';

import { LanguageProvider } from '../locales';

import ScoreScaleRuler from './ScoreScaleRuler';

const renderRuler = () =>
  render(
    <LanguageProvider>
      <ScoreScaleRuler />
    </LanguageProvider>
  );

describe('ScoreScaleRuler', () => {
  it('exposes the full band scale as one labelled image', () => {
    renderRuler();
    expect(
      screen.getByRole('img', {
        name: 'CreditMate Score 0–10: Basic 0–5, Fair 5–6, Good 6–7, Excellent 7–10',
      })
    ).toBeInTheDocument();
  });

  it('renders the four band labels with their ranges', () => {
    renderRuler();
    for (const band of ['Basic', 'Fair', 'Good', 'Excellent']) {
      expect(screen.getByText(band, { selector: '.score-ruler-band-name' })).toBeInTheDocument();
    }
    for (const range of ['0–5', '5–6', '6–7', '7–10']) {
      expect(screen.getByText(range, { selector: '.score-ruler-band-range' })).toBeInTheDocument();
    }
  });

  it('places the gold marker at the Excellent threshold (7 of 10)', () => {
    renderRuler();
    expect(screen.getByTestId('score-ruler-marker')).toHaveStyle({ left: '70%' });
  });
});
