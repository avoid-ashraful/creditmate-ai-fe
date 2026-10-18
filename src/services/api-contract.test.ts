import snapshot from '../mocks/openapi.snapshot.json';

type HttpVerb = 'get' | 'post' | 'patch' | 'put' | 'delete';

interface OpenApiParameter {
  name: string;
  in: string;
}

interface OpenApiSchemaRef {
  $ref?: string;
}

interface OpenApiSchemaObject {
  properties?: Record<string, unknown>;
  items?: OpenApiSchemaRef;
}

interface OpenApiOperation {
  parameters?: OpenApiParameter[];
  requestBody?: { content?: Record<string, { schema?: OpenApiSchemaRef }> };
  responses?: Record<string, { content?: Record<string, { schema?: OpenApiSchemaRef }> }>;
}

const spec = snapshot as {
  paths: Record<string, Partial<Record<HttpVerb, OpenApiOperation>>>;
  components: { schemas: Record<string, OpenApiSchemaObject> };
};

const { paths } = spec;
const schemas = spec.components.schemas;

const schemaName = (ref?: string): string | undefined =>
  ref && ref.startsWith('#/components/schemas/')
    ? ref.slice('#/components/schemas/'.length)
    : undefined;

const operation = (path: string, method: HttpVerb): OpenApiOperation | undefined =>
  paths[path]?.[method];

const queryParamNames = (path: string, method: HttpVerb): string[] =>
  (operation(path, method)?.parameters ?? [])
    .filter(parameter => parameter.in === 'query')
    .map(parameter => parameter.name);

const requestSchemaName = (path: string, method: HttpVerb): string | undefined =>
  schemaName(operation(path, method)?.requestBody?.content?.['application/json']?.schema?.$ref);

const responseSchemaName = (path: string, method: HttpVerb): string | undefined =>
  schemaName(
    operation(path, method)?.responses?.['200']?.content?.['application/json']?.schema?.$ref
  );

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
  ['/api/v1/auth/me/', 'delete'],
  ['/api/v1/auth/me/export/', 'get'],
  ['/api/v1/auth/resend-verification/', 'post'],
  ['/api/v1/alerts/subscriptions/', 'get'],
  ['/api/v1/alerts/subscriptions/', 'post'],
  ['/api/v1/alerts/subscriptions/{id}/', 'delete'],
  ['/api/v1/alerts/preferences/', 'get'],
  ['/api/v1/alerts/preferences/', 'patch'],
  ['/api/v1/alerts/unsubscribe/{token}/', 'get'],
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
  ['/api/v1/credit-cards/{id}/report-issue/', 'post'],
  ['/api/v1/credit-cards/search-suggestions/', 'get'],
  ['/api/v1/credit-cards/typeahead/', 'get'],
  ['/api/v1/credit-cards/advanced-search/', 'get'],
  ['/api/v1/credit-cards/advanced-search/categories/', 'get'],
  ['/api/v1/credit-cards/advanced-search/sort-options/', 'get'],
  ['/api/v1/credit-cards/advanced-search/normalize/', 'get'],
  ['/api/v1/reviews/', 'get'],
  ['/api/v1/reviews/', 'post'],
  ['/api/v1/reviews/mine/{id}/', 'get'],
  ['/api/v1/reviews/mine/{id}/', 'patch'],
  ['/api/v1/reviews/mine/{id}/', 'delete'],
  ['/api/v1/reviews/{review_id}/helpful/', 'post'],
  ['/api/v1/reviews/cards/{card_id}/summary/', 'get'],
];

// Query parameters each service attaches in its request code. Sources:
// - src/services/api.ts (banks, credit cards, typeahead, advanced search)
// - src/services/reviews.ts (review list)
// - src/services/advancedSearch.ts (uiStateToParams -> paramsToSearchParams)
const listParams = [
  'ids',
  'bank_ids',
  'bank',
  'bank_name',
  'search',
  'annual_fee_range',
  'annual_fee_min',
  'annual_fee_max',
  'has_annual_fee',
  'no_annual_fee',
  'interest_rate_range',
  'interest_rate_min',
  'interest_rate_max',
  'has_lounge_access',
  'has_international_lounge',
  'has_domestic_lounge',
  'min_international_lounge',
  'min_domestic_lounge',
  'has_additional_features',
  'feature_search',
  'has_fee_waiver',
  'card_network',
  'is_islamic',
  'is_dual_currency',
  'max_min_monthly_income',
  'include_unknown_income',
  'is_active',
  'ordering',
  'page',
  'page_size',
];

const advancedSearchParams = [
  'search',
  'categories',
  'annual_fee_min',
  'annual_fee_max',
  'interest_rate_min',
  'interest_rate_max',
  'has_lounge_access',
  'has_international_lounge',
  'has_domestic_lounge',
  'has_annual_fee',
  'no_annual_fee',
  'has_fee_waiver',
  'card_network',
  'is_islamic',
  'is_dual_currency',
  'max_min_monthly_income',
  'include_unknown_income',
  'feature_search',
  'bank_ids',
  'ordering',
  'page',
  'page_size',
  'facets',
];

const queryParameters: Array<[string, HttpVerb, string[]]> = [
  ['/api/v1/banks/', 'get', ['search', 'ordering']],
  ['/api/v1/credit-cards/', 'get', listParams],
  ['/api/v1/credit-cards/advanced-search/', 'get', advancedSearchParams],
  // advancedSearchService.normalize forwards the same search params via paramsToSearchParams.
  ['/api/v1/credit-cards/advanced-search/normalize/', 'get', advancedSearchParams],
  ['/api/v1/credit-cards/typeahead/', 'get', ['q']],
  ['/api/v1/reviews/', 'get', ['card', 'page']],
];

// Request body fields the services send.
const requestBodyFields: Array<[string, HttpVerb, string[]]> = [
  [
    '/api/v1/auth/register/',
    'post',
    [
      'email',
      'password',
      'password_confirm',
      'first_name',
      'last_name',
      'email_opt_in',
      'accept_terms',
      'marketing_opt_in',
    ],
  ],
  ['/api/v1/auth/resend-verification/', 'post', ['email']],
  [
    '/api/v1/credit-cards/{id}/report-issue/',
    'post',
    ['field', 'message', 'suggested_value', 'contact_email'],
  ],
];

// Trust/filter fields the card list and detail consumers read from the payload.
const cardPresentationFields = [
  'source_url',
  'apply_url',
  'verification_status',
  'verified_at',
  'card_network',
  'is_islamic',
  'is_dual_currency',
  'min_monthly_income',
  'supplementary_card_fee',
  'foreign_transaction_fee',
];

describe('backend OpenAPI contract snapshot', () => {
  it.each(operations)('%s supports %s', (path, method) => {
    expect(paths[path]?.[method]).toBeDefined();
  });

  it.each(queryParameters)(
    '%s %s documents every query param the services send',
    (path, method, expected) => {
      const documented = new Set(queryParamNames(path, method));
      const missing = expected.filter(name => !documented.has(name));
      expect(missing).toEqual([]);
    }
  );

  it.each(requestBodyFields)(
    '%s %s documents every request body field the services send',
    (path, method, expected) => {
      const name = requestSchemaName(path, method);
      expect(name).toBeDefined();
      const properties = name ? schemas[name]?.properties ?? {} : {};
      const missing = expected.filter(field => !(field in properties));
      expect(missing).toEqual([]);
    }
  );

  it('serves the card list and detail with the CreditCard schemas', () => {
    expect(responseSchemaName('/api/v1/credit-cards/', 'get')).toBe('PaginatedCreditCardListList');
    expect(responseSchemaName('/api/v1/credit-cards/{id}/', 'get')).toBe('CreditCard');
    const listResults = schemas.PaginatedCreditCardListList?.properties?.results as
      | OpenApiSchemaObject
      | undefined;
    expect(schemaName(listResults?.items?.$ref)).toBe('CreditCardList');
  });

  it.each(cardPresentationFields)('CreditCard schema documents %s', field => {
    expect(schemas.CreditCard?.properties?.[field]).toBeDefined();
  });

  it.each(cardPresentationFields)('CreditCardList schema documents %s', field => {
    expect(schemas.CreditCardList?.properties?.[field]).toBeDefined();
  });
});
