import { rest } from 'msw';

import { authUrl, sessionBody } from '../mocks/auth';
import { server } from '../mocks/jest.setup';

import { authClient } from './auth';
import { savedService } from './saved';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  authClient.clearLocalSession();
});
afterAll(() => server.close());

describe('savedService', () => {
  beforeEach(() => {
    server.use(rest.post(authUrl('login/'), (_req, res, ctx) => res(ctx.json(sessionBody()))));
  });

  it('lists, creates, renames and deletes comparisons with authenticated requests', async () => {
    const calls: string[] = [];
    server.use(
      rest.get('*/api/v1/saved/comparisons/', (_req, res, ctx) =>
        res(ctx.json([{ id: 1, name: 'Initial', card_ids: [1, 2], is_public: false }]))
      ),
      rest.post('*/api/v1/saved/comparisons/', (req, res, ctx) => {
        calls.push(`POST ${JSON.stringify(req.body)}`);
        return res(ctx.json({ id: 1, name: 'Trip', card_ids: [1], is_public: false }));
      }),
      rest.patch('*/api/v1/saved/comparisons/1/', (req, res, ctx) => {
        calls.push(`PATCH ${JSON.stringify(req.body)}`);
        return res(ctx.json({ id: 1, name: 'New', card_ids: [1], is_public: false }));
      }),
      rest.delete('*/api/v1/saved/comparisons/1/', (_req, res, ctx) => {
        calls.push('DELETE');
        return res(ctx.status(204));
      })
    );
    await authClient.login({ email: 'reader@example.com', password: 'pass' });
    expect((await savedService.getComparisons())[0].name).toBe('Initial');
    await savedService.createComparison({ name: 'Trip', card_ids: [1], is_public: false });
    await savedService.updateComparison(1, { name: 'New' });
    await savedService.deleteComparison(1);
    expect(calls).toEqual([
      'POST {"name":"Trip","card_ids":[1],"is_public":false}',
      'PATCH {"name":"New"}',
      'DELETE',
    ]);
  });

  it('creates collections, adds and removes cards, and reads public shares without auth', async () => {
    const calls: string[] = [];
    server.use(
      rest.post('*/api/v1/saved/collections/', (req, res, ctx) => {
        calls.push(`create:${JSON.stringify(req.body)}`);
        return res(ctx.json({ id: 3, name: 'Travel', description: '', is_public: false }));
      }),
      rest.get('*/api/v1/saved/collections/', (_req, res, ctx) =>
        res(ctx.json([{ id: 3, name: 'Travel', description: '', is_public: false }]))
      ),
      rest.patch('*/api/v1/saved/collections/3/', (req, res, ctx) => {
        calls.push(`patch:${JSON.stringify(req.body)}`);
        return res(ctx.json({ id: 3, name: 'Trip', description: '', is_public: false }));
      }),
      rest.delete('*/api/v1/saved/collections/3/', (_req, res, ctx) => {
        calls.push('delete');
        return res(ctx.status(204));
      }),
      rest.get('*/api/v1/saved/collections/3/', (_req, res, ctx) =>
        res(ctx.json({ id: 3, name: 'Travel', cards: [{ card_id: 1 }] }))
      ),
      rest.post('*/api/v1/saved/collections/3/add_card/', (req, res, ctx) => {
        calls.push(`add:${JSON.stringify(req.body)}`);
        return res(ctx.json({ id: 3 }));
      }),
      rest.post('*/api/v1/saved/collections/3/remove_card/', (req, res, ctx) => {
        calls.push(`remove:${JSON.stringify(req.body)}`);
        return res(ctx.json({ id: 3 }));
      }),
      rest.get('*/api/v1/saved/shared/token-1/', (_req, res, ctx) =>
        res(ctx.json({ name: 'Public', card_ids: [1] }))
      )
    );
    await authClient.login({ email: 'reader@example.com', password: 'pass' });
    await savedService.createCollection({ name: 'Travel', description: '', is_public: false });
    expect((await savedService.getCollections())[0].name).toBe('Travel');
    await savedService.updateCollection(3, { name: 'Trip' });
    expect((await savedService.getCollection(3)).cards).toHaveLength(1);
    await savedService.addCard(3, 2, 'Backup');
    await savedService.removeCard(3, 2);
    await savedService.deleteCollection(3);
    authClient.clearLocalSession();
    expect((await savedService.shared('token-1')).name).toBe('Public');
    expect(calls).toEqual([
      'create:{"name":"Travel","description":"","is_public":false}',
      'patch:{"name":"Trip"}',
      'add:{"card_id":2,"notes":"Backup"}',
      'remove:{"card_id":2}',
      'delete',
    ]);
  });
});
