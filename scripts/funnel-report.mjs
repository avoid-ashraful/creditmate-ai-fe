#!/usr/bin/env node
/**
 * Prints step conversion and drop-off for the conversion funnel (task 10.2).
 *
 * Usage:
 *   node scripts/funnel-report.mjs <events.csv|events.json> [options]
 *
 * Options:
 *   --funnel <path>      funnel definition (default analytics/posthog/funnel.json)
 *   --breakdown <prop>   group users by a property of their Visit event, e.g. $device_type
 *                        or utmSource. Missing values are reported as "(not set)".
 *   --json               print the report as JSON instead of a table
 *   -h, --help           show this help
 *
 * The export is what PostHog gives you for the events in analytics/posthog/funnel.json:
 * columns event, distinct_id, timestamp, properties (CSV), or the same fields as JSON.
 * See docs/analytics-funnel.md. The script only reads files; it does not call PostHog.
 */
import { parseArgs } from 'node:util';

import { loadFunnelInputs } from './lib/funnel-input.mjs';

const usage = `Usage: node scripts/funnel-report.mjs <events.csv|events.json> [--funnel <path>] [--breakdown <property>] [--json]`;

const main = () => {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      funnel: { type: 'string' },
      breakdown: { type: 'string' },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });

  if (values.help) {
    console.log(usage);
    return;
  }
  if (positionals.length !== 1) {
    throw new Error(`Expected one events file.\n${usage}`);
  }

  const { funnel, parsed, source, funnelModule } = loadFunnelInputs({
    inputPath: positionals[0],
    funnelPath: values.funnel,
  });
  const report = funnelModule.computeFunnelReport(parsed.events, funnel, {
    breakdownProperty: values.breakdown,
  });

  if (values.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log(
    funnelModule.formatFunnelText(report, {
      source,
      eventCount: parsed.events.length,
      skippedRows: parsed.skippedRows,
    })
  );
};

try {
  main();
} catch (error) {
  console.error(`funnel-report: ${error.message}`);
  process.exit(1);
}
