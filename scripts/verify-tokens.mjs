#!/usr/bin/env node
/**
 * Reproducibility guard for the design token build.
 *
 * Rebuilds every Style Dictionary platform into a scratch directory and
 * compares the result byte-for-byte with the artifacts committed in the
 * repository. Exits non-zero when they differ, which catches:
 *
 *   - hand edits to generated files
 *   - a stale `src/styles/tokens.ts` / `tokens.css`
 *   - non-deterministic ordering in the token sources
 *
 * Run with: npm run tokens:check
 */

import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import StyleDictionary from 'style-dictionary';

import config, { toTempBuildPath } from '../style-dictionary.config.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Absolute location of a generated artifact inside the project. */
function committedPath(platform, file) {
  return join(projectRoot, platform.buildPath, file.destination);
}

function read(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

function firstDifference(expected, actual) {
  const expectedLines = expected.split('\n');
  const actualLines = actual.split('\n');
  const total = Math.max(expectedLines.length, actualLines.length);

  for (let i = 0; i < total; i += 1) {
    if (expectedLines[i] !== actualLines[i]) {
      return {
        line: i + 1,
        committed: expectedLines[i] ?? '<missing>',
        generated: actualLines[i] ?? '<missing>',
      };
    }
  }
  return null;
}

const tempRoot = mkdtempSync(join(tmpdir(), 'design-tokens-'));
let failures = 0;

try {
  const scratch = toTempBuildPath(config, tempRoot);
  const dictionary = new StyleDictionary(scratch, { verbosity: 'silent' });
  await dictionary.buildAllPlatforms();

  for (const [platformName, platform] of Object.entries(config.platforms)) {
    for (const file of platform.files) {
      const committed = committedPath(platform, file);
      const generated = join(tempRoot, platformName, platform.buildPath, file.destination);
      const label = relative(projectRoot, committed);

      const committedContents = read(committed);
      const generatedContents = read(generated);

      if (committedContents === null) {
        failures += 1;
        console.error(`✗ ${label}\n    committed file is missing - run \`npm run tokens:build\``);
        continue;
      }
      if (generatedContents === null) {
        failures += 1;
        console.error(`✗ ${label}\n    Style Dictionary did not produce a file for this entry`);
        continue;
      }
      if (committedContents !== generatedContents) {
        failures += 1;
        const difference = firstDifference(committedContents, generatedContents);
        const detail = difference
          ? `first difference at line ${difference.line}:\n` +
            `      committed: ${JSON.stringify(difference.committed)}\n` +
            `      generated: ${JSON.stringify(difference.generated)}`
          : 'contents differ';
        console.error(
          `✗ ${label}\n    ${detail}\n    run \`npm run tokens:build\` and commit the result`
        );
        continue;
      }

      const bytes = statSync(generated).size;
      console.log(`✓ ${label} (${bytes} bytes, reproducible)`);
    }
  }
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n${failures} generated file(s) out of sync with design-tokens/tokens/*.json`);
  process.exit(1);
}

console.log('\nAll generated design token outputs are reproducible.');
