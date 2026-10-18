/* eslint-disable testing-library/no-node-access */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from '../hooks/AuthProvider';
import { LanguageProvider } from '../locales';
import { handlers, testCards } from '../mocks/handlers';

import CardDetailPage from './CardDetailPage';

const server = setupServer(...handlers);
const REPORT_URL = '*/api/v1/credit-cards/1/report-issue/';
const CARD_ROUTE = '/card/test-bank/test-credit-card';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const renderCard = (route = CARD_ROUTE, lang: 'en' | 'bn' = 'en') =>
  render(
    <LanguageProvider initialLang={lang}>
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="/card/:bankSlug/:cardSlug" element={<CardDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </LanguageProvider>
  );

const useCard = (overrides: Record<string, unknown>) =>
  server.use(
    rest.get('*/api/v1/credit-cards/', (_req, res, ctx) =>
      res(
        ctx.json({
          count: 1,
          next: null,
          previous: null,
          results: [{ ...testCards[0], ...overrides }],
        })
      )
    )
  );

const specValue = (label: string) =>
  within(screen.getByRole('row', { name: name => name.startsWith(label) })).getByRole('cell');

describe('CardDetailPage trust fields', () => {
  test('prefers applyUrl, shows source, verified date, disclaimer and spec rows', async () => {
    renderCard();

    const apply = await screen.findByRole('link', { name: 'Apply on bank website' });
    expect(apply).toHaveAttribute('href', 'https://test.com/apply');
    expect(apply).toHaveAttribute('rel', 'noopener noreferrer nofollow');
    expect(apply).toHaveAttribute('target', '_blank');

    expect(screen.getByRole('link', { name: 'Bank schedule of charges' })).toHaveAttribute(
      'href',
      'https://test.com/schedule-of-charges'
    );
    expect(screen.getByText(/Verified on/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Read our disclaimer' })).toHaveAttribute(
      'href',
      '/disclaimer'
    );
    expect(specValue('Card Network')).toHaveTextContent('Visa');
    expect(specValue('Islamic (Shariah-compliant)')).toHaveTextContent('No, conventional');
    expect(specValue('Dual Currency')).toHaveTextContent('Yes');
    expect(specValue('Minimum Monthly Income')).toHaveTextContent('BDT 50,000 per month');
    expect(specValue('Supplementary Card Fee')).toHaveTextContent('BDT 500');
    expect(specValue('Foreign Transaction Fee')).toHaveTextContent('3%');
  });

  test('shows the fee-schedule link, never an apply CTA, when only sourceUrl exists', async () => {
    useCard({ apply_url: '' });
    const { unmount } = renderCard();
    await screen.findByRole('heading', { level: 1, name: 'Test Credit Card' });
    expect(screen.queryByRole('link', { name: 'Apply on bank website' })).not.toBeInTheDocument();
    const feeSchedule = screen.getByRole('link', { name: 'View fee schedule' });
    expect(feeSchedule).toHaveAttribute('href', 'https://test.com/schedule-of-charges');
    expect(feeSchedule).toHaveAttribute('rel', 'noopener noreferrer nofollow');
    expect(feeSchedule).toHaveAttribute('class', expect.stringContaining('btn-secondary'));
    unmount();

    const { unmount: unmountBengali } = renderCard(CARD_ROUTE, 'bn');
    await screen.findByRole('heading', { level: 1, name: 'Test Credit Card' });
    expect(
      screen.queryByRole('link', { name: 'ব্যাংকের ওয়েবসাইটে আবেদন করুন' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ফি তালিকা দেখুন' })).toBeInTheDocument();
    unmountBengali();

    useCard({ apply_url: '', source_url: '', verified_at: null });
    renderCard();
    await screen.findByRole('heading', { level: 1, name: 'Test Credit Card' });
    expect(screen.queryByRole('link', { name: 'Apply on bank website' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'View fee schedule' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Verified on/)).not.toBeInTheDocument();
  });

  test('unknown trust fields render Unknown, never 0 or No; Islamic null APR is relabelled', async () => {
    useCard({
      card_network: '',
      is_islamic: true,
      is_dual_currency: null,
      min_monthly_income: null,
      supplementary_card_fee: '',
      foreign_transaction_fee: '',
      interest_rate_apr: null,
    });
    renderCard();

    await screen.findByRole('heading', { level: 1, name: 'Test Credit Card' });
    expect(specValue('Card Network')).toHaveTextContent('Unknown');
    expect(specValue('Dual Currency')).toHaveTextContent('Unknown');
    expect(specValue('Minimum Monthly Income')).toHaveTextContent('Unknown');
    expect(specValue('Supplementary Card Fee')).toHaveTextContent('Unknown');
    expect(specValue('Foreign Transaction Fee')).toHaveTextContent('Unknown');
    expect(specValue('Islamic (Shariah-compliant)')).toHaveTextContent('Yes, Shariah-compliant');
    expect(specValue('Profit/fee (Shariah)')).toHaveTextContent('Data not available');
  });

  test('shows the profit/fee wording from additional features on Islamic cards without an APR', async () => {
    useCard({
      is_islamic: true,
      interest_rate_apr: null,
      additional_features: [
        'Interest/charges details: 20% (flat profit rate on the financed amount)',
        'Free supplementary card',
      ],
    });
    renderCard();
    await screen.findByRole('heading', { level: 1, name: 'Test Credit Card' });

    // The Shariah profit/fee row prints the detail without the field prefix,
    // both in the specs table and in the key metrics.
    expect(specValue('Profit/fee (Shariah)')).toHaveTextContent(
      '20% (flat profit rate on the financed amount)'
    );
    expect(specValue('Profit/fee (Shariah)')).not.toHaveTextContent('Interest/charges details');
  });

  test('keeps "Data not available" for Islamic cards whose features carry no profit/fee text', async () => {
    useCard({ is_islamic: true, interest_rate_apr: null });
    renderCard();
    await screen.findByRole('heading', { level: 1, name: 'Test Credit Card' });
    expect(specValue('Profit/fee (Shariah)')).toHaveTextContent('Data not available');
  });
});

describe('Report incorrect data dialog', () => {
  const openDialog = async () => {
    renderCard();
    const trigger = await screen.findByRole('button', { name: 'Report incorrect data' });
    await userEvent.click(trigger);
    return {
      trigger,
      dialog: await screen.findByRole('dialog', { name: 'Report incorrect data' }),
    };
  };

  test('requires a message, submits to the endpoint and shows success', async () => {
    let body: unknown = null;
    server.use(
      rest.post(REPORT_URL, async (req, res, ctx) => {
        body = await req.json();
        return res(ctx.status(201), ctx.json({ id: 9, status: 'pending' }));
      })
    );
    const { dialog } = await openDialog();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Send report' }));
    expect(await within(dialog).findByText('Please describe what is incorrect.')).toBeVisible();
    expect(body).toBeNull();

    await userEvent.selectOptions(
      within(dialog).getByLabelText(/Which detail is wrong/),
      'annual_fee'
    );
    await userEvent.type(within(dialog).getByLabelText('What is incorrect?'), 'Fee is 2000');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send report' }));

    expect(await screen.findByText(/Your report was received/)).toBeInTheDocument();
    expect(body).toEqual({ field: 'annual_fee', message: 'Fee is 2000' });
  });

  test('shows a throttle message on 429 and a generic error on failure', async () => {
    server.use(rest.post(REPORT_URL, (_req, res, ctx) => res(ctx.status(429))));
    const { dialog } = await openDialog();
    await userEvent.type(within(dialog).getByLabelText('What is incorrect?'), 'Wrong');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send report' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/Too many reports/);

    server.use(rest.post(REPORT_URL, (_req, res, ctx) => res(ctx.status(400), ctx.json({}))));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send report' }));
    await waitFor(() =>
      expect(within(dialog).getByRole('alert')).toHaveTextContent(/Could not send your report/)
    );
  });

  test('traps focus, closes on Escape and returns focus to the trigger', async () => {
    const { trigger, dialog } = await openDialog();
    expect(within(dialog).getByLabelText(/Which detail is wrong/)).toHaveFocus();

    await userEvent.tab({ shift: true });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  test('renders Bengali copy', async () => {
    renderCard(CARD_ROUTE, 'bn');
    await userEvent.click(await screen.findByRole('button', { name: 'ভুল তথ্য জানান' }));
    expect(await screen.findByRole('dialog', { name: 'ভুল তথ্য জানান' })).toBeInTheDocument();
  });
});
