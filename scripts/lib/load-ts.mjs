/**
 * Lets Node load TypeScript modules from src/ so build scripts can reuse the
 * app's own data and helpers (guides, categories, sitemap logic) without a
 * second copy. Files are transpiled in memory with the `typescript` package
 * that the project already depends on. Nothing is written to disk.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';

import ts from 'typescript';

const require = createRequire(import.meta.url);

const compilerOptions = {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2019,
  esModuleInterop: true,
};

// Registering the handler makes `require('./x')` find `./x.ts` too, so
// transpiled modules can import each other as they do in the app.
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions, fileName: filename });
  module._compile(outputText, filename);
};

export const loadTsModule = absolutePath => require(absolutePath);
