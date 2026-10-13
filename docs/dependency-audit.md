# Dependency audit

Last reviewed: 2026-10-13 (branch `pm/audit-remediation`), npm 11.19.0, Node 24.21.0.

This documents the `npm audit` baseline, what was remediated, and what remains. It is
the reference for the advisories that cannot be fixed without breaking the app.

## Summary

| Scope                  | Critical | High | Moderate | Low | Total |
| ---------------------- | -------: | ---: | -------: | --: | ----: |
| Baseline, full tree    |        4 |  103 |       18 |   6 |   131 |
| Baseline, `--omit=dev` |        4 |   92 |       16 |   5 |   117 |
| After, full tree       |        0 |   70 |       37 |   4 |   111 |
| After, `--omit=dev`    |        0 |   59 |       35 |   3 |    97 |

Note on `--omit=dev`: `react-scripts` is listed under `dependencies` (not
`devDependencies`), so npm counts the whole CRA build toolchain as "production". The
column above is therefore not a measure of what ships to browsers. The split below uses
reachability from the browser entry points instead.

### Shipped to browsers vs build/dev tooling (after)

Browser-shipped = the transitive closure of `react`, `react-dom`, `react-router-dom`,
`styled-components`, `framer-motion`, `web-vitals` in `package-lock.json`.

| Bucket                              | Critical | High | Moderate | Low |
| ----------------------------------- | -------: | ---: | -------: | --: |
| Browser-shipped                     |        0 |    0 |        2 |   0 |
| Build / dev tooling (incl. `serve`) |        0 |   70 |       35 |   4 |

Baseline browser-shipped: 8 high + 1 moderate. All 8 high were the `react-spring` →
`@react-spring/native` → `react-native` → `metro` chain (see "Changes").

## Changes made

1. **`npm audit fix`** (non-forced). Only minor/patch lockfile movement. No direct
   dependency changed major version. `react-scripts` stays at 5.0.1. Cleared all
   critical advisories and most of the high ones.
2. **Removed `react-spring`** (`^10.0.1`, runtime dependency). It is not imported
   anywhere in `src/` (the only mention is a line in `src/styles/README.md`). It was the
   sole path that pulled `react-native@0.87`, `metro`, `@react-native/*` and related
   packages into the install tree. Removing it cleared 8 high advisories and the
   remaining `metro`-family findings. No application code changed.
   If you plan to use react-spring later, re-add it and expect these advisories to return.
3. **Overrides** (`package.json`), same-major patch fixes only:
   - `compression: ^1.8.2` (was 1.8.1; used by `serve`, the Railway production server, and
     by `webpack-dev-server`). Clears the `compression` / `serve` high advisories.
   - `underscore: ^1.13.8` (was ≤1.13.7; used by `jsonpath` → `bfj`, build tooling only).
4. **`eslint-plugin-testing-library`** (transitive, under `eslint-config-react-app/jest`)
   moved from 5.11.1 to 5.0.4. 5.11.1 is inside the advisory range (5.0.5 – 7.0.0-beta.6),
   so this is part of the fix. Lint-only; `check-lint` passes.

Attempted and reverted: an override pinning `@typescript-eslint/experimental-utils` to
5.62.0. Its advisory covers every 5.x version, so the override cleared nothing.

Rejected: `npm audit fix --force`. It proposes `react-scripts@0.0.0`, a downgrade that
removes the CRA toolchain.

## Remaining advisories

### A. Browser-shipped (2 moderate)

| Package                     | Severity | Range                  | Reachability in this app                                                                                                                                                                                                                                                                                           | Why not fixed                                                                                                                                  | Plan                                                                                                                |
| --------------------------- | -------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `react-router-dom` (direct) | moderate | 6.0.0-alpha.0 – 7.17.0 | Client-only SPA (`BrowserRouter`), no SSR. Advisories: open redirect via backslash in `<Link>` / `useNavigate` (bypass of CVE-2025-68470), and deserialization in SSR hydration (not used). Every `to` / `navigate()` target is a static path or built from our own data. No attacker-controlled path into a link. | Only fix is 7.18.x, a major upgrade with API changes (`react-router` 7 changes the data-router and import surface). Not a non-breaking change. | Schedule a v6 → v7 migration. Until then, do not pass URL- or user-supplied strings as `to` / `navigate()` targets. |
| `react-router` (transitive) | moderate | same                   | Same as above.                                                                                                                                                                                                                                                                                                     | Same as above.                                                                                                                                 | Same as above.                                                                                                      |

### B. Build and dev tooling (70 high, 35 moderate, 4 low)

None of these ship to browsers. They run at build time (`react-scripts build`, the
prebuild sitemap script) or in the local dev server, Jest, Storybook and lint. Their
severity is therefore a dev-environment concern, not an end-user exposure. Exposure
still matters for CI runners and for developer machines.

**B1. `react-scripts` 5.0.1 transitive tree (no fix within CRA 5).** npm's only suggested
fix is `react-scripts@0.0.0` (a downgrade). Affected packages include:

- Jest family, pulled in by `react-scripts`: `jest`, `jest-*`, `@jest/*`, `babel-jest`,
  `expect`. Test-only.
- Webpack dev server: `webpack-dev-server`, `webpack-dev-middleware`,
  `http-proxy-middleware`, `sockjs`, `selfsigned`, `node-forge`. Dev server only. Not
  deployed; production is the static `build/` served by `serve`.
- Build and SVG pipeline: `@svgr/webpack`, `@svgr/plugin-svgo`, `svgo`, `css-select`,
  `nth-check`, `postcss`, `postcss-*` (moderate), `cssnano`, `stylehacks`,
  `css-minimizer-webpack-plugin`, `resolve-url-loader`, `workbox-build`,
  `workbox-webpack-plugin`, `rollup-plugin-terser`, `serialize-javascript`,
  `fork-ts-checker-webpack-plugin`, `react-dev-utils`, `eslint-webpack-plugin`,
  `eslint-config-react-app`, `globby`, `fast-glob`, `micromatch`, `braces`, `chokidar`,
  `tailwindcss` (via the CSS toolchain), `js-yaml` (moderate), `argparse`, `uuid`
  (moderate), `sprintf-js`, `@tootallnate/once`, `http-proxy-agent`, `jsdom`.
  - Reachability: build time over our own source and `node_modules`. Not an
    attacker-reachable input path.
  - Plan: migrate off CRA (see C). Vite or Rsbuild would drop most of this tree.

**B2. Direct dev dependencies that need a major bump:**

| Package                                                                                | Severity        | Why not fixed                                                                                                                                                         | Plan                                                                 |
| -------------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser` (5.x, direct)          | high            | Fix is 8.x. Breaks the lint setup with `eslint` 8 and `eslint-config-react-app`. Dev-only.                                                                            | Upgrade alongside an ESLint setup review.                            |
| `@typescript-eslint/*` (transitive, incl. `experimental-utils`, `type-utils`, `utils`) | high            | Same root cause as above. The `experimental-utils` advisory covers all 5.x.                                                                                           | Same as above.                                                       |
| `lint-staged` (15.x, direct, runs on pre-commit)                                       | high            | Fix is 17.x.                                                                                                                                                          | Upgrade in a separate change; the pre-commit hook must keep working. |
| `msw` (1.x, direct)                                                                    | high            | Fix is 3.x. Used only by the Jest setup (`src/mocks/jest.setup.ts`) and `src/mocks/handlers.ts`, which is imported only from tests. Not in the production bundle.     | Upgrade with the Jest migration.                                     |
| `style-dictionary` (4.x, direct, tokens build)                                         | high            | Fix is 5.x. Build-time token generation.                                                                                                                              | Upgrade with `tokens:build` verified.                                |
| `@storybook/*` 8.6.19 (direct)                                                         | high / moderate | Fixes require a different Storybook major or are unavailable (`fix: false` for `@storybook/react-webpack5` and `@storybook/builder-webpack5`). Storybook is dev-only. | Track Storybook 9 or remove Storybook if unused.                     |

**B3. Other moderate/low transitive dev items.** `ajv`, `body-parser`, `qs`, `follow-redirects`,
`ws`, `yaml`, `terser-webpack-plugin` and the `postcss-*` plugins are also build or dev
tooling. Most of these are fixed in the lockfile. The remaining moderate `postcss-*`
entries are build-time CSS plugins under `react-scripts`.

Note: the moderate count rose from 18 to 37 after `npm audit fix`. The new entries are
`postcss-*` and `@csstools/*` advisories that npm did not report against the old
lockfile. We did not establish the exact cause, and they are all build-time.

## Verification

Run on the remediated branch:

- `npm ci --dry-run`: passes.
- `npm run check-types`, `npm run check-lint`, `npm run check-format`,
  `npm run tokens:check`: all pass.
- Jest (`CI=true react-scripts test --watchAll=false --maxWorkers=3`): 40 suites, 594 tests pass.
- `npm run build` (no `CI` flag): compiles, exit 0, main bundle 151.28 kB gzip.
- `CI=true npm run build`: **fails**. CRA turns warnings into errors under `CI=true`. The
  warnings are four `warn`-level findings in `src/lib/web-vitals.ts` (`no-explicit-any`,
  `no-console`) and `src/reportWebVitals.ts` (`no-explicit-any`, `no-console`). These come
  from `.eslintrc.js`, which sets them to `warn`. `check-lint` reports the same four
  warnings and exits 0 because it has no `--max-warnings`. Neither file nor the lint config
  changed in this branch. We have not built HEAD to confirm that CI=true already failed
  there, but the lint inputs are identical. Fixing it needs edits in `src/`, which were out
  of scope, so it's left for a follow-up.

## Plan

1. **Now (done):** remove unused runtime dep, safe overrides, `npm audit fix`.
2. **Next:** upgrade `react-router-dom` to v7 (one browser-shipped moderate). Test
   routes, `useSearchParams` and `RecommendationQuiz` redirects.
3. **Then:** migrate off CRA to Vite or Rsbuild. This removes most of section B1. Keep the
   Jest config or move to Vitest with the existing tests.
4. **Then:** the dev-dependency majors in B2 (typescript-eslint 8, lint-staged 17,
   msw 3, style-dictionary 5), one per change, with the pre-commit hook verified each time.

Re-run `npm audit --omit=dev` and `npm audit` after each step and update this table.
