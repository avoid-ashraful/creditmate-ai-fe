/**
 * Tests for CardHistoryClient (credit-card field-history endpoint).
 */

import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { authClient } from './auth';
import { ApiError, cardHistoryClient, transformFieldHistoryEntry } from './cardHistory';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  window.sessionStorage.clear();
});
afterAll(() => server.close());

jest.mock('./auth', () => ({
  ...jest.requireActual('./auth'),
  authClient: {
    hasSession: jest.fn(() => true),
    getAccessToken: jest.fn().mockResolvedValue('access-token'),
    refreshAccessToken: jest.fn().mockResolvedValue('access-token'),
  },
}));

const mockAuthClient = jest.mocked(authClient);

const historyPage = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: 2,
      card_id: 1,
      field_name: 'interest_rate_apr',
      old_value: '25.00',
      new_value: '24.00',
      created: '2026-11-03T20:35:14Z',
    },
    {
      id: 1,
      card_id: 1,
      field_name: 'annual_fee',
      old_value: '3000.00',
      new_value: '3500.00',
      created: '2026-11-03T20:34:10Z',
    },
  ],
};

describe('CardHistoryClient.getFieldHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthClient.hasSession.mockReturnValue(true);
    mockAuthClient.getAccessToken.mockResolvedValue('access-token');
  });

  it('fetches the field-history page with the bearer token', async () => {
    let authHeader: string | null = null;
    let requestedUrl = '';
    server.use(
      rest.get('*/api/v1/credit-cards/1/field-history/', (req, res, ctx) => {
        authHeader = req.headers.get('Authorization');
        requestedUrl = req.url.toString();
        return res(ctx.json(historyPage));
      })
    );

    const response = await cardHistoryClient.getFieldHistory(1);

    expect(authHeader).toBe('Bearer access-token');
    expect(requestedUrl).toContain('page=1');
    expect(response.count).toBe(2);
    expect(response.results[0].field_name).toBe('interest_rate_apr');
  });

  it('throws a 401 ApiError without a session and never calls the API', async () => {
    mockAuthClient.hasSession.mockReturnValue(false);
    await expect(cardHistoryClient.getFieldHistory(1)).rejects.toMatchObject({ status: 401 });
    await expect(cardHistoryClient.getFieldHistory(1)).rejects.toBeInstanceOf(ApiError);
  });

  it('propagates a backend 403 as an ApiError', async () => {
    server.use(
      rest.get('*/api/v1/credit-cards/9/field-history/', (_req, res, ctx) =>
        res(ctx.status(403), ctx.json({ detail: 'Authentication required to view field history.' }))
      )
    );
    await expect(cardHistoryClient.getFieldHistory(9)).rejects.toMatchObject({ status: 403 });
  });
});

describe('transformFieldHistoryEntry', () => {
  it('normalizes snake_case fields and parses the change date', () => {
    const entry = transformFieldHistoryEntry(historyPage.results[0]);
    expect(entry).toEqual({
      id: 2,
      cardId: 1,
      fieldName: 'interest_rate_apr',
      oldValue: '25.00',
      newValue: '24.00',
      changedAt: new Date('2026-11-03T20:35:14Z'),
    });
  });

  it('keeps missing values null instead of inventing them', () => {
    const entry = transformFieldHistoryEntry({
      id: 3,
      card_id: 1,
      field_name: 'annual_fee',
      old_value: undefined as unknown as null,
      new_value: '1000.00',
      created: '2026-11-03T20:35:14Z',
    });
    expect(entry.oldValue).toBeNull();
  });
});
