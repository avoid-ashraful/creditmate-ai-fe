module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y', '@storybook/addon-viewport'],
  framework: { name: '@storybook/react-webpack5', options: {} },
  staticDirs: ['../public'],
  env: config => ({
    ...config,
    ...Object.fromEntries(
      Object.entries(process.env).filter(([key]) => key.startsWith('REACT_APP_'))
    ),
  }),
  webpackFinal: async config => {
    // src/styles/fonts.css (imported by preview.tsx, like the app entry does)
    // references the self-hosted Bengali webfonts by absolute /fonts/*.woff2
    // URLs. Those files live in public/ and reach Storybook via staticDirs,
    // so webpack must not resolve them as modules: tell css-loader to leave
    // absolute-path url()s untouched in the emitted CSS.
    const leaveAbsoluteUrlsAlone = rules => {
      for (const rule of rules ?? []) {
        const uses = Array.isArray(rule.use) ? rule.use : rule.use ? [rule.use] : [];
        uses.forEach((entry, index) => {
          const loader = typeof entry === 'string' ? entry : entry?.loader;
          if (loader && loader.includes('css-loader')) {
            const withOptions = typeof entry === 'string' ? { loader: entry } : entry;
            withOptions.options = {
              ...withOptions.options,
              url: { filter: url => !url.startsWith('/') },
            };
            if (Array.isArray(rule.use)) rule.use[index] = withOptions;
          }
        });
        leaveAbsoluteUrlsAlone(rule.oneOf);
        leaveAbsoluteUrlsAlone(rule.rules);
      }
    };
    leaveAbsoluteUrlsAlone(config.module.rules);

    // The webpack framework needs an explicit JSX/TypeScript transform without CRA.
    config.module.rules.push({
      test: /\.[jt]sx?$/,
      exclude: /node_modules/,
      use: {
        loader: require.resolve('babel-loader'),
        options: {
          configFile: false,
          presets: [
            ['@babel/preset-env', { modules: false }],
            ['@babel/preset-react', { runtime: 'automatic' }],
            '@babel/preset-typescript',
          ],
        },
      },
    });
    return config;
  },
};
