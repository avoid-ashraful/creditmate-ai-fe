module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  extends: [
    'react-app',
    'react-app/jest',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['react', 'react-hooks', '@typescript-eslint', 'import'],
  rules: {
    // Basic rules
    'max-len': [
      'error',
      { code: 100, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true },
    ],
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // React rules
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Import rules
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-duplicates': 'error',
    'import/no-unresolved': 'off', // TypeScript takes care of this

    // TypeScript rules
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: ['**/*.stories.js', '**/*.stories.jsx', '**/*.stories.ts', '**/*.stories.tsx'],
      rules: {
        // Story handlers are intentionally inert when rendering controls.
        '@typescript-eslint/no-empty-function': 'off',
        // Storybook's CSF contract uses the default export as story metadata.
        'import/no-anonymous-default-export': 'off',
      },
    },
    {
      files: ['e2e/**/*.ts', 'e2e-live/**/*.ts', 'playwright.config.ts'],
      rules: {
        // These files use Playwright's page locators and per-viewport checks,
        // not React Testing Library render queries or Jest conditionals.
        'testing-library/prefer-screen-queries': 'off',
        'jest/no-conditional-expect': 'off',
      },
    },
  ],
};
