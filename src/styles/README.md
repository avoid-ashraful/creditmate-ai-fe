# Styling — design tokens are the single source of truth

All styling in this app is driven by **design tokens**. There is exactly one
customisation path:

1. Edit the token sources in `design-tokens/tokens/*.json`.
2. Run `npm run tokens:build` to regenerate `src/styles/tokens.css` and
   `src/styles/tokens.ts` (never edit those generated files by hand;
   `npm run tokens:check` verifies they are reproducible).
3. Consume tokens in CSS as `var(--color-…)`, `var(--spacing-…)`,
   `var(--radius-…)`, `var(--motion-…)`, etc., or in TS via the generated
   `tokens.ts`.

## Rules (enforced)

- **No raw values in component styles.** Hex colours, `rgb()`/`rgba()`/
  `hsl()` literals, off-scale breakpoints, raw pixel spacing, and
  `transition: all` are banned in the foundation zones
  (`src/components/ui/**`, `src/components/shell/**`) and ratcheted against a
  baseline everywhere else. Run `npm run check-styles` (also part of
  `npm run check:all` and CI). See `LINTING.md` for the baseline workflow.
- **Breakpoints** come from the token scale only: 480 / 768 / 1024 / 1280px
  (`--breakpoint-sm/md/lg/xl`). CSS media queries cannot read variables, so
  use those literal values — the checker rejects any other width.
- **Motion** uses the `--motion-*` tokens (durations + easings). Animate only
  `transform` and `opacity`; honour `prefers-reduced-motion`.
- **Shared components** live in `src/components/ui/` (primitives and product
  components) with the `cm-` class prefix. A page may not ship a bespoke
  variant of a shared component.
- **Dark mode** works through semantic tokens (`--color-background-surface`,
  `--color-text-primary`, …) which flip under `:root.dark`. Never hard-code a
  surface colour.

## History

Before the Phase 0 redesign foundation, styling had three competing
authorities: the token pipeline, legacy aliases in `App.css`, and a
styled-components file with its own hard-coded palette (this README used to
point there). The aliases and the styled-components shell were deleted in
Phase 0; the token pipeline above is what remains.
