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
