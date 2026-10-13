/**
 * Conversion funnel maths for task 10.2 (config in analytics/posthog/funnel.json).
 *
 * Pure functions only, with no file or network access. scripts/funnel-report.mjs
 * reads the export and the funnel file, then calls these helpers.
 *
 * Semantics (ordered funnel, per user):
 * - A user enters at their earliest event that matches step 1.
 * - Each later step counts only if a matching event happens at or after the
 *   previous step, and within conversionWindowDays of the entry event.
 */

export const CONDITION_OPERATORS = {
  eq: 'eq',
  ne: 'ne',
  gt: 'gt',
  gte: 'gte',
  lt: 'lt',
  lte: 'lte',
  isSet: 'is_set',
} as const;

export type ConditionOperator = (typeof CONDITION_OPERATORS)[keyof typeof CONDITION_OPERATORS];

const OPERATOR_NAMES = Object.values(CONDITION_OPERATORS).join(', ');
const EXPECTED_NON_EMPTY = 'expected a non-empty string';

export interface StepCondition {
  property: string;
  operator: ConditionOperator;
  value?: string | number | boolean;
}

export interface FunnelStep {
  label: string;
  event: string;
  where?: StepCondition[];
}

export interface FunnelDefinition {
  id: string;
  name: string;
  conversionWindowDays: number;
  steps: FunnelStep[];
}

export interface FunnelEvent {
  event: string;
  distinctId: string;
  timestampMs: number;
  properties: Record<string, unknown>;
}

export interface ParsedEvents {
  events: FunnelEvent[];
  skippedRows: number;
}

export interface StepStats {
  label: string;
  event: string;
  users: number;
  dropOffUsers: number;
  stepConversion: number | null;
  dropOffRate: number | null;
  overallConversion: number | null;
}

export interface FunnelSegment {
  value: string;
  enteredUsers: number;
  overallConversion: number | null;
  steps: StepStats[];
}

export interface FunnelReport {
  funnelId: string;
  funnelName: string;
  conversionWindowDays: number;
  enteredUsers: number;
  overallConversion: number | null;
  steps: StepStats[];
  breakdown: { property: string; segments: FunnelSegment[] } | null;
}

export type ExportFormat = 'csv' | 'json';

export const NOT_SET_LABEL = '(not set)';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const ratio = (part: number, whole: number): number | null => (whole > 0 ? part / whole : null);

const fail = (path: string, message: string): never => {
  throw new Error(`Invalid funnel definition at ${path}: ${message}`);
};

const parseCondition = (raw: unknown, path: string): StepCondition => {
  if (!isRecord(raw)) return fail(path, 'expected an object');
  const { property, operator, value } = raw;
  if (typeof property !== 'string' || !property) {
    return fail(`${path}.property`, EXPECTED_NON_EMPTY);
  }
  if (!Object.values<string>(CONDITION_OPERATORS).includes(operator as string)) {
    return fail(`${path}.operator`, `expected one of ${OPERATOR_NAMES}`);
  }
  const parsedOperator = operator as ConditionOperator;
  if (parsedOperator === CONDITION_OPERATORS.isSet) return { property, operator: parsedOperator };
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
    return fail(`${path}.value`, 'expected a string, number or boolean');
  }
  return { property, operator: parsedOperator, value };
};

/** Validates the parsed JSON of a funnel file and returns it typed. Throws on bad config. */
export const parseFunnelDefinition = (raw: unknown): FunnelDefinition => {
  if (!isRecord(raw)) return fail('$', 'expected an object');
  const { id, name, conversionWindowDays, steps } = raw;
  if (typeof id !== 'string' || !id) return fail('id', EXPECTED_NON_EMPTY);
  if (typeof name !== 'string' || !name) return fail('name', EXPECTED_NON_EMPTY);
  if (typeof conversionWindowDays !== 'number' || !(conversionWindowDays > 0)) {
    return fail('conversionWindowDays', 'expected a positive number');
  }
  if (!Array.isArray(steps) || steps.length < 2) {
    return fail('steps', 'expected at least two steps');
  }

  const parsedSteps: FunnelStep[] = steps.map((step, index) => {
    const path = `steps[${index}]`;
    if (!isRecord(step)) return fail(path, 'expected an object');
    const { label, event, where } = step;
    if (typeof label !== 'string' || !label) {
      return fail(`${path}.label`, EXPECTED_NON_EMPTY);
    }
    if (typeof event !== 'string' || !event) {
      return fail(`${path}.event`, EXPECTED_NON_EMPTY);
    }
    if (where === undefined) return { label, event };
    if (!Array.isArray(where)) return fail(`${path}.where`, 'expected an array');
    return {
      label,
      event,
      where: where.map((condition, conditionIndex) =>
        parseCondition(condition, `${path}.where[${conditionIndex}]`)
      ),
    };
  });

  return { id, name, conversionWindowDays, steps: parsedSteps };
};

const pickValue = (row: Record<string, unknown>, keys: string[]): unknown => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
};

const toTimestampMs = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
};

const parseProperties = (value: unknown): Record<string, unknown> => {
  if (isRecord(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed: unknown = JSON.parse(value);
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
};

/** Converts one export row into an event. Returns null when event, user or time is unusable. */
export const normalizeEventRow = (row: Record<string, unknown>): FunnelEvent | null => {
  const event = pickValue(row, ['event']);
  const distinctId = pickValue(row, ['distinct_id', 'distinctId', 'person_id']);
  const timestampMs = toTimestampMs(pickValue(row, ['timestamp']));
  if (typeof event !== 'string' || !event.trim()) return null;
  if (typeof distinctId !== 'string' && typeof distinctId !== 'number') return null;
  if (timestampMs === null) return null;
  return {
    event: event.trim(),
    distinctId: String(distinctId),
    timestampMs,
    properties: parseProperties(row.properties),
  };
};

/** RFC 4180-style splitter: quoted fields, doubled quotes, CRLF or LF, newlines inside quotes. */
const splitCsvRecords = (text: string): string[][] => {
  const records: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inQuotes) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      records.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    records.push(row);
  }
  return records.filter(record => !(record.length === 1 && record[0].trim() === ''));
};

/** Parses CSV text with a header row into objects keyed by header name. */
export const parseCsv = (text: string): Record<string, string>[] => {
  const records = splitCsvRecords(text);
  if (records.length === 0) return [];
  const [header, ...rows] = records;
  return rows.map(cells =>
    header.reduce<Record<string, string>>((row, key, index) => {
      row[key.trim()] = cells[index] ?? '';
      return row;
    }, {})
  );
};

/** Parses a PostHog-style export (CSV, or JSON array / { results: [] }) into funnel events. */
export const parseEventExport = (text: string, format: ExportFormat): ParsedEvents => {
  let rows: unknown[];
  if (format === 'csv') {
    rows = parseCsv(text);
  } else {
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed)) {
      rows = parsed;
    } else if (isRecord(parsed) && Array.isArray(parsed.results)) {
      rows = parsed.results;
    } else {
      throw new Error('Expected a JSON array of events or an object with a "results" array');
    }
  }

  const events: FunnelEvent[] = [];
  let skippedRows = 0;
  rows.forEach(row => {
    const normalized = isRecord(row) ? normalizeEventRow(row) : null;
    if (normalized) {
      events.push(normalized);
    } else {
      skippedRows += 1;
    }
  });
  return { events, skippedRows };
};

const numeric = (
  actual: unknown,
  expected: unknown,
  test: (left: number, right: number) => boolean
): boolean => typeof actual === 'number' && typeof expected === 'number' && test(actual, expected);

const matchesCondition = (
  properties: Record<string, unknown>,
  condition: StepCondition
): boolean => {
  const actual = properties[condition.property];
  const expected = condition.value;
  switch (condition.operator) {
    case CONDITION_OPERATORS.isSet:
      return actual !== undefined && actual !== null && actual !== '';
    case CONDITION_OPERATORS.eq:
      return actual === expected;
    case CONDITION_OPERATORS.ne:
      return actual !== expected;
    case CONDITION_OPERATORS.gt:
      return numeric(actual, expected, (left, right) => left > right);
    case CONDITION_OPERATORS.gte:
      return numeric(actual, expected, (left, right) => left >= right);
    case CONDITION_OPERATORS.lt:
      return numeric(actual, expected, (left, right) => left < right);
    case CONDITION_OPERATORS.lte:
      return numeric(actual, expected, (left, right) => left <= right);
  }
};

const matchesStep = (event: FunnelEvent, step: FunnelStep): boolean =>
  event.event === step.event &&
  (step.where ?? []).every(condition => matchesCondition(event.properties, condition));

const groupByUser = (events: FunnelEvent[]): FunnelEvent[][] => {
  const byUser = new Map<string, FunnelEvent[]>();
  events.forEach(event => {
    const userEvents = byUser.get(event.distinctId) ?? [];
    userEvents.push(event);
    byUser.set(event.distinctId, userEvents);
  });
  return Array.from(byUser.values(), userEvents =>
    userEvents.sort((left, right) => left.timestampMs - right.timestampMs)
  );
};

/** Earliest event matching the step, at or after the cursor and inside the window. */
const findStepMatch = (
  userEvents: FunnelEvent[],
  step: FunnelStep,
  cursor: number,
  entryMs: number | null,
  windowMs: number
): FunnelEvent | undefined =>
  userEvents.find(
    event =>
      event.timestampMs >= cursor &&
      (entryMs === null || event.timestampMs <= entryMs + windowMs) &&
      matchesStep(event, step)
  );

interface UserProgress {
  reached: number;
  entryProperties: Record<string, unknown>;
}

const evaluateUser = (userEvents: FunnelEvent[], funnel: FunnelDefinition): UserProgress | null => {
  const windowMs = funnel.conversionWindowDays * MS_PER_DAY;
  let cursor = Number.NEGATIVE_INFINITY;
  let entryMs: number | null = null;
  let entryProperties: Record<string, unknown> = {};
  let reached = 0;

  for (let index = 0; index < funnel.steps.length; index += 1) {
    const match = findStepMatch(userEvents, funnel.steps[index], cursor, entryMs, windowMs);
    if (!match) break;
    if (entryMs === null) {
      entryMs = match.timestampMs;
      entryProperties = match.properties;
    }
    cursor = match.timestampMs;
    reached = index + 1;
  }

  return reached > 0 ? { reached, entryProperties } : null;
};

/** Text used for a breakdown segment. Missing values become "(not set)". */
export const segmentValue = (value: unknown): string => {
  if (value === undefined || value === null || value === '') return NOT_SET_LABEL;
  return typeof value === 'string' ? value : JSON.stringify(value);
};

const buildStepStats = (steps: FunnelStep[], counts: number[]): StepStats[] => {
  const entered = counts[0];
  return steps.map((step, index) => {
    const users = counts[index];
    const previous = index === 0 ? null : counts[index - 1];
    return {
      label: step.label,
      event: step.event,
      users,
      dropOffUsers: previous === null ? 0 : previous - users,
      stepConversion: previous === null ? null : ratio(users, previous),
      dropOffRate: previous === null ? null : ratio(previous - users, previous),
      overallConversion: ratio(users, entered),
    };
  });
};

const buildSegment = (value: string, counts: number[], steps: FunnelStep[]): FunnelSegment => ({
  value,
  enteredUsers: counts[0],
  overallConversion: ratio(counts[counts.length - 1], counts[0]),
  steps: buildStepStats(steps, counts),
});

export interface ReportOptions {
  breakdownProperty?: string;
}

/**
 * Counts users reaching each step. With breakdownProperty, users are grouped by that
 * property on their entry (step 1) event.
 */
export const computeFunnelReport = (
  events: FunnelEvent[],
  funnel: FunnelDefinition,
  options: ReportOptions = {}
): FunnelReport => {
  const stepCount = funnel.steps.length;
  const totals = new Array<number>(stepCount).fill(0);
  const segmentCounts = new Map<string, number[]>();

  groupByUser(events).forEach(userEvents => {
    const progress = evaluateUser(userEvents, funnel);
    if (!progress) return;

    for (let index = 0; index < progress.reached; index += 1) {
      totals[index] += 1;
    }

    if (options.breakdownProperty !== undefined) {
      const key = segmentValue(progress.entryProperties[options.breakdownProperty]);
      const counts = segmentCounts.get(key) ?? new Array<number>(stepCount).fill(0);
      for (let index = 0; index < progress.reached; index += 1) {
        counts[index] += 1;
      }
      segmentCounts.set(key, counts);
    }
  });

  const segments = Array.from(segmentCounts.entries(), ([value, counts]) =>
    buildSegment(value, counts, funnel.steps)
  ).sort((left, right) => {
    if (right.enteredUsers !== left.enteredUsers) return right.enteredUsers - left.enteredUsers;
    return left.value < right.value ? -1 : 1;
  });

  return {
    funnelId: funnel.id,
    funnelName: funnel.name,
    conversionWindowDays: funnel.conversionWindowDays,
    enteredUsers: totals[0],
    overallConversion: ratio(totals[stepCount - 1], totals[0]),
    steps: buildStepStats(funnel.steps, totals),
    breakdown:
      options.breakdownProperty === undefined
        ? null
        : { property: options.breakdownProperty, segments },
  };
};

export const formatPercent = (value: number | null): string =>
  value === null ? '—' : `${(value * 100).toFixed(1)}%`;

const renderTable = (rows: string[][]): string => {
  const widths = rows[0].map((_, column) => Math.max(...rows.map(row => row[column].length)));
  return rows
    .map(row =>
      row
        .map((cell, column) =>
          column === 0 ? cell.padEnd(widths[column]) : cell.padStart(widths[column])
        )
        .join('  ')
        .trimEnd()
    )
    .join('\n');
};

/** Plain-text report for the terminal: one row per step, then the breakdown if requested. */
export const formatFunnelText = (
  report: FunnelReport,
  context: { source: string; eventCount: number; skippedRows: number }
): string => {
  const stepRows = report.steps.map((step, index) => [
    `${index + 1}. ${step.label}`,
    String(step.users),
    index === 0 ? '—' : formatPercent(step.stepConversion),
    index === 0 ? '—' : String(step.dropOffUsers),
    index === 0 ? '—' : formatPercent(step.dropOffRate),
    formatPercent(step.overallConversion),
  ]);
  const lines = [
    `Funnel: ${report.funnelName} (${report.funnelId})`,
    `Source: ${context.source} · ${context.eventCount} events · ${context.skippedRows} rows skipped`,
    `Conversion window: ${report.conversionWindowDays} days (ordered steps)`,
    '',
    renderTable([
      ['Step', 'Users', 'From previous', 'Drop-off', 'Drop-off %', 'Of entered'],
      ...stepRows,
    ]),
    '',
    `Entered: ${report.enteredUsers} users · Overall conversion: ${formatPercent(
      report.overallConversion
    )}`,
  ];

  if (report.breakdown) {
    const segmentRows = report.breakdown.segments.map(segment => [
      segment.value,
      String(segment.enteredUsers),
      formatPercent(segment.overallConversion),
    ]);
    lines.push(
      '',
      `By ${report.breakdown.property} (entry event):`,
      renderTable([['Segment', 'Entered', 'Overall conversion'], ...segmentRows])
    );
  }

  return lines.join('\n');
};
