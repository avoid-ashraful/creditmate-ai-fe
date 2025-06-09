# Linting and Formatting

This project uses ESLint and Prettier to enforce code quality and consistent formatting. Git hooks are set up to automatically check and fix issues before commits.

## Tools Used

- **ESLint**: JavaScript/TypeScript linter
- **Prettier**: Code formatter
- **Husky**: Git hooks
- **lint-staged**: Run linters on staged files

## Available Scripts

- `npm run lint`: Lint and fix all JavaScript/TypeScript files
- `npm run format`: Format all files with Prettier
- `npm run check-format`: Check if files are formatted correctly
- `npm run check-lint`: Check for linting issues without fixing
- `npm run check-types`: Check TypeScript types

## Pre-commit Hook

A pre-commit hook is set up to automatically run linting and formatting on staged files before each commit. This ensures that all committed code meets the project's quality standards.

## Configuration Files

- `.eslintrc.js`: ESLint configuration
- `.prettierrc`: Prettier configuration
- `.husky/pre-commit`: Git pre-commit hook

## ESLint Rules

The ESLint configuration includes rules for:

- Maximum line length (100 characters)
- Import ordering and organization
- React best practices
- TypeScript best practices

## Prettier Rules

The Prettier configuration includes rules for:

- Single quotes
- Semicolons
- 100 character line length
- 2 space indentation
- Trailing commas in ES5 mode

## Adding New Dependencies

When adding new dependencies, make sure to run `npm install` to ensure the husky hooks are properly set up.