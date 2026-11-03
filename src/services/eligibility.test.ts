import { CreditCard } from '../types';

import { resilientFetch } from './apiError';
import { checkEligibility, groupResultsByVerdict } from './eligibility';

jest.mock('./apiError', () => {
  const actual = jest.requireActual('./apiError');
  return { ...actual, resilientFetch: jest.fn() };
});

const mockFetch = resilientFetch as jest.Mock;

const apiCard = {
  id: 7,
  bank: { id: 3, name: 'Test Bank', logo: '', credit_card_count: 1, is_active: true },
  bank_id: 3,
  bank_name: 'Test Bank',
  name: 'Everyday Card',
  annual_fee: '1500.00',
  interest_rate_apr: '25.00',
  min_monthly_income: '30000.00',
  is_islamic: false,
};

const okResponse = (body: unknown) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  } as Response);

describe('checkEligibility', () => {
  beforeEach(() => jest.clearAllMocks());

  it('posts the profile in snake_case and maps the response', async () => {
    mockFetch.mockReturnValue(
      okResponse({
        counts: { eligible: 1, likely: 0, unknown: 0, not_yet: 0 },
        total_cards: 1,
        results: [
          {
            card: apiCard,
            verdict: 'eligible',
            reasons: ['Your income of BDT 30,000 meets the published minimum of BDT 30,000.'],
          },
        ],
        notes: [],
        method: 'Verdicts use only published minimums.',
        disclaimer: 'Estimate only.',
      })
    );

    const result = await checkEligibility({
      monthlyIncome: 30000,
      employmentType: 'salaried',
      hasTin: true,
      cibStatus: 'clean',
    });

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/credit-cards/eligibility/');
    const sent = JSON.parse(init.body as string);
    expect(sent).toEqual({
      monthly_income: 30000,
      employment_type: 'salaried',
      islamic_only: false,
      has_tin: true,
      cib_status: 'clean',
    });
    expect(result.totalCards).toBe(1);
    expect(result.counts.eligible).toBe(1);
    expect(result.results[0].verdict).toBe('eligible');
    expect(result.results[0].card.name).toBe('Everyday Card');
    expect(result.results[0].card.minMonthlyIncome).toBe(30000);
  });

  it('omits optional fields that were not answered', async () => {
    mockFetch.mockReturnValue(
      okResponse({
        counts: { eligible: 0, likely: 0, unknown: 0, not_yet: 0 },
        total_cards: 0,
        results: [],
        notes: [],
        method: '',
        disclaimer: '',
      })
    );

    await checkEligibility({ monthlyIncome: 10000, employmentType: 'other' });
    const sent = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(sent).not.toHaveProperty('age');
    expect(sent).not.toHaveProperty('has_tin');
    expect(sent).not.toHaveProperty('cib_status');
  });

  it('throws when the API rejects the profile', async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({ monthly_income: ['Ensure this value is greater than or equal to 0.'] }),
        text: () => Promise.resolve('bad request'),
        headers: new Headers(),
      } as unknown as Response)
    );
    await expect(
      checkEligibility({ monthlyIncome: -1, employmentType: 'salaried' })
    ).rejects.toBeTruthy();
  });
});

describe('groupResultsByVerdict', () => {
  const item = (verdict: 'eligible' | 'likely' | 'unknown' | 'not_yet', id: number) => ({
    card: { id, name: `Card ${id}` } as CreditCard,
    verdict,
    reasons: [],
  });

  it('orders groups eligible, likely, unknown, not_yet and skips empties', () => {
    const groups = groupResultsByVerdict([
      item('not_yet', 1),
      item('eligible', 2),
      item('unknown', 3),
      item('eligible', 4),
    ]);
    expect(groups.map(group => group.verdict)).toEqual(['eligible', 'unknown', 'not_yet']);
    expect(groups[0].items.map(entry => entry.card.id)).toEqual([2, 4]);
  });
});
