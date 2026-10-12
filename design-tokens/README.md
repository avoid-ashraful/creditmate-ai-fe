# Design tokens

Single source of truth for the CreditMate AI visual language: colours, spacing,
typography, radii, shadows and transitions.

Everything here is authored as plain JSON and compiled by
[Style Dictionary](https://styledictionary.com/) into three build outputs that
are committed to the repository:

| Output                | Path                                    | Consumed by                      |
| --------------------- | --------------------------------------- | -------------------------------- |
| CSS custom properties | `src/styles/tokens.css`                 | stylesheets, `styled-components` |
| TypeScript constants  | `src/styles/tokens.ts`                  | components, tests, Storybook     |
| Tokens Studio (Figma) | `design-tokens/build/figma.tokens.json` | Figma via _Sync → Import JSON_   |

## Commands

```bash
npm run tokens:build   # regenerate all three outputs
npm run tokens:check   # rebuild into a temp dir and diff against the committed outputs
npm run tokens:clean   # delete the generated outputs
```

`tokens:check` is the reproducibility guard: it fails (exit 1) if a generated
file has been hand-edited, is stale, or if generation became non-deterministic.

## Layout

```
design-tokens/
├── tokens/                  # SOURCE OF TRUTH — edit these
│   ├── color.json           # palettes + semantic colours + gradients
│   ├── spacing.json         # 4px base scale
│   ├── typography.json      # families, sizes, weights, line heights, tracking
│   ├── radius.json
│   ├── shadow.json
│   └── transition.json      # durations, easings, properties, ready-made shorthands
├── formats/                 # Style Dictionary output formats (ESM)
│   ├── css-tokens.mjs       #   css/tokens
│   ├── typescript-tokens.mjs#   typescript/tokens
│   ├── figma-tokens.mjs     #   figma/tokens
│   ├── shadow.mjs           #   CSS box-shadow → Tokens Studio object
│   └── utils.mjs
├── build/figma.tokens.json  # GENERATED — do not edit
└── README.md
```

The Style Dictionary configuration lives at the project root:
`style-dictionary.config.mjs`. It is **`.mjs` on purpose** — Style Dictionary 4
is ESM-only while the Create React App `package.json` must stay CommonJS, so the
config file (and the formats) are explicit ES modules.

Source files are discovered with a sorted `readdirSync`, so adding a new
`design-tokens/tokens/*.json` file needs no config change and cannot introduce
filesystem-ordering drift.

## Usage

### In CSS / SCSS

`src/styles/tokens.css` is imported once in `src/index.tsx`, so every custom
property is available on `:root`.

```css
.card {
  padding: var(--spacing-lg);
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: var(--transition-preset-shadow);
}
```

### In TypeScript / styled-components

```ts
import { cssVar, spacing, tokens } from './styles/tokens';

const spacingLg = spacing.lg; // '24px'
const primary = tokens.color.primary.base; // '#2563eb'

styled.div`
  padding: ${cssVar('--spacing-lg')}; // 'var(--spacing-lg)'
  color: ${tokens.color.text.primary};
`;
```

`tokens.ts` exports:

- `color`, `spacing`, `typography`, `radius`, `shadow`, `transition` — nested
  constant objects, `as const` so the literal types are preserved.
- `tokens` — the same groups combined.
- `cssVars` — a record keyed by the **exact** custom property names emitted in
  `tokens.css`, and `cssVar(name)` which wraps a key in `var(...)`.
- `ColorTokens`, `SpacingTokens`, … — types for component props.

Prefer the CSS variables in stylesheets and the constants when you need a value
in JavaScript (comparisons, inline styles, tests).

### In Figma

1. Figma → _Plugins_ → **Tokens Studio for Figma**.
2. _Sync_ → _Add New Set_ → format **JSON** → paste or point at
   `design-tokens/build/figma.tokens.json`.
3. _Sync_ / _Push_ to import the `global` set.

Token types are mapped to the plugin's vocabulary (`color`, `spacing`,
`fontSizes`, `boxShadow`, …). Two types need conversion because Figma cannot
consume the CSS form:

- **Shadows** are emitted as structured `{ x, y, blur, spread, color, type }`
  objects (arrays for multi-layer shadows) because the plugin cannot parse a
  CSS `box-shadow` string.
- **Letter spacing** is emitted in `percent` rather than `em`. Tokens Studio
  can _store_ an `em` letter-spacing token but cannot apply it to a text node
  ([docs](https://docs.tokens.studio/manage-tokens/token-types/typography/letter-spacing)),
  and 1em is 100% of the font size, so `-0.025em` becomes `-2.5%`. The CSS and
  TypeScript outputs keep the authored `em` values.

Comma-separated font-family fallback stacks _are_ supported by the plugin, so
they are passed through verbatim. Gradients are CSS `linear-gradient()` strings
and are exported as generic `other` tokens — they document the gradients but
need manual stops in Figma.

## Token reference

### Spacing — 4px base scale

| Token          | Value  | Token         | Value  |
| -------------- | ------ | ------------- | ------ |
| `spacing.none` | `0`    | `spacing.xl`  | `32px` |
| `spacing.2xs`  | `2px`  | `spacing.2xl` | `48px` |
| `spacing.xs`   | `4px`  | `spacing.3xl` | `64px` |
| `spacing.sm`   | `8px`  | `spacing.4xl` | `96px` |
| `spacing.md`   | `16px` |               |        |
| `spacing.lg`   | `24px` |               |        |

Every step except `none` and `2xs` is a multiple of 4px.

### Colours

Semantic groups (each with `base` and, where useful, `hover`, `active`,
`subtle`, `border` and `contrast`):

| Group             | Base      | Notes                                       |
| ----------------- | --------- | ------------------------------------------- |
| `color.primary`   | `#2563eb` | brand / interactive                         |
| `color.secondary` | `#0f172a` | dark chrome: header, footer, comparison bar |
| `color.success`   | `#10b981` |                                             |
| `color.warning`   | `#f59e0b` | `contrast` is dark (`#78350f`) for AA       |
| `color.error`     | `#ef4444` |                                             |
| `color.info`      | `#0ea5e9` |                                             |

Surfaces and content:

- `color.background` — `base`, `surface`, `elevated`, `muted`, `inverse`, `overlay`
- `color.text` — `primary`, `secondary`, `tertiary`, `disabled`, `inverse`,
  `inverseSecondary`, `link`, `linkHover`, `onPrimary`
- `color.border` — `base`, `strong`, `subtle`, `focus`, `error`
- `color.state` — `hoverSurface`, `selectedSurface`, `disabledSurface`, `disabledBorder`
- `color.gradient` — `brand`, `header`, `primaryButton`, `accentButton`, `footer`,
  `background`, `cardAccent`

Primitive ramps live under `color.blue`, `indigo`, `sky`, `emerald`, `amber`,
`red` and `slate` (`50` → `900`, five hundred = the semantic base). Semantic
tokens reference the ramps with `{color.blue.500}`-style aliases, so a ramp edit
propagates to every derived value.

### Typography

- `typography.fontFamily.sans` / `.mono` — matches the stack already used in
  `src/styles/index.css`.
- `typography.fontSize` — `xs 12` → `5xl 48`, body is `md 16px`.
- `typography.fontWeight` — `regular 400`, `medium 500`, `semibold 600`, `bold 700`.
- `typography.lineHeight` — `none 1`, `tight 1.25`, `snug 1.375`, `normal 1.5`,
  `relaxed 1.625`, `loose 2` (unitless).
- `typography.letterSpacing` — `tight`, `normal`, `wide`, `wider`.

### Radius, shadow, transition

- `radius` — `none 0`, `sm 4px`, `md 6px`, `lg 8px`, `xl 16px`, `2xl 24px`,
  `full 9999px`.
- `shadow` — `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `inner`, `focus`,
  `focusError`, `primaryGlow`, `primaryGlowStrong`.
- `transition` — `duration` (`instant`…`slower`), `easing` (`linear`…`easeInOut`),
  `property`, and ready-made `preset` shorthands.

## Design decisions

**Prettier runs inside the build.** Every format returns
`prettier.format(...)` output resolved from the project `.prettierrc`, so the
generated files are byte-identical to what `npm run check-format` expects. There
is no need to `.prettierignore` generated code, and `npm run tokens:build`
always leaves the tree clean.

**No value transforms.** Platforms use `transforms: ['name/kebab']` only, so px,
rgba and hex values reach the output exactly as authored.

**Source order, not alphabetical.** Ramps publish as `xs, sm, md, …` and
`50, 100, 200, …`.

**No group-level `$type`.** Style Dictionary 4's default JSON parser switches to
DTCG syntax when it sees `$type` on a group and then silently produces zero
tokens. Every token therefore declares its own `type`.

## Overlap with the legacy `:root` block

`src/styles/App.css` still declares a hand-written `:root` block
(`--primary-color`, `--card-bg`, `--spacing-*`, `--radius-*`, `--shadow-*`,
`--font-sans`, …) that the existing pages consume through `var(...)`. It is
bundled **after** `src/styles/tokens.css`, so it currently wins the cascade for
the names they share.

Twelve names are shared. Where they overlap, the generated values have been set
to exactly the values the app already renders with (`--spacing-*`, `--radius-sm/md/lg`,
`--shadow-sm/md/lg`), so **importing the tokens cannot change the UI** regardless
of cascade order. `src/styles/tokens.test.ts` fails if they ever disagree.

Recommended follow-up (not part of this task): delete the legacy block and
migrate `var(--primary-color)` → `var(--color-primary-base)` etc. component by
component, then remove the parity test.

## Adding a token

1. Edit (or add) `design-tokens/tokens/<group>.json`, giving the token a `value`,
   a `type` (any DTCG type; `figmaType()` in `formats/utils.mjs` maps it to the
   Tokens Studio name) and a `comment` describing intent.
2. `npm run tokens:build`
3. `npm run tokens:check && npm run check-types && npm run check-lint`
4. Commit the JSON **and** the three regenerated outputs together.
