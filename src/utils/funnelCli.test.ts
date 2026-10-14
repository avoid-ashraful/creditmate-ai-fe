import { spawnSync, SpawnSyncReturns } from 'child_process';
import path from 'path';

const repoRoot = path.join(__dirname, '../..');
const fixture = path.join(repoRoot, 'analytics/posthog/fixtures/sample-events.csv');
const readme = path.join(repoRoot, 'README.md');
const TEST_WEBHOOK = 'https://hooks.example.test/services/T000/B000/XXXX';

/**
 * Runs a script in a child process. SLACK_WEBHOOK_URL is removed from the environment
 * unless a test sets it. No test passes --send, so no test can post to Slack.
 */
const runScript = (
  script: string,
  args: string[],
  env: Record<string, string> = {}
): SpawnSyncReturns<string> => {
  const childEnv: Record<string, string> = {};
  Object.entries(process.env).forEach(([key, value]) => {
    if (value !== undefined && key !== 'SLACK_WEBHOOK_URL') childEnv[key] = value;
  });
  return spawnSync(process.execPath, [path.join(repoRoot, 'scripts', script), ...args], {
    encoding: 'utf8',
    env: { ...childEnv, ...env },
  });
};

describe('scripts/funnel-report.mjs', () => {
  it('prints the step table for the fixture', () => {
    const result = runScript('funnel-report.mjs', [fixture]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('6. Share');
    expect(result.stdout).toContain('Entered: 11 users · Overall conversion: 27.3%');
  });

  it('prints JSON with exact step counts when --json is passed', () => {
    const result = runScript('funnel-report.mjs', [fixture, '--json']);
    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.steps.map((step: { users: number }) => step.users)).toEqual([11, 7, 5, 5, 4, 3]);
    expect(report.breakdown).toBeNull();
  });

  it('breaks down by a property when --breakdown is passed', () => {
    const result = runScript('funnel-report.mjs', [
      fixture,
      '--json',
      '--breakdown',
      '$device_type',
    ]);
    expect(result.status).toBe(0);
    const segments = JSON.parse(result.stdout).breakdown.segments as {
      value: string;
      enteredUsers: number;
    }[];
    expect(segments.map(segment => [segment.value, segment.enteredUsers])).toEqual([
      ['Desktop', 5],
      ['Mobile', 4],
      ['(not set)', 1],
      ['Tablet', 1],
    ]);
  });

  it('exits 1 with a message for an export it cannot read', () => {
    const result = runScript('funnel-report.mjs', [readme]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Unsupported export');
  });

  it('exits 1 when no events file is given', () => {
    const result = runScript('funnel-report.mjs', []);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Expected one events file');
  });
});

describe('scripts/funnel-slack-report.mjs', () => {
  it('prints the payload and does not post in dry run, even with SLACK_WEBHOOK_URL set', () => {
    const result = runScript('funnel-slack-report.mjs', [fixture], {
      SLACK_WEBHOOK_URL: TEST_WEBHOOK,
    });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).text).toBe(
      'Weekly conversion funnel: 11 users entered, 27.3% reached Share'
    );
    expect(result.stderr).toContain('SLACK_WEBHOOK_URL is set, but nothing was posted');
  });

  it('prints the payload in dry run when SLACK_WEBHOOK_URL is not set', () => {
    const result = runScript('funnel-slack-report.mjs', [fixture]);
    expect(result.status).toBe(0);
    expect(result.stderr).toContain('Nothing was posted');
  });

  it('exits 1 with --send but no SLACK_WEBHOOK_URL, and posts nothing', () => {
    const result = runScript('funnel-slack-report.mjs', [fixture, '--send']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('needs SLACK_WEBHOOK_URL');
  });

  it('adds the requested breakdown section to the payload', () => {
    const result = runScript('funnel-slack-report.mjs', [fixture, '--breakdown', 'utmSource']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('By utmSource');
  });
});
