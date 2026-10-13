import axe from 'axe-core';

/**
 * Rules that cannot produce a reliable result in jsdom because they depend on
 * real layout / painting (jsdom has no layout engine). They are disabled here
 * and covered by manual / browser-based checks instead. See README notes in the
 * task report.
 */
const JSDOM_UNSUPPORTED_RULES = ['color-contrast', 'color-contrast-enhanced'];

export interface AxeViolationSummary {
  id: string;
  impact: string | null;
  help: string;
  nodes: number;
  targets: string[];
}

/** Run axe-core against a container and return a compact violation summary. */
export async function axeViolations(container: HTMLElement): Promise<AxeViolationSummary[]> {
  const results = await axe.run(container, {
    resultTypes: ['violations'],
    rules: Object.fromEntries(JSDOM_UNSUPPORTED_RULES.map(rule => [rule, { enabled: false }])),
  });

  return results.violations.map(violation => ({
    id: violation.id,
    impact: violation.impact ?? null,
    help: violation.help,
    nodes: violation.nodes.length,
    targets: violation.nodes.map(node => node.target.join(' ')),
  }));
}

/** Assert that a rendered container has no axe-core violations. */
export async function expectNoAxeViolations(container: HTMLElement): Promise<void> {
  const violations = await axeViolations(container);
  if (violations.length > 0) {
    throw new Error(
      `axe-core found ${violations.length} accessibility violation(s):\n${violations
        .map(v => `- [${v.id}] ${v.help} (${v.nodes} node(s): ${v.targets.join(', ')})`)
        .join('\n')}`
    );
  }
}
