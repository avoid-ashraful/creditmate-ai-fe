import { readFileSync } from 'fs';

import { expect, test as base } from '@playwright/test';

/**
 * Verification link the console email backend printed for `email`.
 * Needs E2E_BACKEND_LOG (run.sh sets it) pointing at the backend's log.
 */
export function verificationLink(email: string): string {
  const log = readFileSync(process.env.E2E_BACKEND_LOG || '', 'utf8');
  const match = log.match(new RegExp(`https?://\\S+/verify-email\\?token=${email}:\\S+`));
  if (!match) throw new Error(`no verification email for ${email} in E2E_BACKEND_LOG`);
  return match[0];
}

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
