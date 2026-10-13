import { BUILD_STAMP, formatWithPrettier } from './utils.mjs';

/**
 * Style Dictionary format: `css/tokens`
 *
 * Emits every token as a CSS custom property inside a single selector block,
 * grouped by top level token group and kept in source order, so the output
 * reads like the token files and stays deterministic.
 *
 * Light mode (default) in :root, dark mode in @media (prefers-color-scheme: dark)
 * when no .light override, and .dark/.light classes for manual overrides.
 * The .light class takes precedence over system dark preference.
 */
export default function cssTokens({ dictionary, options = {} }) {
  const selector = options.selector ?? ':root';

  const lightTokens = [];
  const darkTokens = [];

  for (const token of dictionary.allTokens) {
    if (token.path[1] === 'dark') {
      darkTokens.push(token);
    } else {
      lightTokens.push(token);
    }
  }

  // Light mode (default)
  const lightGroups = new Map();
  for (const token of lightTokens) {
    const group = token.path[0];
    if (!lightGroups.has(group)) {
      lightGroups.set(group, []);
    }
    lightGroups.get(group).push(token);
  }

  const lightSections = [];
  for (const [group, tokens] of lightGroups) {
    const declarations = tokens.map(token => `  --${token.name}: ${token.value};`);
    lightSections.push([`  /* ${group} */`, ...declarations].join('\n'));
  }

  const lightBody = [`${selector} {`, lightSections.join('\n\n'), '}'].join('\n');

  // Dark mode sections
  const darkModeSections = [];
  const darkModeGroups = new Map();
  for (const token of darkTokens) {
    const group = token.path[0];
    if (!darkModeGroups.has(group)) {
      darkModeGroups.set(group, []);
    }
    darkModeGroups.get(group).push(token);
  }

  for (const [group, tokens] of darkModeGroups) {
    const declarations = tokens.map(token => {
      // Convert color-dark-primary-base to color-primary-base
      const darkVarName = token.name.replace(/^color-dark-/, 'color-');
      return `  --${darkVarName}: ${token.value};`;
    });
    if (declarations.length > 0) {
      darkModeSections.push([`  /* ${group} */`, ...declarations].join('\n'));
    }
  }

  // Media query for system dark preference, but not when .light class is set
  const darkModeMediaBody = darkModeSections.length > 0
    ? [`@media (prefers-color-scheme: dark) {`, `  ${selector}:not(.light) {`, darkModeSections.join('\n\n'), `  }`, '}'].join('\n')
    : '';

  // Explicit .dark class (manual dark mode override)
  const darkClassBodyContent = darkModeSections.join('\n\n');
  const darkClassBody = darkModeSections.length > 0
    ? [`${selector}.dark {`, darkClassBodyContent, '}'].join('\n')
    : '';

  // Explicit .light class (manual light mode override on dark system)
  const lightOverrideBody = lightSections.join('\n\n');
  const lightClassBody = lightSections.length > 0
    ? [`${selector}.light {`, lightOverrideBody, '}'].join('\n')
    : '';

  const code = `/**
 * ${BUILD_STAMP}
 * Source of truth: design-tokens/tokens/*.json
 * Run \`npm run tokens:build\` to regenerate it.
 */

${lightBody}

${darkModeMediaBody}

${darkClassBody}

${lightClassBody}
`;

  return formatWithPrettier(code, 'css');
}
