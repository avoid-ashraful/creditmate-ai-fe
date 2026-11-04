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
- `npm run check-styles`: Check design values (tokens-only colours, spacing and breakpoints)

## Design Values Check

`npm run check-styles` (script: `scripts/check-design-values.mjs`) enforces the redesign rule that components consume design tokens only. It scans `.css`, `.ts` and `.tsx` files under `src/` (excluding the generated `src/styles/tokens.css` / `tokens.ts`, plus test and story files for the TS/TSX rules) and rejects:

- Hex colour literals (`#rgb`, `#rrggbb`, `#rrggbbaa`) and `rgb()` / `rgba()` / `hsl()` / `hsla()` literals
- `@media` width values outside the breakpoint scale: 480px, 768px, 1024px, 1280px
- Raw px values (other than 0 and 1px) in margin, padding, gap, inset and position declarations in `.css` files
- `transition: all` in `.css` files

**Strict zones** — `src/components/ui/**` and `src/components/shell/**` — are zero tolerance: any violation fails the check.

**Legacy ratchet** — the rest of `src/` carries existing debt, recorded per file and per rule in `scripts/design-values-baseline.json`. A legacy file fails only if its violation counts exceed the baseline (or it has violations and no baseline entry), so debt can only go down. When you clean up a legacy file, lock in the improvement by regenerating the baseline and committing it:

```bash
node scripts/check-design-values.mjs --write-baseline
```

The baseline may only ever decrease: CI compares it against the PR's base branch and fails on any per-file/per-rule increase, and each redesign phase must lower it.

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
