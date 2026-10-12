import { BUILD_STAMP, formatWithPrettier, nestTokens, unquoteKeys } from './utils.mjs';

/**
 * Style Dictionary format: `typescript/tokens`
 *
 * Emits `src/styles/tokens.ts` with:
 *  - one `export const` per token group (`color`, `spacing`, ...)
 *  - a combined `tokens` object
 *  - a `cssVars` map keyed by the exact custom property names emitted in
 *    `src/styles/tokens.css`, plus a type safe `cssVar()` helper
 */
export default function typescriptTokens({ dictionary }) {
  const nested = nestTokens(dictionary.allTokens);
  const groups = Object.keys(nested);

  const groupExports = groups
    .map(
      group =>
        `export const ${group} = ${unquoteKeys(JSON.stringify(nested[group], null, 2))} as const;`
    )
    .join('\n\n');

  const tokensExport = `export const tokens = {\n${groups
    .map(group => `  ${group},`)
    .join('\n')}\n} as const;`;

  const typeExports = [
    `export type DesignTokens = typeof tokens;`,
    ...groups.map(
      group =>
        `export type ${group[0].toUpperCase()}${group.slice(1)}Tokens = typeof tokens.${group};`
    ),
  ].join('\n');

  const cssVars = {};
  for (const token of dictionary.allTokens) {
    cssVars[`--${token.name}`] = token.value;
  }
  const cssVarsExport = `export const cssVars = ${JSON.stringify(cssVars, null, 2)} as const;`;

  const helper = `/**
 * Reference a design token as a CSS custom property.
 *
 * @example cssVar('--color-primary-base') // 'var(--color-primary-base)'
 */
export function cssVar(name: keyof typeof cssVars): string {
  return \`var(\${name})\`;
}`;

  const code = [
    `/**`,
    ` * ${BUILD_STAMP}`,
    ` * Source of truth: design-tokens/tokens/*.json`,
    ` * Run \`npm run tokens:build\` to regenerate it.`,
    ` */`,
    ``,
    groupExports,
    ``,
    tokensExport,
    ``,
    typeExports,
    ``,
    cssVarsExport,
    ``,
    helper,
    ``,
  ].join('\n');

  return formatWithPrettier(code, 'typescript');
}
