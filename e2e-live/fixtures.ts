import { expect, test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const log = (kind: string, message: string) => {
      console.info(`[browser:${testInfo.title}] ${kind}: ${message}`);
    };

    page.on('console', message => {
      if (message.type() === 'error') log('console', message.text());
    });
    page.on('pageerror', error => log('pageerror', error.message));
    page.on('requestfailed', request =>
      log(
        'request-failed',
        `${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`
      )
    );
    page.on('response', response => {
      if (
        response.status() === 200 &&
        response.url().includes('/api/v1/credit-cards/') &&
        response.url().includes('page_size=100')
      ) {
        void response.json().then(body => {
          const rows = Array.isArray(body) ? body : body.results;
          log(
            'api-data',
            `${response.url()} count=${body.count ?? rows?.length} rows=${rows?.length}`
          );
        });
      }
      if (response.status() >= 400) {
        log('http-error', `${response.status()} ${response.request().method()} ${response.url()}`);
      }
    });

    await use(page);
  },
});

export { expect };
