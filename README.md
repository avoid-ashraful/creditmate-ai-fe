# CreditMate AI — Frontend

The React single-page app for CreditMate AI: a comparison platform for banking
products in Bangladesh — credit cards, deposits, loans, and bank accounts —
built on published bank data with provenance, so people can see not just the
numbers but where they came from and when they changed.

> **Status:** pre-launch, in active development.

[![CI](https://github.com/avoid-ashraful/creditmate-ai-fe/actions/workflows/ci.yml/badge.svg)](https://github.com/avoid-ashraful/creditmate-ai-fe/actions/workflows/ci.yml)
[![Storybook Build](https://github.com/avoid-ashraful/creditmate-ai-fe/actions/workflows/storybook.yml/badge.svg)](https://github.com/avoid-ashraful/creditmate-ai-fe/actions/workflows/storybook.yml)
[![Workflow Audit (zizmor)](https://github.com/avoid-ashraful/creditmate-ai-fe/actions/workflows/workflow-audit.yml/badge.svg)](https://github.com/avoid-ashraful/creditmate-ai-fe/actions/workflows/workflow-audit.yml)
[![Secret Scan (gitleaks)](https://github.com/avoid-ashraful/creditmate-ai-fe/actions/workflows/secret-scan.yml/badge.svg)](https://github.com/avoid-ashraful/creditmate-ai-fe/actions/workflows/secret-scan.yml)

**Related repositories**

- [creditmate-ai](https://github.com/avoid-ashraful/creditmate-ai) — umbrella repo: deployment (Helm), docs, project overview
- [creditmate-ai-be](https://github.com/avoid-ashraful/creditmate-ai-be) — Django REST API this app consumes

## What the app does

Four product verticals, one per mode in the app shell:

- **Cards** — credit card discovery and detail pages.
- **Save** — deposits: fixed deposits (FDR) and monthly schemes (DPS).
- **Borrow** — personal, home, car, and secured loans, priced as published rate bands.
- **Accounts** — savings and current accounts, ranked by net annual value at your balance.

Across all four:

- **Comparison** — side-by-side comparison with a differences-only toggle, plus print / Save-as-PDF export of just the comparison table.
- **Bank pages** — a page per bank with its full product range across verticals.
- **Provenance and "what changed"** — detail pages show source and verification status per product, a fee/rate change history, and delta cards that highlight what changed since you last looked.
- **Eligibility checker** — a Bangladesh-specific, income-based estimate using each card's _published_ minimum income. Results are estimates only — the words "pre-approved" and "guaranteed" never appear; the bank makes the final decision. Inputs are not stored.
- **CreditMate Score** — a 0–10 score computed only from published data, with a per-component breakdown on detail pages, badges on listings, and sort-by-score. The methodology is published in the app.
- **Calculators** — EMI and payoff calculators that run on real cards' published rates (or a custom rate, with an honest warning when a payment doesn't cover the first month's interest), plus a reward calculator that shows each card's effective value-back %.
- **Community reviews** — public ratings, reviews, and comments for all product types; a product earns a "Community reviewed" chip at 50+ approved reviews.
- **Personalisation** — a server-stored profile, a cross-device shortlist, saved searches, and bank-follow alerts, gathered in the `/my` workspace.
- **Ask CreditMate** (`/ask`) — a chat advisor that answers from the published catalogue and cites its sources, with actions such as adding a cited card to your shortlist. It requires the backend's `ADVISOR_ENABLED` flag; when the advisor is off, the page says so and points back to normal search.
- **Command palette** — press ⌘K to jump to pages, tools, and actions.
- **Themes and languages** — light and dark themes (system-preference default) and English / বাংলা (bn-BD), set in Hind Siliguri.

## Tech stack

| Area       | Technology                                                           |
| ---------- | -------------------------------------------------------------------- |
| Framework  | React 18, TypeScript 5.9                                             |
| Build      | Vite 8                                                               |
| Routing    | React Router 7                                                       |
| Motion     | Framer Motion                                                        |
| Unit tests | Jest 30, React Testing Library                                       |
| E2E tests  | Playwright, including visual regression and axe accessibility checks |
| Components | Storybook 8                                                          |
| Design     | Style Dictionary design tokens (see below)                           |

## Design system

The visual language is token-driven. Sources live in
[`design-tokens/tokens/`](design-tokens/tokens) as plain JSON and are compiled
by Style Dictionary into committed outputs — CSS custom properties
(`src/styles/tokens.css`), TypeScript constants (`src/styles/tokens.ts`), and a
Figma tokens file.

**Never edit the generated outputs by hand.** Change the token sources, then
regenerate:

```bash
npm run tokens:build   # regenerate all outputs
npm run tokens:check   # fails if committed outputs are stale or hand-edited
```

The visual identity is **Midnight Ledger** (redesign plan V2, Nov 2026): an
open-"C" logo mark with a single gold dot, built on ink navy (`#0F1B33`),
primary navy (`#1D3260`), brand gold (`#C9A227`) and a warm paper ground
(`#F5F2EC`); the dark theme steps down the same navy ladder. Fraunces
(self-hosted) is reserved for the wordmark, page H1s, hero numerals and
Learn headlines — UI text stays on the sans stack, and Bengali display text
falls back to Hind Siliguri. Gold is decorative on light grounds (2.17:1 on
paper): links and focus are navy, and gold-coloured text uses the deep-gold
token. The logo, its variants and the gold rule are catalogued in Storybook
under **Brand/Logo** — run `npm run storybook`.
Components live in `src/components/` (including the `ui/` primitives and the
`shell/` app frame) and are catalogued in Storybook.
Accessibility is treated as a release gate: Playwright + axe checks cover the
main routes in both themes (see [`docs/ACCESSIBILITY.md`](docs/ACCESSIBILITY.md)).

## Getting started

### Prerequisites

- Node.js 24 (see `.nvmrc`; `engines` requires `>=24 <25`)
- npm 11 or newer
- The [backend](https://github.com/avoid-ashraful/creditmate-ai-be) running locally, or any reachable CreditMate API

### Install and run

```bash
git clone https://github.com/avoid-ashraful/creditmate-ai-fe.git
cd creditmate-ai-fe
npm ci
npm run dev
```

The dev server runs at [http://localhost:3000](http://localhost:3000)
(`PORT` overrides the port).

### Configuration

Configuration is read centrally in [`src/config/env.ts`](src/config/env.ts).
Values are public browser configuration — never put credentials in them.

| Variable                       | Purpose                                               | Default                        |
| ------------------------------ | ----------------------------------------------------- | ------------------------------ |
| `REACT_APP_API_BASE_URL`       | Base URL of the CreditMate API                        | `http://localhost:8000/api/v1` |
| `REACT_APP_ENABLE_API_LOGGING` | Verbose API logging (development builds only)         | off                            |
| `REACT_APP_ANALYTICS_KEY`      | Enables the privacy-first analytics integration hook  | unset (analytics inactive)     |
| `REACT_APP_SENTRY_DSN`         | Error reporting endpoint, if your deployment uses one | unset                          |
| `PORT`                         | Dev-server port                                       | `3000`                         |

Set them in `.env` / `.env.local`, e.g.:

```bash
REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
```

## Scripts

| Script                           | Purpose                                                        |
| -------------------------------- | -------------------------------------------------------------- |
| `npm run dev` (or `npm start`)   | Start the Vite dev server                                      |
| `npm run build`                  | Production build into `build/` (generates the sitemap first)   |
| `npm run preview`                | Preview the production build                                   |
| `npm test`                       | Run the Jest suite once                                        |
| `npm run test:watch`             | Jest in watch mode                                             |
| `npm run test:ci`                | Jest serially, as CI runs it                                   |
| `npm run test:e2e`               | Playwright end-to-end tests                                    |
| `npm run test:e2e:visual`        | Playwright visual-regression tests                             |
| `npm run test:e2e:visual:update` | Refresh visual-regression snapshots                            |
| `npm run check-types`            | TypeScript check (`tsc --noEmit`)                              |
| `npm run check-lint`             | ESLint check                                                   |
| `npm run lint`                   | ESLint with auto-fix                                           |
| `npm run check-format`           | Prettier check                                                 |
| `npm run check-styles`           | Design-values guard (no hard-coded values that bypass tokens)  |
| `npm run tokens:build`           | Regenerate design-token outputs                                |
| `npm run tokens:check`           | Verify token outputs are current and unedited                  |
| `npm run bundle:budget`          | Check the bundle against the size budget                       |
| `npm run storybook`              | Storybook dev server on port 6006                              |
| `npm run storybook:build`        | Static Storybook build                                         |
| `npm run check:all`              | Types, lint, format, tests, build, bundle budget, style checks |

Deeper guides: [TESTING.md](TESTING.md), [LINTING.md](LINTING.md),
[PERFORMANCE_BUDGETS.md](PERFORMANCE_BUDGETS.md),
[VISUAL_REGRESSION_GUIDE.md](VISUAL_REGRESSION_GUIDE.md),
[LOCALIZATION_GUIDE.md](LOCALIZATION_GUIDE.md).

## Project structure

```
src/
├── pages/        Route pages: discovery, detail, compare, calculators,
│                 eligibility, /ask advisor, /my workspace, plan tools
├── components/   UI components, incl. ui/ primitives and shell/ (app frame,
│                 mode rail, command palette, shortlist tray)
├── services/     API clients, one module per backend area
├── locales/      EN/BN string tables and the language context (bn/ for Bengali)
├── hooks/        Shared React hooks
├── styles/       Global CSS, fonts, and the generated design tokens
├── content/      In-app content (guides, glossary)
├── types/        Shared TypeScript types
└── utils/, lib/  Helpers

design-tokens/    Token sources (tokens/), formats, and build outputs
e2e/              Playwright specs (flows, axe accessibility, visual regression)
docs/             Accessibility, analytics, API-contract and Storybook docs
```

## Continuous integration

On every pull request (and push to `master`):

- **CI** — locked install (`npm ci`), production dependency audit, type check,
  lint, format check, design-values guard, Jest suite, production build, and
  the bundle-budget check.
- **Storybook Build** — the static Storybook build must succeed.
- **Workflow Audit (zizmor)** — the workflow files themselves are audited.
- **Secret Scan (gitleaks)** — the PR's commits are scanned for secrets; a
  full-history scan runs weekly.

End-to-end and visual-regression Playwright suites run in the
[umbrella repo's](https://github.com/avoid-ashraful/creditmate-ai) CI against
the integrated application.

## Contributing

1. Branch from `master` (`feat/…`, `fix/…`, `docs/…`).
2. Keep changes scoped; add or update tests for behaviour changes.
3. Before pushing, run `npm run check:all` — and `npm run tokens:check` if you
   touched design tokens. Husky + lint-staged also run checks on commit.
4. Open a pull request; all CI checks above must pass.

Eligibility and financial wording is a product rule, not a style choice:
never describe an estimate as "pre-approved" or "guaranteed", and never
present a number the catalogue doesn't publish.
