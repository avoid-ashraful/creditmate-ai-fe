# Task 9.2 - Bengali (bn-BD) Localization Guide

## Overview

This task implements Bengali (bn-BD) localization for the CreditMate AI platform. The
scope is intentionally minimal and honest: **only the glossary content, navigation
labels, and the glossary page language switcher are translated.** Full page-by-page
translation is explicitly out of scope (see [Limitations](#limitations)).

Deliverables:

- A reviewed bilingual glossary with **53** credit/finance terms (≥ 50 required)
- BDT currency formatting with Bangla numerals
- Gregorian date formatting in Bengali (Bangla digits + Bengali month names)
- A minimal language context/switcher with persistence
- CSS using logical properties (RTL-ready)
- A test suite that validates the data quality and the helpers

## Files Modified/Created

### 1. Shared localization modules — `src/locales/`

| File                  | Purpose                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| `bn/glossary.json`    | Source of truth: 53 bilingual glossary entries                                                           |
| `types.ts`            | `Language`, `GlossaryCategory`, `GlossaryTerm`, category option types                                    |
| `glossary.ts`         | Lookup/filter helpers over the JSON (`findGlossaryTerm`, `filterGlossaryTerms`, localized label helpers) |
| `format.ts`           | Deterministic BDT + date formatting helpers                                                              |
| `LanguageContext.tsx` | `LanguageProvider`, `useLanguage`, `detectInitialLanguage`, persistence                                  |
| `index.ts`            | Barrel export for ergonomic imports (`import { useLanguage, formatBdtCurrency } from '../locales'`)      |

### 2. Glossary page — `src/pages/GlossaryPage.tsx` + `.css`

- Renders from `src/locales/bn/glossary.json` via `glossary.ts` (no duplicated inline arrays)
- Uses the shared `useLanguage()` context for the EN/BN switcher
- Search matches both English and Bengali; category filter is localized
- `GlossaryPage.css` uses logical properties (`inline-size`, `margin-inline`, `margin-block-*`, `padding-inline-start`, …)

### 3. App shell — `src/App.tsx`

- `NAV_ITEMS` exports the bilingual nav configuration (7 links)
- `AppContent` uses `useLanguage()` for bilingual nav labels, footer, and the header switcher
- `AppRoutes` (exported) holds the route table so routing can be tested with `MemoryRouter`
- `RootApp` (default export) wraps `<App />` in `LanguageProvider`; `src/index.tsx` renders `<RootApp />`
- Footer gibberish replaced with proper Bengali: `সর্বস্বত্ব সংরক্ষিত।`

## Bengali data quality (`src/locales/bn/glossary.json`)

All `term_bn`/`definition_bn` strings were reviewed and rewritten by hand. Rules that are
enforced by tests (`src/locales/glossary.test.ts`):

- **No Arabic, Cyrillic, CJK/Hangul/Kana, or halfwidth/fullwidth characters** in Bengali fields
- **No mojibake artifacts** (`Ã`, `â€`, `à¦`, `¤`, `¦`, `§`, …)
- Every Bengali field contains real Bengali characters and stays within the
  Bengali block (`U+0980–U+09FF`) plus ASCII and `।` (`U+0964/U+0965`)
- English fields stay free of Bengali characters
- Key translations pinned by tests: `APR` → `বার্ষিক শতকরা হার`,
  fee words → `ফি`/`মাশুল`, charges → `চার্জ`, plus `লাউঞ্জ`, `মওকুফ`, `রিওয়ার্ড`, etc.
- Standard abbreviations are used only where natural; the full APR term is
  _translated_ (not left as Latin), while derived terms transliterate as `এপিআর`

## Currency formatting (BDT)

`formatBdtCurrency(amount)` in `src/locales/format.ts` is a **deterministic, dependency-free**
implementation so output is byte-for-byte stable in any runtime:

- `1500` → `১,৫০০.০০৳`
- `100000` → `১,০০,০০০.০০৳` (Indian/lakh grouping, matching `Intl` for `bn-BD`)
- `-250.5` → `-২৫০.৫০৳` (JS → `-২৫০.৫০৳`)
- `NaN`/`Infinity` → `০.০০৳`

`formatBdtCurrencyIntl(amount)` additionally tries `Intl.NumberFormat('bn-BD', { style: 'currency', currency: 'BDT' })`
and only trusts its output when it carries the Taka sign and is not `NaN৳`, falling back to the
deterministic formatter otherwise. On this project's Node (v24, full ICU) the `Intl` output matches
the manual formatter for the tested values.

## Calendar formatting

- `formatGregorianDate` → `DD/MM/YYYY` (local components, no timezone shifts)
- `formatBengaliDateNumeric` → `০১/০১/২০২৪` (Bangla digits, Gregorian calendar)
- `formatBengaliDate` → `১ জানু ২০২৪` (short Bengali month + Bangla digits)
- `BENGALI_MONTHS` / `BENGALI_MONTHS_SHORT` provide the twelve Bengali month names
  (`জানুয়ারি`, …, `ডিসেম্বর`)

**Honest limitation:** the displayed year is the **Gregorian** year with Bangla digits.
The Bengali calendar (Bongabdo) uses different year numbering (e.g., 2024 CE ≈ 1431 BS);
that conversion is deliberately **not** claimed. See the test `Gregorian vs Bengali calendar behaviour`.

## Language context & switcher

`LanguageContext.tsx` exposes:

- `LANGUAGE_STORAGE_KEY = 'user-lang'` — localStorage persistence key
- `detectInitialLanguage(stored, navigatorLanguage)` — stored preference wins; `bn*` browser
  locale auto-selects Bengali; everything else English
- `LanguageProvider` — lazy initial state (SSR-safe), persists on `setLang`/`toggleLang`
- `useLanguage()` — throws a descriptive error outside a provider
- `SUPPORTED_LANGUAGES` / `isLanguage`

The header switcher toggles nav labels and the footer; the glossary page switch swaps
content. Both are covered by tests.

## CSS logical properties

`src/pages/GlossaryPage.css` uses logical properties throughout (`max-inline-size`,
`margin-inline`, `margin-block-*`, `padding-inline-*`, `block-size`, `inline-size`)
so the layout can flip for a future RTL language without structural changes.

## Tests

| Suite                                  | Covers                                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `src/locales/glossary.test.ts`         | ≥ 50 terms, unique ids, required fields, script/mojibake validation, key translations, lookup/filter helpers        |
| `src/locales/format.test.ts`           | Bangla numerals, BDT currency (incl. lakh grouping, negatives, non-finite), Gregorian vs Bengali dates, month names |
| `src/locales/LanguageContext.test.tsx` | detection, persistence, toggle, error outside provider                                                              |
| `src/pages/GlossaryPage.test.tsx`      | render EN/BN, switch, search (both scripts), category filter, empty state                                           |
| `src/App.test.tsx`                     | routing via `MemoryRouter` (`/glossary`, `/about`), nav hrefs, header/footer language toggle                        |

## Adding new Bengali terms

1. Add an entry to `src/locales/bn/glossary.json` following the existing schema
   (`id`, `term_en`, `term_bn`, `category`, `definition_en`, `definition_bn`, `bengaliCalendarDate`).
2. Keep `term_bn`/`definition_bn` in clean Bengali Unicode (run the glossary tests to verify).
3. The term automatically appears on the glossary page in both languages.

## Limitations

- Only the glossary page content, nav labels, footer strings, and the glossary page
  language switcher are translated. Homepage, comparison, calculator, etc. remain English.
- `bengaliCalendarDate` is `null` for all entries; the field supports a Gregorian date
  string (`YYYY-MM-DD`) when a term needs a date demo.
- Calendar output uses the Gregorian calendar with Bengali digits/months — not Bongabdo
  year conversion.
- `Intl` results are validated before use; on runtimes without `bn-BD` ICU data the
  deterministic fallbacks in `format.ts` are used instead.

## Running checks

```bash
npm test                 # 368 tests, 22 suites
npm run check-types      # tsc --noEmit
npm run check-lint       # ESLint
npm run check-format     # Prettier
npm run build            # production build (generated build/ is never committed)
```

Current status: tests 368/368, typecheck clean, lint clean, production build succeeds.
