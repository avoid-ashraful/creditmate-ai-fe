# Accessibility (WCAG 2.1 AA)

## Automated coverage

`e2e/a11y-axe.spec.ts` runs axe-core against production pages with the existing
mock API and all Playwright projects (desktop, tablet, mobile Chromium). It uses
`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, and `best-practice` tags. Every scan
asserts zero violations and attaches the full axe report to the test result.
There are no disabled rules or excluded selectors.

The route matrix covers home with expanded filters, search results, a three-card
comparison, card detail, the open report dialog, travel and Islamic categories,
advanced search, quiz, calculator, guides, glossary, login, registration, account
and alerts after mock login, unsubscribe confirmation, privacy, terms,
methodology, and 404. Each runs with English and Bengali stored preferences.
Home and card detail also run in dark mode in both languages.

Additional browser checks exercise the real language switcher and persistence,
Bengali passage language tags, home skip-link/tab order, and both dialogs' initial
focus, forward/reverse focus containment, Escape dismissal, and focus return.

Run after building with the E2E API environment:

```sh
E2E_BASE_URL=http://127.0.0.1:4177 heavy npx playwright test e2e/a11y-axe.spec.ts --workers=1
```

## Manual release checklist

Automated results are a regression guard, not a claim of complete WCAG conformance.
Before a release, record browser, OS, assistive technology version, language,
route/state, and outcome for the following checks:

- NVDA with Firefox/Chrome on Windows and VoiceOver with Safari on macOS/iOS:
  navigate landmarks/headings, forms, results, comparison cells, and both dialogs.
- Listen to English/Bengali pronunciation and language changes, including mixed
  card/bank names and numbers; use an installed Bengali voice.
- Complete search/filter/compare, all quiz steps, calculator, authentication,
  account and alert forms with keyboard and screen reader. Check errors,
  asynchronous result/status announcements, and validation focus.
- Verify every visible control has an understandable name matching its label;
  inspect image alternatives against real bank/card assets.
- Confirm focus stays visible under sticky headers, comparison bars, and dialogs;
  verify both tab directions, Escape, focus return, and no keyboard traps.
- Check 200% text zoom, 400% browser zoom / 320 CSS-pixel reflow, text spacing,
  orientation changes, and comparison-table horizontal scrolling.
- Inspect text contrast (4.5:1), large text/UI boundaries/focus indicators (3:1),
  gradients at all animation positions, hover/selected/error states, forced colors,
  and reduced motion. Do not rely on color alone for status or selection.
- Exercise live API empty/error/loading/success states and long Bengali copy.

## Known exceptions and limits

- No axe rule exceptions or third-party selector exclusions.
- Screen-reader and visual/manual checklist remains pending; this environment
  cannot certify NVDA or VoiceOver behavior.
- The application has partial translations. English copy remains English where
  translations are unavailable; language markup must reflect the actual passage.
- Mocked API fixtures make the audit deterministic. Real data and external bank
  websites require separate review.

## Baseline audit before fixes

Production baseline, desktop Chromium, axe-core 4.14.0: **46 failing scans,
264 affected-node occurrences**. Counts below are occurrences across rule nodes,
so a node violating two rules is counted twice. These are baseline failures,
not outstanding exceptions. `N` = visible label/accessibility name mismatch,
`C` = color contrast, `H` = heading order, `A` = invalid ARIA reference,
`L` = inline link distinguishability. Per-page details follow:

| Page/state                  | English: affected nodes (rules) | Bengali: affected nodes (rules) |
| --------------------------- | ------------------------------- | ------------------------------- |
| home with filters           | 9 (H: 1, N: 8)                  | 3 (H: 1, N: 2)                  |
| search results              | 10 (A: 1, H: 1, N: 8)           | 4 (A: 1, H: 1, N: 2)            |
| comparison with three cards | 1 (N: 1)                        | 1 (N: 1)                        |
| card detail                 | 15 (C: 12, N: 1, L: 2)          | 15 (C: 12, N: 1, L: 2)          |
| report dialog               | 17 (C: 14, N: 1, L: 2)          | 16 (C: 13, N: 1, L: 2)          |
| travel category             | 1 (N: 1)                        | 1 (N: 1)                        |
| Islamic category            | 1 (N: 1)                        | 1 (N: 1)                        |
| advanced search             | 4 (C: 2, H: 1, N: 1)            | 5 (A: 1, C: 2, H: 1, N: 1)      |
| quiz                        | 6 (C: 4, N: 2)                  | 7 (C: 4, N: 3)                  |
| calculator                  | 1 (N: 1)                        | 1 (N: 1)                        |
| guides                      | 1 (N: 1)                        | 1 (N: 1)                        |
| glossary                    | 54 (C: 53, N: 1)                | 12 (C: 11, N: 1)                |
| login                       | 2 (N: 1, L: 1)                  | 1 (N: 1)                        |
| register                    | 2 (N: 1, L: 1)                  | 2 (N: 1, L: 1)                  |
| account                     | 1 (N: 1)                        | 1 (N: 1)                        |
| alerts                      | 2 (C: 1, N: 1)                  | 2 (C: 1, N: 1)                  |
| unsubscribe                 | 1 (N: 1)                        | 1 (N: 1)                        |
| privacy                     | 1 (N: 1)                        | 1 (N: 1)                        |
| terms                       | 1 (N: 1)                        | 1 (N: 1)                        |
| methodology                 | 1 (N: 1)                        | 1 (N: 1)                        |
| 404                         | 1 (N: 1)                        | 1 (N: 1)                        |
| dark home                   | 10 (H: 1, N: 9)                 | 4 (H: 1, N: 3)                  |
| dark card detail            | 20 (C: 16, N: 2, L: 2)          | 20 (C: 16, N: 2, L: 2)          |

The initial alerts scan reached its error view because the audit login fixture
omitted token refresh. The final fixture mocks refresh and explicitly waits for
the frequency selector and populated subscription list. Autocomplete ARIA
failures varied by asynchronous suggestion state; both collapsed and expanded
states are covered by the corrected implementation.

Responsive validation also found the header navigation overflowing beyond its
gradient on tablet, leaving the language button at **1.32:1** contrast. The
header now wraps within its viewport on tablet, while on screens ≤768px the nav
becomes a horizontally scrollable row: every link stays on the gradient and the
sticky header stays two rows tall instead of covering the page. The comparison
table scroll region is keyboard-focusable, and the mobile comparison region has
an explicit role.

Dark-mode scanning found `#333` label/value colours from
`CardDetailsPopup.css` leaking into the card list on narrow viewports; those
rules are now scoped to `.card-details-popup`.

Language-tag checks separately found untagged Bengali navigation/footer copy,
translated page content, and Bengali guide cards in the English guides index.
Code/keyboard review also found the mouse-only card-preview trigger and missing
modal background isolation. The existing skip link was retained and verified.

The existing Jest axe-core guards already cover the shell, auth forms, card
summary/detail/popup, guides, glossary, theme/account controls, skeletons, and
toasts. No additional Jest axe dependency is needed. Previously skipped token contrast cases are now enabled. Their jsdom-only layout
rule exclusions are pre-existing; the new real-browser audits disable no rules.

## Validation commands

The implementation was checked with the repository's shared `heavy` gate:

- `heavy npx tsc --noEmit`: passed, no TypeScript errors.
- `heavy npm run check-lint`: passed, no ESLint errors or warnings.
- `CI=true heavy npx react-scripts test --watchAll=false --maxWorkers=1`:
  76 suites and 1,021 tests passed, none skipped.
- `heavy npm run tokens:check`: all three generated artifacts reproducible.
- `CI=true REACT_APP_API_BASE_URL=http://e2e.invalid/api/v1 REACT_APP_SITE_URL=http://127.0.0.1:4177 REACT_APP_ENABLE_API_LOGGING=false heavy npm run build`:
  production build compiled successfully.
- `E2E_BASE_URL=http://127.0.0.1:4177 heavy npx playwright test --grep-invert '@visual|visual' --workers=1`:
  **258 passed, 0 failed** (114 pre-existing tests plus 144 scans from the axe
  spec) across desktop, tablet, and mobile Chromium, English and Bengali, light
  and dark mode.

The resend-verification test also now waits for the specific asynchronous
rate-limit response, rather than matching an earlier, already-visible alert.
