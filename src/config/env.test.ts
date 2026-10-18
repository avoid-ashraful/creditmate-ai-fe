const loadEnv = (nodeEnv: string, logging: string) => {
  const env = process.env as Record<string, string | undefined>;
  const previous = { NODE_ENV: env.NODE_ENV, log: env.REACT_APP_ENABLE_API_LOGGING };
  env.NODE_ENV = nodeEnv;
  env.REACT_APP_ENABLE_API_LOGGING = logging;
  try {
    let loaded = {} as typeof import('./env');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
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
