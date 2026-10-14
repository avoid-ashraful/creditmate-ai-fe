import fs from 'fs';
import path from 'path';

import funnelConfig from '../../analytics/posthog/funnel.json';

import {
  computeFunnelReport,
  FunnelDefinition,
  FunnelEvent,
  formatFunnelText,
  NOT_SET_LABEL,
  parseCsv,
  parseEventExport,
  parseFunnelDefinition,
} from './funnel';

const fixturePath = path.join(__dirname, '../../analytics/posthog/fixtures/sample-events.csv');
const fixtureText = fs.readFileSync(fixturePath, 'utf8');

const funnel = parseFunnelDefinition(funnelConfig);

const ev = (
  name: string,
  user: string,
  iso: string,
  properties: Record<string, unknown> = {}
): FunnelEvent => ({
  event: name,
  distinctId: user,
  timestampMs: Date.parse(iso),
  properties,
});

const rawFunnel = (): Record<string, unknown> => JSON.parse(JSON.stringify(funnelConfig));

const countsOf = (report: { steps: { users: number }[] }): number[] =>
  report.steps.map(step => step.users);

describe('parseFunnelDefinition', () => {
  it('reads the shipped funnel with the six steps in order', () => {
    expect(funnel.id).toBe('visit-to-share');
    expect(funnel.conversionWindowDays).toBe(7);
    expect(funnel.steps.map(step => step.label)).toEqual([
      'Visit',
      'Search',
      'Filter',
      'Select',
      'Compare',
      'Share',
    ]);
  });

  it('rejects a window that is not a positive number', () => {
    expect(() => parseFunnelDefinition({ ...rawFunnel(), conversionWindowDays: 0 })).toThrow(
      'conversionWindowDays'
    );
  });

  it('rejects a funnel with fewer than two steps', () => {
    const raw = rawFunnel();
    raw.steps = [{ label: 'Visit', event: 'page_view' }];
    expect(() => parseFunnelDefinition(raw)).toThrow('steps');
  });

  it('rejects an unknown operator with the path of the bad condition', () => {
    const raw = rawFunnel();
    raw.steps = [
      { label: 'Visit', event: 'page_view' },
      {
        label: 'Search',
        event: 'search',
        where: [{ property: 'filterCount', operator: 'between', value: 1 }],
      },
    ];
    expect(() => parseFunnelDefinition(raw)).toThrow('steps[1].where[0].operator');
  });

  it('rejects a comparison condition without a value', () => {
    const raw = rawFunnel();
    raw.steps = [
      { label: 'Visit', event: 'page_view' },
      { label: 'Search', event: 'search', where: [{ property: 'filterCount', operator: 'gt' }] },
    ];
    expect(() => parseFunnelDefinition(raw)).toThrow('steps[1].where[0].value');
  });
});

describe('parseCsv and parseEventExport', () => {
  it('handles quoted commas, doubled quotes, CRLF line endings and newlines inside quotes', () => {
    const rows = parseCsv('a,b\r\n"x, ""y""","line\nbreak"\r\n');
    expect(rows).toEqual([{ a: 'x, "y"', b: 'line\nbreak' }]);
  });

  it('accepts a JSON array and an object with a results array', () => {
    const row = {
      event: 'page_view',
      distinct_id: 'u1',
      timestamp: '2026-10-05T10:00:00Z',
      properties: { $device_type: 'Mobile' },
    };
    expect(parseEventExport(JSON.stringify([row]), 'json').events).toHaveLength(1);
    const wrapped = parseEventExport(JSON.stringify({ results: [row] }), 'json');
    expect(wrapped.events[0].properties).toEqual({ $device_type: 'Mobile' });
  });

  it('rejects JSON that is neither an array nor a results object', () => {
    expect(() => parseEventExport(JSON.stringify({ count: 1 }), 'json')).toThrow('results');
  });

  it('counts unusable rows as skipped and keeps the rest', () => {
    const csv = [
      'event,distinct_id,timestamp,properties',
      'page_view,u1,2026-10-05T10:00:00Z,',
      'page_view,u2,not-a-date,',
      ',u3,2026-10-05T10:00:00Z,',
      'page_view,,2026-10-05T10:00:00Z,',
    ].join('\n');
    const parsed = parseEventExport(csv, 'csv');
    expect(parsed.events.map(event => event.distinctId)).toEqual(['u1']);
    expect(parsed.skippedRows).toBe(3);
  });

  it('keeps an event whose properties are not valid JSON, with empty properties', () => {
    const csv = 'event,distinct_id,timestamp,properties\npage_view,u1,2026-10-05T10:00:00Z,{oops';
    const parsed = parseEventExport(csv, 'csv');
    expect(parsed.events[0].properties).toEqual({});
    expect(parsed.skippedRows).toBe(0);
  });
});

describe('computeFunnelReport on the sample fixture', () => {
  const parsed = parseEventExport(fixtureText, 'csv');
  const report = computeFunnelReport(parsed.events, funnel);

  it('parses 41 events and skips the one row with a bad timestamp', () => {
    expect(parsed.events).toHaveLength(41);
    expect(parsed.skippedRows).toBe(1);
  });

  it('counts users reaching each step (11 enter; u9 and the bad row never enter)', () => {
    expect(report.enteredUsers).toBe(11);
    expect(countsOf(report)).toEqual([11, 7, 5, 5, 4, 3]);
  });

  it('reports drop-off per step', () => {
    expect(report.steps.map(step => step.dropOffUsers)).toEqual([0, 4, 2, 0, 1, 1]);
  });

  it('reports step and overall conversion', () => {
    expect(report.steps[0].stepConversion).toBeNull();
    expect(report.steps[1].stepConversion).toBeCloseTo(7 / 11);
    expect(report.steps[2].stepConversion).toBeCloseTo(5 / 7);
    expect(report.steps[3].stepConversion).toBe(1);
    expect(report.steps[4].stepConversion).toBeCloseTo(4 / 5);
    expect(report.steps[5].stepConversion).toBeCloseTo(3 / 4);
    expect(report.overallConversion).toBeCloseTo(3 / 11);
  });

  it('does not count a search submit as a filter (filterCount 0 for u2)', () => {
    expect(report.steps[2].users).toBe(5);
  });

  it('breaks down by device on the Visit event, with missing values as (not set)', () => {
    const deviceReport = computeFunnelReport(parsed.events, funnel, {
      breakdownProperty: '$device_type',
    });
    expect(
      deviceReport.breakdown?.segments.map(segment => [segment.value, segment.enteredUsers])
    ).toEqual([
      ['Desktop', 5],
      ['Mobile', 4],
      [NOT_SET_LABEL, 1],
      ['Tablet', 1],
    ]);
    const mobile = deviceReport.breakdown?.segments.find(segment => segment.value === 'Mobile');
    expect(mobile?.overallConversion).toBeCloseTo(2 / 4);
  });

  it('breaks down by utmSource, with untagged visits as (not set)', () => {
    const sourceReport = computeFunnelReport(parsed.events, funnel, {
      breakdownProperty: 'utmSource',
    });
    expect(
      sourceReport.breakdown?.segments.map(segment => [segment.value, segment.enteredUsers])
    ).toEqual([
      ['google', 6],
      [NOT_SET_LABEL, 2],
      ['facebook', 2],
      ['newsletter', 1],
    ]);
    const google = sourceReport.breakdown?.segments[0];
    expect(google?.overallConversion).toBeCloseTo(3 / 6);
  });
});

describe('funnel rules', () => {
  const twoStep: FunnelDefinition = {
    id: 'two',
    name: 'Two step',
    conversionWindowDays: 7,
    steps: [
      { label: 'Visit', event: 'page_view' },
      { label: 'Search', event: 'search' },
    ],
  };

  it('does not count a step that happens before the previous step', () => {
    const report = computeFunnelReport(
      [ev('search', 'u1', '2026-10-05T10:00:00Z'), ev('page_view', 'u1', '2026-10-05T10:30:00Z')],
      twoStep
    );
    expect(countsOf(report)).toEqual([1, 0]);
  });

  it('counts a step exactly at the window edge and drops one a second later', () => {
    const report = computeFunnelReport(
      [
        ev('page_view', 'edge', '2026-10-01T00:00:00Z'),
        ev('search', 'edge', '2026-10-08T00:00:00Z'),
        ev('page_view', 'late', '2026-10-01T00:00:00Z'),
        ev('search', 'late', '2026-10-08T00:00:01Z'),
      ],
      twoStep
    );
    expect(countsOf(report)).toEqual([2, 1]);
  });

  it('measures the window from the earliest visit, not a later one', () => {
    const report = computeFunnelReport(
      [
        ev('page_view', 'u1', '2026-10-01T00:00:00Z'),
        ev('page_view', 'u1', '2026-10-05T00:00:00Z'),
        ev('search', 'u1', '2026-10-08T12:00:00Z'),
      ],
      twoStep
    );
    expect(countsOf(report)).toEqual([1, 0]);
  });

  it('takes the breakdown value from the entry (earliest Visit) event', () => {
    const report = computeFunnelReport(
      [
        ev('page_view', 'u1', '2026-10-05T10:00:00Z', { $device_type: 'Mobile' }),
        ev('page_view', 'u1', '2026-10-05T11:00:00Z', { $device_type: 'Desktop' }),
      ],
      twoStep,
      { breakdownProperty: '$device_type' }
    );
    expect(report.breakdown?.segments.map(segment => segment.value)).toEqual(['Mobile']);
  });

  it('ignores events that are not in the funnel', () => {
    const report = computeFunnelReport(
      [
        ev('quiz_start', 'u1', '2026-10-05T10:00:00Z'),
        ev('page_view', 'u1', '2026-10-05T10:01:00Z'),
      ],
      twoStep
    );
    expect(countsOf(report)).toEqual([1, 0]);
  });

  it('returns null rates and zero counts for an empty export', () => {
    const report = computeFunnelReport([], twoStep);
    expect(countsOf(report)).toEqual([0, 0]);
    expect(report.overallConversion).toBeNull();
    expect(report.steps[1].stepConversion).toBeNull();
    expect(report.steps[1].dropOffRate).toBeNull();
  });
});

describe('formatFunnelText', () => {
  it('prints one row per step with step and overall conversion', () => {
    const report = computeFunnelReport(parseEventExport(fixtureText, 'csv').events, funnel);
    const text = formatFunnelText(report, {
      source: 'sample-events.csv',
      eventCount: 41,
      skippedRows: 1,
    });
    expect(text).toContain('Source: sample-events.csv · 41 events · 1 rows skipped');
    expect(text).toContain('2. Search');
    expect(text).toContain('63.6%');
    expect(text).toContain('Entered: 11 users · Overall conversion: 27.3%');
  });
});
