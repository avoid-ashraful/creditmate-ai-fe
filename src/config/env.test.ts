// Module marker: the file only uses require() so isolatedModules needs an export.
// eslint-disable-next-line jest/no-export
export {};

const loadEnv = (nodeEnv: string, logging: string) => {
  const env = process.env as Record<string, string | undefined>;
  const previous = { NODE_ENV: env.NODE_ENV, log: env.REACT_APP_ENABLE_API_LOGGING };
  env.NODE_ENV = nodeEnv;
  env.REACT_APP_ENABLE_API_LOGGING = logging;
  try {
    let loaded = {} as typeof import('./env');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      loaded = require('./env');
    });
    return loaded.ENV;
  } finally {
    env.NODE_ENV = previous.NODE_ENV;
    env.REACT_APP_ENABLE_API_LOGGING = previous.log;
  }
};

describe('ENV.ENABLE_API_LOGGING', () => {
  it('is only possible in development builds', () => {
    expect(loadEnv('development', 'true').ENABLE_API_LOGGING).toBe(true);
    expect(loadEnv('production', 'true').ENABLE_API_LOGGING).toBe(false);
    expect(loadEnv('test', 'true').ENABLE_API_LOGGING).toBe(false);
  });

  it('stays off in development unless explicitly enabled', () => {
    expect(loadEnv('development', 'false').ENABLE_API_LOGGING).toBe(false);
  });
});

describe('production API configuration validation', () => {
  it.each([
    { apiUrl: undefined, warnings: [['Missing environment variables: REACT_APP_API_BASE_URL']] },
    { apiUrl: 'https://api.example.invalid/api/v1', warnings: [] },
  ])('checks the dynamically named required variable for $apiUrl', ({ apiUrl, warnings }) => {
    const previous = process.env.REACT_APP_API_BASE_URL;
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      if (apiUrl === undefined) delete process.env.REACT_APP_API_BASE_URL;
      else process.env.REACT_APP_API_BASE_URL = apiUrl;
      loadEnv('production', 'false');
      expect(warn.mock.calls).toEqual(warnings);
    } finally {
      if (previous === undefined) delete process.env.REACT_APP_API_BASE_URL;
      else process.env.REACT_APP_API_BASE_URL = previous;
      warn.mockRestore();
    }
  });
});
