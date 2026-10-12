import { mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import cssTokensFormat from './design-tokens/formats/css-tokens.mjs';
import figmaTokensFormat from './design-tokens/formats/figma-tokens.mjs';
import typescriptTokensFormat from './design-tokens/formats/typescript-tokens.mjs';

/**
 * Style Dictionary configuration for the CreditMate AI design token system.
 *
 *   npm run tokens:build    generate all outputs
 *   npm run tokens:clean    delete generated outputs
 *   npm run tokens:check    rebuild into a temp dir and diff against the
 *                           committed outputs (reproducibility guard)
 *
 * This file must stay `.mjs`: Style Dictionary 4+ is ESM only, while the CRA
 * `package.json` has to remain CommonJS.
 */

const here = dirname(fileURLToPath(import.meta.url));
const tokenDir = join(here, 'design-tokens', 'tokens');

/**
 * Source files are listed explicitly (and sorted) rather than globbed so the
 * generated output is byte-for-byte reproducible regardless of filesystem
 * ordering. Adding a new token file requires no config change beyond living
 * in `design-tokens/tokens/*.json`.
 */
const source = readdirSync(tokenDir)
  .filter(entry => entry.endsWith('.json'))
  .sort()
  .map(entry => join(tokenDir, entry));

if (source.length === 0) {
  throw new Error(`No design token files found in ${tokenDir}`);
}

export default {
  log: { verbosity: 'default' },
  source,
  hooks: {
    formats: {
      'css/tokens': cssTokensFormat,
      'typescript/tokens': typescriptTokensFormat,
      'figma/tokens': figmaTokensFormat,
    },
  },
  platforms: {
    css: {
      // Name transform only: `token.name` becomes the full kebab path
      // (`color-blue-50`). No value transforms are applied so px, rgba and hex
      // values reach the output exactly as authored.
      transforms: ['name/kebab'],
      buildPath: 'src/styles/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/tokens',
          options: { selector: ':root' },
        },
      ],
    },
    typescript: {
      transforms: ['name/kebab'],
      buildPath: 'src/styles/',
      files: [
        {
          destination: 'tokens.ts',
          format: 'typescript/tokens',
        },
      ],
    },
    figma: {
      transforms: ['name/kebab'],
      buildPath: 'design-tokens/build/',
      files: [
        {
          destination: 'figma.tokens.json',
          format: 'figma/tokens',
          options: { setName: 'global' },
        },
      ],
    },
  },
};

/**
 * Returns a copy of the config with every platform redirected to a temporary
 * directory. Used by `scripts/verify-tokens.mjs` to rebuild into a scratch
 * location and diff the result against the committed artifacts without ever
 * touching them.
 */
export function toTempBuildPath(config, tempDir) {
  const redirected = Object.fromEntries(
    Object.entries(config.platforms).map(([name, platform]) => {
      const destination = join(tempDir, name, platform.buildPath);
      mkdirSync(destination, { recursive: true });
      return [name, { ...platform, buildPath: destination }];
    })
  );

  return { ...config, platforms: redirected };
}
