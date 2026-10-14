/**
 * Shared input for the funnel scripts (task 10.2): reads the funnel definition and an
 * events export (CSV or JSON), and returns them parsed by src/utils/funnel.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadTsModule } from './load-ts.mjs';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const defaultFunnelPath = path.join(repoRoot, 'analytics', 'posthog', 'funnel.json');

const exportFormatFor = inputPath => {
  const extension = path.extname(inputPath).toLowerCase();
  if (extension === '.csv') return 'csv';
  if (extension === '.json') return 'json';
  throw new Error(`Unsupported export "${path.basename(inputPath)}": use a .csv or .json file`);
};

export const loadFunnelInputs = ({ inputPath, funnelPath = defaultFunnelPath }) => {
  const funnelModule = loadTsModule(path.join(repoRoot, 'src', 'utils', 'funnel.ts'));
  const funnel = funnelModule.parseFunnelDefinition(
    JSON.parse(fs.readFileSync(funnelPath, 'utf8'))
  );
  const format = exportFormatFor(inputPath);
  const parsed = funnelModule.parseEventExport(fs.readFileSync(inputPath, 'utf8'), format);
  return { funnel, parsed, source: path.basename(inputPath), funnelModule };
};
