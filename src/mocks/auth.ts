/** Shared MSW fixtures for the /api/v1/auth/ endpoints. */

export const AUTH_USER = { id: 7, email: 'reader@example.com' };

/** Matches any origin and prefix, so the test base URL can change without edits here. */
export const authUrl = (path: string): string => `*/api/v1/auth/${path}`;

export const sessionBody = (access = 'access-1', refresh = 'refresh-1') => ({
  user: AUTH_USER,
  access,
  refresh,
});
