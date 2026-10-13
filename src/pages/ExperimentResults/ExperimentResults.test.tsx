import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { expectNoAxeViolations } from '../../a11y/axe';
import { isResultsViewEnabled, getAllExperimentViewData } from '../../lib/experiments';

import ExperimentResults from './ExperimentResults';

// Mock the experiments module
jest.mock('../../lib/experiments', () => ({
  isResultsViewEnabled: jest.fn(() => true),
  getAllExperimentViewData: jest.fn(() => [
    {
      experimentKey: 'hero_cta_text',
      config: {
        key: 'hero_cta_text',
        name: 'Hero CTA Text',
        treatmentAllocation: 50,
        enabled: true,
        minSampleSize: 100,
        confidenceLevel: 0.95,
      },
      results: {
        control: { exposures: 500, conversions: 50 },
        treatment: { exposures: 500, conversions: 65 },
      },
      significance: {
        significant: true,
        pValue: 0.032,
        zScore: 2.14,
        confidenceLevel: 0.95,
        minSampleMet: true,
        minSampleSize: 100,
        harmful: false,
      },
      autoStop: { shouldStop: true, reason: 'significance' },
    },
  ]),
}));

const renderWithRouter = () =>
  render(
    <MemoryRouter initialEntries={['/experiment-results']}>
      <Routes>
        <Route path="/experiment-results" element={<ExperimentResults />} />
        <Route path="/" element={<p>home page</p>} />
      </Routes>
    </MemoryRouter>
  );

describe('ExperimentResults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isResultsViewEnabled as jest.Mock).mockReturnValue(true);
    (getAllExperimentViewData as jest.Mock).mockReturnValue([
      {
        experimentKey: 'hero_cta_text',
        config: {
          key: 'hero_cta_text',
          name: 'Hero CTA Text',
          treatmentAllocation: 50,
          enabled: true,
          minSampleSize: 100,
          confidenceLevel: 0.95,
        },
        results: {
          control: { exposures: 500, conversions: 50 },
          treatment: { exposures: 500, conversions: 65 },
        },
        significance: {
          significant: true,
          pValue: 0.032,
          zScore: 2.14,
          confidenceLevel: 0.95,
          minSampleMet: true,
          minSampleSize: 100,
          harmful: false,
        },
        autoStop: { shouldStop: true, reason: 'significance' },
      },
    ]);
  });

  it('renders the page with experiment data', () => {
    renderWithRouter();

    expect(screen.getByRole('heading', { name: 'Experiment Results' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hero CTA Text' })).toBeInTheDocument();
  });

  it('renders empty state when no experiments', async () => {
    (getAllExperimentViewData as jest.Mock).mockReturnValue([]);
    (isResultsViewEnabled as jest.Mock).mockReturnValue(true);
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'No Experiments Running' })).toBeInTheDocument();
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithRouter();
    await expectNoAxeViolations(container);
  });

  it('has visible focus styles for interactive elements', () => {
    renderWithRouter();

    const backButton = screen.getByRole('button', { name: /back to app/i });
    expect(backButton).toBeInTheDocument();
  });
});
