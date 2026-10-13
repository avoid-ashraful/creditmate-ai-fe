import snapshot from '../mocks/openapi.snapshot.json';

type HttpVerb = 'get' | 'post' | 'patch' | 'put' | 'delete';
const paths = (snapshot as { paths: Record<string, Partial<Record<HttpVerb, unknown>>> }).paths;

// Wire operations called by the frontend services. Keep this list in sync with
// service methods so backend route drift fails in Jest.
const operations: Array<[string, HttpVerb]> = [
  ['/api/v1/auth/register/', 'post'],
  ['/api/v1/auth/login/', 'post'],
  ['/api/v1/auth/logout/', 'post'],
  ['/api/v1/auth/token/refresh/', 'post'],
  ['/api/v1/auth/password-reset/', 'post'],
  ['/api/v1/auth/password-reset/confirm/', 'post'],
  ['/api/v1/auth/verify-email/', 'post'],
  ['/api/v1/auth/me/', 'get'],
  ['/api/v1/auth/me/', 'patch'],
  ['/api/v1/alerts/subscriptions/', 'get'],
  ['/api/v1/alerts/subscriptions/', 'post'],
  ['/api/v1/alerts/subscriptions/{id}/', 'delete'],
  ['/api/v1/alerts/preferences/', 'get'],
  ['/api/v1/alerts/preferences/', 'patch'],
  ['/api/v1/alerts/unsubscribe/{token}/', 'post'],
  ['/api/v1/saved/comparisons/', 'get'],
  ['/api/v1/saved/comparisons/', 'post'],
  ['/api/v1/saved/comparisons/{id}/', 'patch'],
  ['/api/v1/saved/comparisons/{id}/', 'delete'],
  ['/api/v1/saved/collections/', 'get'],
  ['/api/v1/saved/collections/', 'post'],
  ['/api/v1/saved/collections/{id}/', 'get'],
  ['/api/v1/saved/collections/{id}/', 'patch'],
  ['/api/v1/saved/collections/{id}/', 'delete'],
  ['/api/v1/saved/collections/{id}/cards/', 'post'],
  ['/api/v1/saved/collections/{id}/cards/{card_id}/', 'delete'],
  ['/api/v1/saved/shared/{token}/', 'get'],
  ['/api/v1/banks/', 'get'],
  ['/api/v1/banks/{id}/', 'get'],
  ['/api/v1/credit-cards/', 'get'],
  ['/api/v1/credit-cards/{id}/', 'get'],
  ['/api/v1/credit-cards/search-suggestions/', 'get'],
  ['/api/v1/credit-cards/typeahead/', 'get'],
  ['/api/v1/credit-cards/advanced-search/', 'get'],
  ['/api/v1/credit-cards/advanced-search/categories/', 'get'],
  ['/api/v1/credit-cards/advanced-search/sort-options/', 'get'],
  ['/api/v1/credit-cards/advanced-search/normalize/', 'get'],
];

describe('backend OpenAPI contract snapshot', () => {
  it.each(operations)('%s supports %s', (path, method) => {
    expect(paths[path]?.[method]).toBeDefined();
  });
});
