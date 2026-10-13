/**
 * Slack payload for the weekly conversion funnel report (task 10.2).
 *
 * buildSlackPayload is pure. postSlackPayload takes the fetch implementation as an
 * argument, so tests can check the request without touching the network.
 * scripts/funnel-slack-report.mjs decides whether to call it (dry run by default).
 */
import { formatPercent } from './funnel';
import type { FunnelReport, StepStats } from './funnel';

export interface SlackPayload {
  text: string;
  blocks: Record<string, unknown>[];
}

export interface SlackBuildOptions {
  periodLabel: string;
  dashboardUrl?: string;
}

export interface FetchResponseLike {
  ok: boolean;
  status: number;
}

export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string }
) => Promise<FetchResponseLike>;

const MAX_SEGMENTS_SHOWN = 10;
const HTTPS_URL_PATTERN = /^https:\/\/\S+$/;

/** Slack mrkdwn treats &, < and > as control characters, so user-derived text is escaped. */
export const escapeSlackText = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The step with the most users lost on the way in. Ties go to the earlier step. */
export const findBiggestDropOff = (steps: StepStats[]): StepStats | null => {
  let worst: StepStats | null = null;
  for (let index = 1; index < steps.length; index += 1) {
    const step = steps[index];
    if (step.dropOffUsers > 0 && (worst === null || step.dropOffUsers > worst.dropOffUsers)) {
      worst = step;
    }
  }
  return worst;
};

const stepLine = (step: StepStats, index: number): string => {
  const label = escapeSlackText(step.label);
  if (index === 0) return `${index + 1}. ${label}: *${step.users}* users`;
  return (
    `${index + 1}. ${label}: *${step.users}* users ` +
    `(${formatPercent(step.stepConversion)} of previous) · ` +
    `drop-off ${step.dropOffUsers} (${formatPercent(step.dropOffRate)})`
  );
};

export const buildSlackPayload = (
  report: FunnelReport,
  options: SlackBuildOptions
): SlackPayload => {
  const lastStep = report.steps[report.steps.length - 1];
  const overall = formatPercent(report.overallConversion);
  const worst = findBiggestDropOff(report.steps);
  const worstLine = worst
    ? `Biggest drop-off: *${escapeSlackText(worst.label)}* ` +
      `(${worst.dropOffUsers} users, ${formatPercent(worst.dropOffRate)} of previous step)`
    : 'No drop-off between steps.';
  const footer = [escapeSlackText(options.periodLabel)];
  if (options.dashboardUrl && HTTPS_URL_PATTERN.test(options.dashboardUrl)) {
    footer.push(`<${options.dashboardUrl}|Open dashboard>`);
  }

  const blocks: Record<string, unknown>[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Weekly conversion funnel', emoji: false },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          `${escapeSlackText(report.funnelName)}\n` +
          `*${report.enteredUsers}* users entered · *${overall}* reached ` +
          `${escapeSlackText(lastStep.label)}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: report.steps.map(stepLine).join('\n'),
      },
    },
    { type: 'section', text: { type: 'mrkdwn', text: worstLine } },
  ];

  if (report.breakdown) {
    const segmentLines = report.breakdown.segments
      .slice(0, MAX_SEGMENTS_SHOWN)
      .map(
        segment =>
          `• ${escapeSlackText(segment.value)}: ${segment.enteredUsers} entered, ` +
          `${formatPercent(segment.overallConversion)} converted`
      );
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [`*By ${escapeSlackText(report.breakdown.property)}*`, ...segmentLines].join('\n'),
      },
    });
  }

  blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: footer.join(' · ') }] });

  return {
    text: `Weekly conversion funnel: ${report.enteredUsers} users entered, ${overall} reached ${lastStep.label}`,
    blocks,
  };
};

/** Posts the payload to an https webhook. Errors never include the webhook URL. */
export const postSlackPayload = async (
  webhookUrl: string,
  payload: SlackPayload,
  fetchImpl: FetchLike
): Promise<void> => {
  if (!HTTPS_URL_PATTERN.test(webhookUrl)) {
    throw new Error('SLACK_WEBHOOK_URL must be an https URL');
  }
  const response = await fetchImpl(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Slack webhook responded with HTTP ${response.status}`);
  }
};
