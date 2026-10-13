import fs from 'fs';
import path from 'path';

import { render, screen, waitFor } from '@testing-library/react';
import { motion } from 'framer-motion';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import CardList from '../components/CardList';
import ComparisonBar from '../components/ComparisonBar';
import { dummyCreditCards } from '../dummy-data/credit-cards';

import { MotionProvider, usePrefersReducedMotion } from './index';

/*
 * Global reduced-motion coverage. This file runs with the OS setting
 * `prefers-reduced-motion: reduce`. Framer Motion caches the preference on
 * first render per module instance, so the control case (no preference) lives
 * in motionPreference.test.tsx.
 */

const reduceQuery = (query: string) => ({
  matches: query.includes('prefers-reduced-motion'),
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(reduceQuery),
  });
});

const ReducedProbe: React.FC = () => {
  const reduced = usePrefersReducedMotion();
  return <p>{reduced ? 'reduced' : 'full motion'}</p>;
};

describe('global reduced-motion support', () => {
  it('hook reports that the user prefers reduced motion', () => {
    render(<ReducedProbe />);
    expect(screen.getByText('reduced')).toBeInTheDocument();
  });

  it('framer positional animations settle instantly under MotionProvider', async () => {
    render(
      <MotionProvider>
        <motion.div
          data-testid="moving"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
        />
      </MotionProvider>
    );
    // Framer's reduced mode skips the slide itself, so the 40px offset is
    // resolved on the next frame and never animated.
    await waitFor(() => expect(screen.getByTestId('moving').style.transform).not.toContain('40px'));
  });

  it('card entrances are visible rather than starting hidden', () => {
    render(
      <MotionProvider>
        <CardList cards={dummyCreditCards.slice(0, 3)} />
      </MotionProvider>
    );

    dummyCreditCards.slice(0, 3).forEach(card => {
      expect(screen.getByText(card.name)).toBeVisible();
    });
  });

  it('comparison bar chips are visible immediately', () => {
    render(
      <MemoryRouter>
        <MotionProvider>
          <ComparisonBar
            selectedCards={dummyCreditCards.slice(0, 2)}
            onRemoveCard={jest.fn()}
            maxSelections={4}
          />
        </MotionProvider>
      </MemoryRouter>
    );

    dummyCreditCards.slice(0, 2).forEach(card => {
      expect(screen.getByText(card.name)).toBeVisible();
    });
  });

  it('the global stylesheet disables CSS animations, transitions and looping', () => {
    const css = fs.readFileSync(path.join(__dirname, 'motion.css'), 'utf8');
    const block = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(block).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(block).toMatch(/animation-iteration-count:\s*1\s*!important/);
    expect(block).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
    expect(block).toMatch(/\.card-list-item:hover[\s\S]*transform:\s*none\s*!important/);
  });
});
