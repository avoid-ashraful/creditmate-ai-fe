/**
 * Tests for AlertsClient.
 */

import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { alertsClient, AlertsApiError } from './alerts';
import { authClient } from './auth';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  window.sessionStorage.clear();
});
afterAll(() => server.close());

// Mock authenticated auth client
jest.mock('./auth', () => ({
  ...jest.requireActual('./auth'),
  authClient: {
    hasSession: jest.fn(() => true),
    getAccessToken: jest.fn().mockResolvedValue('access-token'),
    refreshAccessToken: jest.fn().mockResolvedValue('access-token'),
  },
}));

const mockAuthClient = jest.mocked(authClient);

describe('AlertsClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthClient.hasSession.mockReturnValue(true);
    mockAuthClient.getAccessToken.mockResolvedValue('access-token');
  });

  describe('listSubscriptions', () => {
    it('fetches subscriptions with authentication', async () => {
      const mockSubscriptions = {
        count: 2,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            card: 5,
            card_name: 'Card A',
            bank_name: 'Bank X',
            kind: 'any_change',
            created: '2024-01-15T10:00:00Z',
          },
          { id: 2, card: undefined, kind: 'new_card', created: '2024-01-10T10:00:00Z' },
        ],
      };

      server.use(
        rest.get('*/api/v1/alerts/subscriptions/', (_req, res, ctx) =>
          res(ctx.status(200), ctx.json(mockSubscriptions))
        )
      );

      const result = await alertsClient.listSubscriptions();

      expect(result).toEqual(mockSubscriptions);
      expect(mockAuthClient.getAccessToken).toHaveBeenCalled();
    });

    it('throws AlertsApiError on 401', async () => {
      server.use(
        rest.get('*/api/v1/alerts/subscriptions/', (_req, res, ctx) =>
          res(ctx.status(401), ctx.json({ detail: 'Unauthorized' }))
        )
      );

      await expect(alertsClient.listSubscriptions()).rejects.toThrow(AlertsApiError);
    });

    it('throws on network error', async () => {
      server.use(
        rest.get('*/api/v1/alerts/subscriptions/', (_req, res) => res.networkError('offline'))
      );

      await expect(alertsClient.listSubscriptions()).rejects.toThrow(TypeError);
    });
  });

  describe('createSubscription', () => {
    it('creates a subscription with card and kind', async () => {
      const newSubscription = {
        id: 3,
        card: 5,
        card_name: 'Card A',
        bank_name: 'Bank X',
        kind: 'fee_change',
        created: '2024-01-20T10:00:00Z',
      };

      server.use(
        rest.post('*/api/v1/alerts/subscriptions/', (req, res, ctx) => {
          expect(req.body).toEqual({ card: 5, kind: 'fee_change' });
          return res(ctx.status(201), ctx.json(newSubscription));
        })
      );

      const result = await alertsClient.createSubscription({ card: 5, kind: 'fee_change' });

      expect(result).toEqual(newSubscription);
    });

    it('creates a subscription without card (global)', async () => {
      const newSubscription = {
        id: 4,
        card: undefined,
        kind: 'new_card',
        created: '2024-01-20T10:00:00Z',
      };

      server.use(
        rest.post('*/api/v1/alerts/subscriptions/', (req, res, ctx) => {
          expect(req.body).toEqual({ kind: 'new_card' });
          return res(ctx.status(201), ctx.json(newSubscription));
        })
      );

      const result = await alertsClient.createSubscription({ kind: 'new_card' });

      expect(result).toEqual(newSubscription);
    });
  });

  describe('deleteSubscription', () => {
    it('deletes a subscription by ID', async () => {
      server.use(
        rest.delete('*/api/v1/alerts/subscriptions/1/', (_req, res, ctx) => res(ctx.status(204)))
      );

      await expect(alertsClient.deleteSubscription(1)).resolves.toBeUndefined();
    });

    it('throws on 404', async () => {
      server.use(
        rest.delete('*/api/v1/alerts/subscriptions/999/', (_req, res, ctx) =>
          res(ctx.status(404), ctx.json({ detail: 'Not found' }))
        )
      );

      await expect(alertsClient.deleteSubscription(999)).rejects.toThrow(AlertsApiError);
    });
  });

  describe('getPreferences', () => {
    it('fetches user preferences', async () => {
      const prefs = { frequency: 'daily', email_enabled: true };

      server.use(
        rest.get('*/api/v1/alerts/preferences/', (_req, res, ctx) =>
          res(ctx.status(200), ctx.json(prefs))
        )
      );

      const result = await alertsClient.getPreferences();

      expect(result).toEqual(prefs);
    });
  });

  describe('updatePreferences', () => {
    it('updates preferences with PATCH', async () => {
      const updatedPrefs = { frequency: 'weekly', email_enabled: false };

      server.use(
        rest.patch('*/api/v1/alerts/preferences/', (req, res, ctx) => {
          expect(req.body).toEqual({ frequency: 'weekly', email_enabled: false });
          return res(ctx.status(200), ctx.json(updatedPrefs));
        })
      );

      const result = await alertsClient.updatePreferences({
        frequency: 'weekly',
        email_enabled: false,
      });

      expect(result).toEqual(updatedPrefs);
    });

    it('updates only frequency', async () => {
      const updatedPrefs = { frequency: 'immediate', email_enabled: true };

      server.use(
        rest.patch('*/api/v1/alerts/preferences/', (req, res, ctx) => {
          expect(req.body).toEqual({ frequency: 'immediate' });
          return res(ctx.status(200), ctx.json(updatedPrefs));
        })
      );

      const result = await alertsClient.updatePreferences({ frequency: 'immediate' });

      expect(result).toEqual(updatedPrefs);
    });
  });

  describe('unsubscribe (public)', () => {
    it('unsubscribes with token (no auth)', async () => {
      const response = { detail: 'Unsubscribed successfully' };

      server.use(
        rest.post('*/api/v1/alerts/unsubscribe/abc123/', (_req, res, ctx) => {
          return res(ctx.status(200), ctx.json(response));
        })
      );

      const result = await alertsClient.unsubscribe('abc123');

      expect(result).toEqual(response);
    });

    it('throws on invalid token', async () => {
      server.use(
        rest.post('*/api/v1/alerts/unsubscribe/bad-token/', (_req, res, ctx) =>
          res(ctx.status(400), ctx.json({ detail: 'Invalid token' }))
        )
      );

      await expect(alertsClient.unsubscribe('bad-token')).rejects.toThrow(AlertsApiError);
    });
  });
});
