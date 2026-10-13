import fs from 'fs';
import path from 'path';

import funnelConfig from '../../analytics/posthog/funnel.json';

import {
  computeFunnelReport,
  FunnelEvent,
  parseEventExport,
  parseFunnelDefinition,
} from './funnel';
import { buildSlackPayload, escapeSlackText, FetchLike, postSlackPayload } from './funnelSlack';

const fixturePath = path.join(__dirname, '../../analytics/posthog/fixtures/sample-events.csv');
const funnel = parseFunnelDefinition(funnelConfig);
const fixtureReport = computeFunnelReport(
  parseEventExport(fs.readFileSync(fixturePath, 'utf8'), 'csv').events,
  funnel
);

const PERIOD = 'Export: sample-events.csv';
const WEBHOOK = 'https://hooks.example.test/services/T000/B000/XXXX';

const sectionTexts = (payload: ReturnType<typeof buildSlackPayload>): string[] =>
  payload.blocks
    .filter(block => block.type === 'section')
    .map(block => (block.text as { text: string }).text);

const ev = (name: string, user: string, iso: string, properties = {}): FunnelEvent => ({
  event: name,
  distinctId: user,
  timestampMs: Date.parse(iso),
  properties,
});

describe('buildSlackPayload', () => {
  it('summarises the fixture report in the fallback text', () => {
    const payload = buildSlackPayload(fixtureReport, { periodLabel: PERIOD });
    expect(payload.text).toBe('Weekly conversion funnel: 11 users entered, 27.3% reached Share');
    expect(payload.blocks[0]).toEqual({
      type: 'header',
      text: { type: 'plain_text', text: 'Weekly conversion funnel', emoji: false },
    });
  });

  it('lists every step with users and drop-off, and names the biggest drop-off', () => {
    const [, steps, worst] = sectionTexts(
      buildSlackPayload(fixtureReport, { periodLabel: PERIOD })
    );
    expect(steps).toContain('1. Visit: *11* users\n');
    expect(steps).toContain('2. Search: *7* users (63.6% of previous) · drop-off 4 (36.4%)');
    expect(worst).toBe('Biggest drop-off: *Search* (4 users, 36.4% of previous step)');
  });

  it('says so when no step loses anyone', () => {
    const events = [
      'page_view',
      'search',
      'filter_apply',
      'card_select',
      'compare_start',
      'compare_share',
    ].map((name, index) =>
      ev(
        name,
        'u1',
        `2026-10-05T10:0${index}:00Z`,
        name === 'filter_apply' ? { filterCount: 1 } : {}
      )
    );
    const report = computeFunnelReport(events, funnel);
    const payload = buildSlackPayload(report, { periodLabel: PERIOD });
    expect(sectionTexts(payload)).toContain('No drop-off between steps.');
  });

  it('adds a segment section, capped at ten segments', () => {
    const events: FunnelEvent[] = [];
    for (let index = 0; index < 12; index += 1) {
      events.push(
        ev('page_view', `u${index}`, '2026-10-05T10:00:00Z', { utmSource: `source${index}` })
      );
    }
    const report = computeFunnelReport(events, funnel, { breakdownProperty: 'utmSource' });
    const segmentSection = sectionTexts(buildSlackPayload(report, { periodLabel: PERIOD })).pop();
    expect(segmentSection).toMatch(/^\*By utmSource\*/);
    expect(segmentSection?.split('\n').filter(line => line.startsWith('• '))).toHaveLength(10);
  });

  it('escapes Slack control characters in user-derived segment values', () => {
    const events = [
      ev('page_view', 'u1', '2026-10-05T10:00:00Z', { utmSource: '<!channel> & <x>' }),
    ];
    const report = computeFunnelReport(events, funnel, { breakdownProperty: 'utmSource' });
    const segmentSection = sectionTexts(buildSlackPayload(report, { periodLabel: PERIOD })).pop();
    expect(segmentSection).toContain('&lt;!channel&gt; &amp; &lt;x&gt;');
    expect(segmentSection).not.toContain('<!channel>');
  });

  it('links the dashboard only for https URLs', () => {
    const withLink = buildSlackPayload(fixtureReport, {
      periodLabel: PERIOD,
      dashboardUrl: 'https://app.example.test/dashboard',
    });
    expect(JSON.stringify(withLink.blocks)).toContain(
      '<https://app.example.test/dashboard|Open dashboard>'
    );
    const withoutLink = buildSlackPayload(fixtureReport, {
      periodLabel: PERIOD,
      dashboardUrl: 'http://app.example.test/dashboard',
    });
    expect(JSON.stringify(withoutLink.blocks)).not.toContain('Open dashboard');
  });
});

describe('escapeSlackText', () => {
  it('escapes &, < and > and leaves other characters alone', () => {
    expect(escapeSlackText('a & b < c > d "e"')).toBe('a &amp; b &lt; c &gt; d "e"');
  });
});

describe('postSlackPayload', () => {
  const payload = buildSlackPayload(fixtureReport, { periodLabel: PERIOD });

  it('refuses a webhook that is not https, without calling fetch', async () => {
    const fetchMock = jest.fn();
    await expect(
      postSlackPayload('http://hooks.example.test/x', payload, fetchMock as unknown as FetchLike)
    ).rejects.toThrow('https');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts the JSON payload once with a POST and a JSON content type', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    await postSlackPayload(WEBHOOK, payload, fetchMock as unknown as FetchLike);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(WEBHOOK);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body)).toEqual(payload);
  });

  it('throws on a non-2xx response without echoing the webhook URL', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: false, status: 404 });
    const error = await postSlackPayload(WEBHOOK, payload, fetchMock as unknown as FetchLike).catch(
      (caught: Error) => caught
    );
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('Slack webhook responded with HTTP 404');
    expect((error as Error).message).not.toContain('hooks.example.test');
  });
});
