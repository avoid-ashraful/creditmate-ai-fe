import { rest } from 'msw';

import { authUrl, sessionBody } from '../mocks/auth';
import { server } from '../mocks/jest.setup';

import { authClient } from './auth';
import { shortlistService, toShortlistItem } from './shortlist';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  authClient.clearLocalSession();
});
afterAll(() => server.close());

/**
 * Wire-contract tests: the backend's saved app speaks PLURAL verticals
 * (ShortlistItem.Vertical: 'cards' | 'deposits' | 'loans' | 'accounts').
 * A singular mapping here once silently broke every add/import — these
 * tests pin the exact payloads and row shapes from saved/serializers.py.
 */
describe('shortlistService wire contract', () => {
  beforeEach(() => {
    server.use(rest.post(authUrl('login/'), (_req, res, ctx) => res(ctx.json(sessionBody()))));
  });

  it('sends plural verticals on add, import and remove', async () => {
    const calls: string[] = [];
    server.use(
      rest.post('*/api/v1/saved/shortlist/', (req, res, ctx) => {
        calls.push(`POST ${JSON.stringify(req.body)}`);
        return res(
          ctx.json({
            id: 9,
            vertical: 'cards',
            key: '42',
            name: 'Example Card',
            bank_name: 'Example Bank',
            card_id: 42,
            slug: null,
            latest_change: null,
            created: '2026-11-05T00:00:00Z',
          })
        );
      }),
      rest.post('*/api/v1/saved/shortlist/import/', (req, res, ctx) => {
        calls.push(`IMPORT ${JSON.stringify(req.body)}`);
        return res(ctx.json({ imported: 1, skipped: 0, results: [] }));
      }),
      rest.delete('*/api/v1/saved/shortlist/:vertical/:key/', (req, res, ctx) => {
        calls.push(`DELETE ${req.params.vertical}/${req.params.key}`);
        return res(ctx.status(204));
      })
    );
    await authClient.login({ email: 'reader@example.com', password: 'pass' });

    await shortlistService.add('cards', '42');
    await shortlistService.importItems([
      { vertical: 'deposits', key: 'pubali-fdr' },
      { vertical: 'loans', key: 'agami-personal-loan' },
    ]);
    await shortlistService.remove('accounts', 'some-account');

    expect(calls).toEqual([
      'POST {"vertical":"cards","key":"42"}',
      'IMPORT {"items":[{"vertical":"deposits","key":"pubali-fdr"},{"vertical":"loans","key":"agami-personal-loan"}]}',
      'DELETE accounts/some-account',
    ]);
  });

  it('converts plural server rows into provider items with detail links', async () => {
    expect(
      toShortlistItem({
        id: 3,
        vertical: 'deposits',
        key: 'pubali-fdr',
        name: 'Pubali FDR',
        bank_name: 'Pubali Bank PLC',
        card_id: null,
        slug: 'pubali-fdr',
        latest_change: null,
        created: '2026-11-05T00:00:00Z',
      })
    ).toMatchObject({
      vertical: 'deposits',
      key: 'pubali-fdr',
      detailHref: '/deposits/pubali-fdr',
    });

    expect(
      toShortlistItem({
        id: 4,
        vertical: 'cards',
        key: '42',
        name: 'Example Card',
        bank_name: 'Example Bank',
        card_id: 42,
        slug: null,
        latest_change: null,
        created: '2026-11-05T00:00:00Z',
      })
    ).toMatchObject({ vertical: 'cards', key: '42', cardId: 42 });
  });
});
