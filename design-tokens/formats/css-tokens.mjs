import { BUILD_STAMP, formatWithPrettier } from './utils.mjs';

/**
 * Style Dictionary format: `css/tokens`
 *
 * Emits every token as a CSS custom property inside a single selector block,
 * grouped by top level token group and kept in source order, so the output
 * reads like the token files and stays deterministic.
 */
export default function cssTokens({ dictionary, options = {} }) {
  const selector = options.selector ?? ':root';

  const groups = new Map();
  for (const token of dictionary.allTokens) {
    const group = token.path[0];
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group).push(token);
  }

  const sections = [];
  for (const [group, tokens] of groups) {
    const declarations = tokens.map(token => `  --${token.name}: ${token.value};`);
    sections.push([`  /* ${group} */`, ...declarations].join('\n'));
  }

  const body = [`${selector} {`, sections.join('\n\n'), '}'].join('\n');

  const code = `/**
 * ${BUILD_STAMP}
 * Source of truth: design-tokens/tokens/*.json
 * Run \`npm run tokens:build\` to regenerate it.
 */

${body}
`;

  return formatWithPrettier(code, 'css');
}
