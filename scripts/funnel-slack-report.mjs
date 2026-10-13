#!/usr/bin/env node
/**
 * Formats the weekly conversion funnel report as a Slack message (task 10.2).
 *
 * Usage:
 *   node scripts/funnel-slack-report.mjs <events.csv|events.json> [options]
 *
 * Options:
 *   --funnel <path>    funnel definition (default analytics/posthog/funnel.json)
 *   --period <label>   text for the message footer (default: the export file name)
 *   --breakdown <prop> add a segment section, e.g. $device_type or utmSource
 *   --send             post the message. Needs SLACK_WEBHOOK_URL as well.
 *
 * Environment:
 *   SLACK_WEBHOOK_URL     Slack incoming webhook (https). Keep it in the scheduler's
 *                         secret store, never in the repo.
 *   FUNNEL_DASHBOARD_URL  optional link added to the message footer.
 *
 * Dry run is the default. The payload is printed to stdout and nothing is sent, even
 * when SLACK_WEBHOOK_URL is set. A message is posted only when BOTH SLACK_WEBHOOK_URL
 * is set and --send is passed.
 */
import { parseArgs } from 'node:util';
import path from 'node:path';

import { loadFunnelInputs, repoRoot } from './lib/funnel-input.mjs';
import { loadTsModule } from './lib/load-ts.mjs';

const usage = `Usage: node scripts/funnel-slack-report.mjs <events.csv|events.json> [--funnel <path>] [--period <label>] [--breakdown <property>] [--send]`;

const main = async () => {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      funnel: { type: 'string' },
      period: { type: 'string' },
      breakdown: { type: 'string' },
      send: { type: 'boolean', default: false },
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
  const slackModule = loadTsModule(path.join(repoRoot, 'src', 'utils', 'funnelSlack.ts'));
  const payload = slackModule.buildSlackPayload(report, {
    periodLabel: values.period ?? `Export: ${source}`,
    dashboardUrl: process.env.FUNNEL_DASHBOARD_URL,
  });

  console.log(JSON.stringify(payload, null, 2));

  const webhookUrl = process.env.SLACK_WEBHOOK_URL ?? '';
  if (!values.send) {
    const hint = webhookUrl
      ? 'SLACK_WEBHOOK_URL is set, but nothing was posted. Pass --send to post.'
      : 'Nothing was posted. Set SLACK_WEBHOOK_URL and pass --send to post.';
    console.error(`Dry run. ${hint}`);
    return;
  }
  if (!webhookUrl) {
    throw new Error('--send needs SLACK_WEBHOOK_URL to be set. Nothing was posted.');
  }

  await slackModule.postSlackPayload(webhookUrl, payload, (url, init) => fetch(url, init));
  console.error('Posted the weekly funnel report to Slack.');
};

main().catch(error => {
  console.error(`funnel-slack-report: ${error.message}`);
  process.exit(1);
});
