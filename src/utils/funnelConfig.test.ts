import fs from 'fs';
import path from 'path';

import cohortsConfig from '../../analytics/posthog/cohorts.json';
import dashboardConfig from '../../analytics/posthog/dashboard.json';
import funnelConfig from '../../analytics/posthog/funnel.json';
import { ANALYTICS_EVENTS } from '../lib/analytics';

import { parseFunnelDefinition } from './funnel';

const SRC_DIR = path.join(__dirname, '..');

const listSourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(fullPath);
    const isProductionCode =
      /\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec|stories)\./.test(entry.name);
    return isProductionCode ? [fullPath] : [];
  });

const sourceFiles = listSourceFiles(SRC_DIR).map(file => ({
  file,
  text: fs.readFileSync(file, 'utf8'),
}));

const keyForEvent = (eventName: string): string | undefined =>
  Object.entries(ANALYTICS_EVENTS).find(([, value]) => value === eventName)?.[0];

/** Text starting at the first analytics.track(ANALYTICS_EVENTS.<key>) call in production code. */
const trackCallSite = (key: string): string | null => {
  const pattern = new RegExp(`analytics\\.track\\(\\s*ANALYTICS_EVENTS\\.${key}\\b`);
  for (const { text } of sourceFiles) {
    const index = text.search(pattern);
    if (index >= 0) return text.slice(index, index + 400);
  }
  return null;
};

const funnel = parseFunnelDefinition(funnelConfig);
const allowlisted = new Set<string>(Object.values(ANALYTICS_EVENTS));

describe('funnel.json', () => {
  it('maps the spec steps Visit, Search, Filter, Select, Compare, Share in order', () => {
    expect(funnel.steps.map(step => [step.label, step.event])).toEqual([
      ['Visit', 'page_view'],
      ['Search', 'search'],
      ['Filter', 'filter_apply'],
      ['Select', 'card_select'],
      ['Compare', 'compare_start'],
      ['Share', 'compare_share'],
    ]);
  });

  it.each(funnel.steps.map(step => [step.label, step.event]))(
    '%s uses an allowlisted event that the app tracks',
    (_label, eventName) => {
      expect(allowlisted.has(eventName)).toBe(true);
      const key = keyForEvent(eventName);
      expect(key).toBeDefined();
      expect(trackCallSite(key as string)).not.toBeNull();
    }
  );

  it('only filters on properties that the tracking call sends', () => {
    funnel.steps.forEach(step => {
      const key = keyForEvent(step.event) as string;
      const callSite = trackCallSite(key) ?? '';
      (step.where ?? []).forEach(condition => {
        expect(callSite).toContain(`${condition.property}:`);
      });
    });
  });
});

describe('dashboard.json and cohorts.json', () => {
  const cohortKeys = cohortsConfig.cohorts.map(cohort => cohort.key);

  it('has unique cohort keys', () => {
    expect(new Set(cohortKeys).size).toBe(cohortKeys.length);
  });

  it('uses only allowlisted events in behavioural cohort filters', () => {
    const behavioralEvents = cohortsConfig.cohorts.flatMap(cohort => {
      const behavioral = (cohort.filters as { behavioral?: { event: string } }).behavioral;
      return behavioral ? [behavioral.event] : [];
    });
    expect(behavioralEvents.length).toBeGreaterThan(0);
    behavioralEvents.forEach(eventName => expect(allowlisted.has(eventName)).toBe(true));
  });

  it('points every tile at the funnel and at cohorts that exist', () => {
    const tileIds = dashboardConfig.tiles.map(tile => tile.id);
    expect(new Set(tileIds).size).toBe(tileIds.length);
    const funnelTiles = dashboardConfig.tiles.filter(tile => 'funnelId' in tile);
    expect(funnelTiles.length).toBeGreaterThan(0);
    funnelTiles.forEach(tile => expect(tile).toMatchObject({ funnelId: funnel.id }));
    const visitorTile = dashboardConfig.tiles.find(tile => tile.id === 'funnel-by-visitor-type');
    const referenced = (visitorTile as { breakdown?: { cohortKeys: string[] } }).breakdown
      ?.cohortKeys;
    expect(referenced).toEqual(['segment-new-visitor', 'segment-returning-visitor']);
    referenced?.forEach(key => expect(cohortKeys).toContain(key));
  });
});
