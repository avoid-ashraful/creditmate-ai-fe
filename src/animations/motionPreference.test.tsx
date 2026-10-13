import { render, screen } from '@testing-library/react';
import { motion } from 'framer-motion';
import React from 'react';

import { MotionProvider } from './index';

/*
 * Control for reducedMotion.test.tsx: with no reduced-motion preference the
 * same markup must animate, otherwise the reduced-motion assertions would pass
 * vacuously.
 */

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

describe('motion without a reduced-motion preference', () => {
  it('applies transform animations', () => {
    render(
      <MotionProvider>
        <motion.div
          data-testid="moving"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
        />
      </MotionProvider>
    );
    expect(screen.getByTestId('moving').style.transform).toContain('translateX(40px)');
  });
});
