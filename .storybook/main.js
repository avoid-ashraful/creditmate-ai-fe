module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/preset-create-react-app',
    '@storybook/preset-typescript',
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: prop => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
      tsconfigPath: require('path').resolve(__dirname, '../tsconfig.json'),
      compilerOptions: {
        jsx: 'react-jsx',
      },
    },
  },
  staticDirs: ['../public'],
  webpackFinal: async config => {
    // Remove fork-ts-checker-webpack-plugin to avoid type checking issues with JSX
    config.plugins = config.plugins.filter(
      plugin => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin'
    );

    // Remove ESLint plugin to avoid parsing errors on TSX
    config.plugins = config.plugins.filter(
      plugin => plugin.constructor.name !== 'ESLintWebpackPlugin'
    );

    // Find and remove any existing TypeScript rules added by CRA preset
    config.module.rules = config.module.rules.filter(
      rule => !rule.test || !rule.test.toString().includes('tsx')
    );

    // Add our own TypeScript rule with ts-loader
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      use: [
        {
          loader: require.resolve('ts-loader'),
          options: {
            transpileOnly: true,
            configFile: require('path').resolve(__dirname, '../tsconfig.json'),
            compilerOptions: {
              jsx: 'react-jsx',
            },
          },
        },
      ],
      exclude: /node_modules/,
    });
    return config;
  },
};
