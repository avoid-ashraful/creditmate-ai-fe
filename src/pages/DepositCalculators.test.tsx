import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { apiService } from '../services/api';
import { getDepositProducts } from '../services/deposits';

import CalculatorsPage from './CalculatorsPage';

jest.mock('../services/deposits', () => {
  const actual = jest.requireActual('../services/deposits');
  return { ...actual, getDepositProducts: jest.fn(), getDepositProduct: jest.fn() };
});

const mockDepositList = getDepositProducts as jest.Mock;

const renderPage = () =>
  render(
    <BrowserRouter>
      <CalculatorsPage />
    </BrowserRouter>
  );

beforeEach(() => {
  jest.spyOn(apiService, 'getCreditCards').mockResolvedValue({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  jest.spyOn(apiService, 'transformCreditCard').mockImplementation(card => card as never);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  mockDepositList.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('CalculatorsPage — FD tool', () => {
  it('matches the backend hand-computed example (500k at 8.25%, 12 months)', async () => {
    renderPage();
    await screen.findByLabelText(/Card \(uses its published APR\)/);
    await userEvent.click(screen.getByRole('tab', { name: 'FD calculator' }));

    await userEvent.type(screen.getByLabelText('Rate (% per year)'), '8.25');
    // Amount defaults to 500,000 and tenure to 12 in the tool.
    await userEvent.click(screen.getByRole('button', { name: 'Calculate maturity' }));

    // Same figures as the backend maturity tests: gross 541,250,
    // interest 41,250, source tax at 10% (TIN) 4,125, net 537,125.
    expect(await screen.findByText('BDT 541,250.00')).toBeInTheDocument();
    expect(screen.getByText('BDT 41,250.00')).toBeInTheDocument();
    expect(screen.getByText('BDT 4,125.00')).toBeInTheDocument();
    expect(screen.getByText('BDT 537,125.00')).toBeInTheDocument();
  });
});

describe('CalculatorsPage — DPS tool', () => {
  it('reproduces the DBBL published maturity for 500/month at 9.50%', async () => {
    renderPage();
    await screen.findByLabelText(/Card \(uses its published APR\)/);
    await userEvent.click(screen.getByRole('tab', { name: 'DPS calculator' }));

    await userEvent.type(screen.getByLabelText('Rate (% per year)'), '9.5');
    const instalment = screen.getByLabelText('Monthly instalment (BDT)');
    await userEvent.clear(instalment);
    await userEvent.type(instalment, '500');
    const months = screen.getByLabelText('Tenure (months)');
    await userEvent.clear(months);
    await userEvent.type(months, '36');
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    // DBBL Deposit Plus publishes BDT 20,897 for this exact scenario.
    expect(await screen.findByText(/BDT 20,89[67]\./)).toBeInTheDocument();
    expect(screen.getByText('BDT 18,000.00')).toBeInTheDocument();
  });

  it('goal-seek finds the instalment for a 10-year target', async () => {
    renderPage();
    await screen.findByLabelText(/Card \(uses its published APR\)/);
    await userEvent.click(screen.getByRole('tab', { name: 'DPS calculator' }));
    await userEvent.click(screen.getByRole('tab', { name: 'Goal → instalment' }));

    await userEvent.type(screen.getByLabelText('Rate (% per year)'), '9.5');
    const target = screen.getByLabelText('Target amount at maturity (BDT)');
    await userEvent.clear(target);
    await userEvent.type(target, '100328');
    const months = screen.getByLabelText('Tenure (months)');
    await userEvent.clear(months);
    await userEvent.type(months, '120');
    await userEvent.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(await screen.findByText('BDT 500.00')).toBeInTheDocument();
  });
});
