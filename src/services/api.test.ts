import { apiService, normalizeLoungeAccess, CreditCardApiResponse } from './api';

const baseListCard: CreditCardApiResponse = {
  id: 42,
  bank_name: 'Example Bank',
  name: 'Example Card',
  annual_fee: '2000.00',
  interest_rate_apr: '25.50',
  lounge_access_international: '5 visits',
  lounge_access_domestic: 'Unlimited',
  has_lounge_access: true,
  has_annual_fee: true,
  is_active: true,
};

describe('transformCreditCard list-contract adapter', () => {
  it('normalizes valid decimal strings to numbers', () => {
    const card = apiService.transformCreditCard(baseListCard);
    expect(card.annualFee).toBe(2000);
    expect(card.interestRateApr).toBe(25.5);
  });

  it('keeps a real zero annual fee as zero (not unknown)', () => {
    const card = apiService.transformCreditCard({ ...baseListCard, annual_fee: '0.00' });
    expect(card.annualFee).toBe(0);
    const numeric = apiService.transformCreditCard({ ...baseListCard, annual_fee: 0 });
    expect(numeric.annualFee).toBe(0);
  });

  it('keeps null or invalid fees unknown (null)', () => {
    expect(
      apiService.transformCreditCard({ ...baseListCard, annual_fee: null }).annualFee
    ).toBeNull();
    expect(
      apiService.transformCreditCard({ ...baseListCard, annual_fee: 'BDT 5000' }).annualFee
    ).toBeNull();
    expect(
      apiService.transformCreditCard({ ...baseListCard, annual_fee: '0x10' }).annualFee
    ).toBeNull();
    expect(
      apiService.transformCreditCard({ ...baseListCard, annual_fee: '1e3' }).annualFee
    ).toBeNull();
  });

  it('preserves free-text lounge values truthfully and suffixes plain digits', () => {
    const card = apiService.transformCreditCard(baseListCard);
    expect(card.loungeAccessInternational).toBe('5 visits');
    expect(card.loungeAccessDomestic).toBe('Unlimited');
    expect(normalizeLoungeAccess('10')).toBe('10 visits');
    expect(normalizeLoungeAccess('')).toBe('');
    expect(normalizeLoungeAccess('Not available')).toBe('Not available');
  });

  it('distinguishes missing lounge data (null) from explicit zero ("")', () => {
    const missing = apiService.transformCreditCard({
      ...baseListCard,
      lounge_access_international: undefined,
    });
    expect(missing.loungeAccessInternational).toBeNull();
    expect(normalizeLoungeAccess('0')).toBe('');
    expect(normalizeLoungeAccess(undefined)).toBeNull();
  });

  it('keeps missing or invalid modified dates unknown (null)', () => {
    expect(apiService.transformCreditCard(baseListCard).lastUpdated).toBeNull();
    const invalid = apiService.transformCreditCard({ ...baseListCard, modified: 'not-a-date' });
    expect(invalid.lastUpdated).toBeNull();
    const valid = apiService.transformCreditCard({
      ...baseListCard,
      modified: '2024-01-15T10:00:00Z',
    });
    expect(valid.lastUpdated).toBeInstanceOf(Date);
  });

  it('leaves bank identity absent instead of fabricating Bank ID 0', () => {
    const card = apiService.transformCreditCard(baseListCard);
    expect(card.bankId).toBeUndefined();
    expect(card.bankName).toBe('Example Bank');
    const withId = apiService.transformCreditCard({ ...baseListCard, bank_id: 7 });
    expect(withId.bankId).toBe(7);
  });

  it('does not invent a sourceUrl when absent', () => {
    expect(apiService.transformCreditCard(baseListCard).sourceUrl).toBe('');
  });
});

describe('getCreditCards request serialization', () => {
  const fetchSpy = jest.spyOn(global, 'fetch');

  beforeEach(() => {
    fetchSpy.mockReset();
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ count: 0, next: null, previous: null, results: [] }),
    } as Response);
  });

  afterAll(() => fetchSpy.mockRestore());

  it('serializes bankIds as comma-separated bank_ids and honors no_annual_fee', async () => {
    await apiService.getCreditCards({ bankIds: [1, 2, 3], hasAnnualFee: false, page_size: 100 });
    const url = (fetchSpy.mock.calls[0][0] as string) || '';
    expect(url).toContain('bank_ids=1%2C2%2C3');
    expect(url).toContain('no_annual_fee=true');
    expect(url).not.toContain('has_annual_fee=true');
    expect(url).toContain('page_size=100');
  });

  it('sends annual fee min-only ranges and search terms', async () => {
    await apiService.getCreditCards({ searchTerm: 'cashback', annualFeeRange: { min: 3000 } });
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('search=cashback');
    expect(url).toContain('annual_fee_min=3000');
    expect(url).not.toContain('annual_fee_range');
  });
});
