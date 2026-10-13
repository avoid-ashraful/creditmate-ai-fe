# Storybook Catalog

This document catalogs all Storybook stories in the CreditMate AI project, organized by component. Stories are automatically generated from `*.stories.tsx` files and displayed in Storybook with controls, a11y addon coverage, and theme/locale decorators.

---

## Table of Contents

- [Components](#components)
  - [Toast](#toast)
  - [Skeleton](#skeleton)
  - [ThemeToggle](#themetoggle)
  - [AccountMenu](#accountmenu)
  - [AuthFormField](#authformfield)
  - [AuthCard](#authcard)
  - [SearchAutocomplete](#searchautocomplete)
  - [FilterPanel](#filterpanel)
  - [ComparisonBar](#comparisonbar)
  - [CardListItem](#cardlistitem)
  - [CardList](#cardlist)
  - [CardDetailsPopup](#carddetailspopup)
  - [CardComparisonTable](#cardcomparisontable)
  - [CategoryCard](#categorycard)
- [Pages](#pages)
  - [LoginPage](#loginpage)
  - [RegisterPage](#registerpage)
  - [ExperimentResults](#experimentresults)

---

## Components

### Toast

**File:** `src/components/Toast.stories.tsx`  
**Stories:** 7

| Story                            | Description                                      |
| -------------------------------- | ------------------------------------------------ |
| `Success`                        | Basic success message                            |
| `Error`                          | Error message display                            |
| `Info`                           | Informational message                            |
| `LongMessage`                    | Multi-line wrapping text                         |
| `Empty`                          | Hidden state (empty message)                     |
| `WithCustomClass`                | Custom CSS class applied                         |
| `Rapid Changes (Animation Test)` | Tests AnimatePresence with rapid message changes |

**Accessibility:** Role="status", aria-live="polite", respects `prefers-reduced-motion`

---

### Skeleton

**File:** `src/components/Skeleton.stories.tsx`  
**Stories:** 11

| Story                 | Description                                  |
| --------------------- | -------------------------------------------- |
| `Default`             | Basic skeleton block (200px × 1rem)          |
| `CardHeight`          | Card-sized skeleton (100% × 160px)           |
| `TextLine`            | Single line text placeholder (70% × 1.25rem) |
| `Button`              | Button-sized skeleton (120px × 40px)         |
| `Avatar`              | Circular avatar skeleton (48px × 48px)       |
| `Multiple`            | Stack of 3 skeleton lines                    |
| `CardGridDefault`     | 6-card grid with loading label               |
| `CardGridThree`       | 3-card grid                                  |
| `CardGridTwelve`      | 12-card grid                                 |
| `CardGridBengali`     | Grid with Bengali loading label              |
| `CardGridInContainer` | Grid in constrained container                |

**Accessibility:** `aria-hidden="true"` on decorative skeletons; `role="status" aria-live="polite" aria-busy="true"` on card grid

---

### ThemeToggle

**File:** `src/components/ThemeToggle.stories.tsx`  
**Stories:** 5

| Story             | Description                     |
| ----------------- | ------------------------------- |
| `LightMode`       | Default state in light theme    |
| `DarkMode`        | Component in dark theme context |
| `CustomAriaLabel` | Custom accessibility label      |
| `MultipleToggles` | Multiple synchronized toggles   |
| `InToolbar`       | Embedded in a toolbar layout    |

**Accessibility:** `aria-label`, `aria-pressed` bound to theme state, focus-visible outline

**Decorators:** Wrapped in `ThemeProvider` for functional toggle

---

### AccountMenu

**File:** `src/components/AccountMenu.stories.tsx`  
**Stories:** 6

| Story           | Description                            |
| --------------- | -------------------------------------- |
| `Anonymous`     | Logged out: shows Login/Register links |
| `Authenticated` | Logged in: shows email + dropdown menu |
| `LongEmail`     | Tests email truncation/overflow        |
| `Bengali`       | Bengali language locale                |
| `Loading`       | Session restoring (returns null)       |
| `MenuOpen`      | Interactive test with open dropdown    |

**Accessibility:** Disclosure pattern with `aria-expanded`, `aria-controls`, Escape key closes menu, focus returns to trigger

**Decorators:** Wrapped in `AuthProvider` (mocked), `LanguageProvider`, `MemoryRouter`

---

### AuthFormField

**File:** `src/components/AuthFormField.stories.tsx`  
**Stories:** 11

| Story              | Description                         |
| ------------------ | ----------------------------------- |
| `Default`          | Email field with placeholder        |
| `Password`         | Password field                      |
| `WithError`        | Field with validation error         |
| `WithHint`         | Field with helper text              |
| `ErrorAndHint`     | Combined error + hint               |
| `Disabled`         | Disabled readonly field             |
| `ConfirmPassword`  | Confirm password field              |
| `CustomClass`      | Custom CSS class                    |
| `Bengali`          | Bengali label                       |
| `BengaliWithError` | Bengali label with error            |
| `FormLayout`       | Multiple fields in form arrangement |

**Accessibility:** `aria-invalid`, `aria-describedby` linking error/hint, required attribute, `useId` for unique IDs

---

### AuthCard

**File:** `src/components/AuthCard.stories.tsx`  
**Stories:** 7

| Story          | Description                                 |
| -------------- | ------------------------------------------- |
| `LoginCard`    | Login form layout                           |
| `RegisterCard` | Registration form layout                    |
| `WithAlert`    | Form-level error alert                      |
| `EmptyAlert`   | Alert rendered but empty (focus management) |
| `LongContent`  | Password reset flow                         |
| `Bengali`      | Full Bengali content                        |
| `DarkMode`     | Dark theme variant                          |

**Accessibility:** `AuthAlert` uses `role="alert" tabIndex={-1}` for focus management; `AuthCard` uses `motion.section` with reduced-motion support

---

### SearchAutocomplete

**File:** `src/components/SearchAutocomplete.stories.tsx`  
**Stories:** 10

| Story               | Description                        |
| ------------------- | ---------------------------------- |
| `Default`           | Empty initial state                |
| `WithValue`         | Pre-filled search value            |
| `WithPlaceholder`   | Custom placeholder text            |
| `Bengali`           | Bengali placeholder and aria-label |
| `CustomDebounce`    | 300ms debounce, min 3 chars        |
| `Interactive`       | Live demo with mock callbacks      |
| `MinQueryOne`       | Minimum query length = 1           |
| `CustomAriaLabel`   | Custom accessible label            |
| `ReadOnly`          | Display-only with value            |
| `MultipleInstances` | Two independent search inputs      |

**Accessibility:** Combobox pattern with `aria-autocomplete="list"`, `aria-controls`, `aria-expanded`, `aria-activedescendant`, keyboard navigation (ArrowUp/Down, Enter, Escape), live regions for loading/status

---

### FilterPanel

**File:** `src/components/FilterPanel.stories.tsx` (converted from .js with enhanced controls)  
**Stories:** 15

| Story                         | Description                                    |
| ----------------------------- | ---------------------------------------------- |
| `Expanded`                    | Fully expanded panel with bank filters         |
| `Collapsed`                   | Collapsed panel (default state)                |
| `ByAnnualFee`                 | Pre-filtered by annual fee range               |
| `ByInterestRate`              | Pre-filtered by interest rate range            |
| `ByLoungeAccess`              | Lounge access filter active                    |
| `ByFeatures`                  | Features filter active                         |
| `FullPanel`                   | All filters populated                          |
| `Interactive`                 | Live demo with filter change logging           |
| `Bengali`                     | Bengali language with localized bank names     |
| `WithValidationError`         | Demonstrates invalid range format validation   |
| `WithStringRange`             | Annual fee using string range format (min,max) |
| `WithInterestRateStringRange` | Interest rate using string range format        |
| `Mobile`                      | Mobile viewport (375px)                        |
| `Desktop`                     | Desktop viewport (1200px)                      |
| `DarkMode`                    | Dark theme variant                             |

**Accessibility:** Section with `aria-labelledby`, collapsible with `aria-expanded`/`aria-controls`, proper label/input associations, error `role="alert"`, keyboard-navigable inputs

**Controls:** `banks` (object), `onFilterChange` (action), `initialFilters` (object) with full CardFilterOptions support

---

### ComparisonBar

**File:** `src/components/ComparisonBar.stories.tsx` (converted from .js with enhanced controls)  
**Stories:** 15

| Story                        | Description                                 |
| ---------------------------- | ------------------------------------------- |
| `Empty`                      | No cards selected (renders null)            |
| `OneCard`                    | Single card, compare disabled               |
| `TwoCards`                   | Two cards, compare enabled                  |
| `ThreeCards`                 | Three cards selected                        |
| `FourCards`                  | Maximum cards (4) selected                  |
| `FiveCardsMaxFive`           | Five cards with maxSelections=5             |
| `Interactive`                | Live demo with removal logging              |
| `WithNullValues`             | Cards with null fee/APR values              |
| `LongCardName`               | Tests card name truncation                  |
| `Mobile`                     | Mobile viewport (375px)                     |
| `DarkMode`                   | Dark theme variant                          |
| `ReducedMotionNote`          | Documents reduced-motion support            |
| `CustomMaxSelections`        | Custom maxSelections=3                      |
| `RemoveInteraction`          | Tests card removal with log                 |
| `CompareDisabledInteraction` | Tests compare click with insufficient cards |

**Accessibility:** `aria-label` on remove buttons, `aria-disabled` on compare link, live region for messages, reduced-motion support via `usePrefersReducedMotion`

**Controls:** `selectedCards` (array), `onRemoveCard` (action), `maxSelections` (number 1-5)

---

### CardListItem

**File:** `src/components/CardListItem.stories.js` (existing) + `src/components/CardListItem.null-stories.tsx` (new)  
**Stories:** 19 (4 existing + 15 new)

#### Existing Stories

| Story           | Description                    |
| --------------- | ------------------------------ |
| `Selected`      | Card in selected state         |
| `NoImage`       | Card without images            |
| `NoFeatures`    | Empty additionalFeatures array |
| `SingleFeature` | One feature only               |

#### Null State Stories (New)

| Story                 | Description                                    |
| --------------------- | ---------------------------------------------- |
| `NullAnnualFee`       | `annualFee: null` → "Data not available"       |
| `NullInterestRate`    | `interestRateApr: null` → "Data not available" |
| `BothNull`            | Both fee and APR null                          |
| `NullLoungeAccess`    | Both lounge fields null                        |
| `AllNull`             | All nullable fields null                       |
| `ZeroAnnualFee`       | `annualFee: 0` → "BDT 0" (distinct from null)  |
| `EmptyStringLounge`   | Empty string lounge → "None"                   |
| `MissingBankInfo`     | Missing `bankId` and `bankName`                |
| `NullRewards`         | Empty rewardPointsPolicy                       |
| `EmptyFeatures`       | Empty additionalFeatures array                 |
| `NullFeatures`        | `additionalFeatures: null`                     |
| `NullWaiverPolicy`    | `annualFeeWaiverPolicy: null`                  |
| `NullImages`          | `images: null`                                 |
| `EmptyImages`         | `images: []`                                   |
| `SelectableWithNulls` | Selectable card with null fee/APR              |

**Accessibility:** Proper heading structure, semantic HTML, reduced-motion animations

---

### CardList

**File:** `src/components/CardList.stories.js` (existing)  
**Stories:** 4

| Story           | Description                      |
| --------------- | -------------------------------- |
| `WithSelection` | 3 cards with one selected        |
| `Empty`         | Empty state message              |
| `SingleCard`    | Single card display              |
| `ManyCards`     | 7 cards with load more indicator |

---

### CardDetailsPopup

**File:** `src/components/CardDetailsPopup.stories.js` (existing)  
**Stories:** 4

| Story              | Description                  |
| ------------------ | ---------------------------- |
| `WithGallery`      | Card with multiple images    |
| `WithoutImages`    | Card without images          |
| `NullAnnualFee`    | Card with `annualFee: null`  |
| `NullLoungeAccess` | Card with null lounge access |

---

### CardComparisonTable

**File:** `src/components/CardComparisonTable.stories.js` (existing)  
**Stories:** 3

| Story                 | Description                            |
| --------------------- | -------------------------------------- |
| `SingleCard`          | One card, no differences possible      |
| `TwoCardsDifferences` | Two cards with differences highlighted |
| `TwoCardsSame`        | Two identical cards                    |

---

### CategoryCard

**File:** `src/components/CategoryCard.stories.js` (existing)  
**Stories:** 6

| Story         | Description                     |
| ------------- | ------------------------------- |
| `Travel`      | Travel category with plane icon |
| `Cashback`    | Cashback category               |
| `Premium`     | Premium category                |
| `Student`     | Student category                |
| `Business`    | Business category               |
| `NoAnnualFee` | No fee category                 |

---

## Pages

### LoginPage

**File:** `src/pages/LoginPage.stories.tsx`  
**Stories:** 8

| Story            | Description                                  |
| ---------------- | -------------------------------------------- |
| `Default`        | Empty form, initial state                    |
| `WithReturnUrl`  | Redirect state from `/compare`               |
| `PrefilledEmail` | Documents default state                      |
| `Bengali`        | Full Bengali localization                    |
| `FailedLogin`    | 401 error on submit (use `fail@example.com`) |
| `NetworkError`   | Network failure simulation                   |
| `Submitting`     | Slow login (5s) showing loading state        |
| `DarkMode`       | Dark theme variant                           |

**Mocked Auth:** Uses `AuthProvider` with test double client supporting success, 401, and network error scenarios

---

### RegisterPage

**File:** `src/pages/RegisterPage.stories.tsx`  
**Stories:** 8

| Story                | Description                                      |
| -------------------- | ------------------------------------------------ |
| `Default`            | Empty registration form                          |
| `Bengali`            | Full Bengali localization                        |
| `FailedRegistration` | 400 error (email exists, use `fail@example.com`) |
| `NetworkError`       | Network failure simulation                       |
| `PasswordMismatch`   | Validation error on confirm                      |
| `Submitting`         | Slow registration (5s)                           |
| `DarkMode`           | Dark theme variant                               |
| `WithValidation`     | Documents validation behavior                    |

---

### ExperimentResults

**File:** `src/pages/ExperimentResults/ExperimentResults.stories.tsx`  
**Stories:** 9

| Story                   | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `Enabled`               | Requires `REACT_APP_EXPERIMENTS_RESULTS_VIEW=true` |
| `Disabled`              | Empty state with methodology legend                |
| `SignificantResults`    | Treatment wins with p < 0.05                       |
| `HarmDetected`          | Guardrail triggered (treatment worse)              |
| `CollectingData`        | Below minimum sample size                          |
| `RunningNotSignificant` | Min sample met, not significant                    |
| `MultipleExperiments`   | Grid of 3 experiment cards                         |
| `DarkMode`              | Dark theme dashboard                               |
| `LegendOnly`            | Methodology reference                              |

**Accessibility:** Tables with proper headers, status badges with semantic colors, live regions for dynamic updates, keyboard-accessible details/summary

---

## Global Configuration

### Themes (Toolbar)

- **Light** (default): `data-theme="light"` / default CSS variables
- **Dark**: `data-theme="dark"` with inverted color tokens

### Locales (Toolbar)

- **English** (`en`): Default language
- **Bengali** (`bn`): বাংলা translations via `LanguageProvider`

### Viewports

- Mobile 375px / 414px
- Tablet 768px (default)
- Desktop 1200px

### Backgrounds

- Light (`#ffffff`)
- Dark (`#1a1a2e`)
- Gray (`#f5f5f5`)

### Reduced Motion

Components respect `prefers-reduced-motion` via `usePrefersReducedMotion()` hook. Stories testing animation behavior:

- `Toast` → `Rapid Changes`
- `ThemeToggle` → Toggle animation
- `ComparisonBar` → Card chip animations
- `CardListItem` → Hover/tap variants
- `AuthCard` → Entrance animation
- `ExperimentResults` → Card entrance

---

## Running Storybook

```bash
# Development server
npm run storybook

# Production build (outputs to random directory)
npm run build-storybook -- -o /tmp/storybook-build-$(date +%s)
```

---

## Story Count Summary

| Category                 | Files  | Stories |
| ------------------------ | ------ | ------- |
| Components (existing)    | 7      | 27      |
| Components (new/updated) | 9      | 81      |
| Pages (new)              | 3      | 25      |
| **Total**                | **19** | **133** |

**New/updated stories in this round:** 106+ (well exceeding the 30+ target)

---

## Notes

- All stories include `tags: ['autodocs']` for automatic documentation generation
- A11y addon configured with `manualAddonSteps: false` for automated checks
- Mock providers (`AuthProvider`, `LanguageProvider`, `ThemeProvider`) used for page-level stories
- No new dependencies installed; all stories use existing project infrastructure
- Stories follow CSF3 (Component Story Format 3) with `export default` meta and named exports
- FilterPanel and ComparisonBar converted from JavaScript to TypeScript with enhanced argTypes and controls
- Light/dark theme decorator and reduced-motion notes included for all new stories
