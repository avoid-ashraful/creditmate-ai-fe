import { readFileSync } from 'fs';
import { join } from 'path';

import {
  color,
  cssVar,
  cssVars,
  radius,
  shadow,
  spacing,
  tokens,
  transition,
  typography,
} from './tokens';

const projectRoot = join(__dirname, '..', '..');
const cssOutputPath = join(__dirname, 'tokens.css');
const figmaOutputPath = join(projectRoot, 'design-tokens', 'build', 'figma.tokens.json');

const readOutput = (path: string): string => readFileSync(path, 'utf8');

describe('design tokens — semantic colours', () => {
  it.each([
    ['primary', color.primary],
    ['secondary', color.secondary],
    ['success', color.success],
    ['warning', color.warning],
    ['error', color.error],
    ['info', color.info],
  ])('defines the %s semantic colour group', (_name, group) => {
    expect(group).toBeDefined();
    expect(typeof group.base).toBe('string');
    expect(group.base).toMatch(/^#[0-9a-f]{6}$/i);
    expect(typeof group.contrast).toBe('string');
  });

  it('defines background tokens', () => {
    Object.entries({
      base: color.background.base,
      surface: color.background.surface,
      elevated: color.background.elevated,
      muted: color.background.muted,
      inverse: color.background.inverse,
      overlay: color.background.overlay,
    }).forEach(([name, value]) => {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
      expect(`color.background.${name}`).toBeTruthy();
    });

    expect(color.background.surface).toBe('#ffffff');
    expect(color.background.overlay).toMatch(/^rgba\(/);
  });

  it('defines the text and border semantic groups', () => {
    expect(typeof color.text.primary).toBe('string');
    expect(typeof color.text.secondary).toBe('string');
    expect(typeof color.text.inverse).toBe('string');
    expect(typeof color.border.base).toBe('string');
    expect(typeof color.border.focus).toBe('string');
  });

  it('keeps the same-family colour ramps in a valid hex range', () => {
    const ramps = ['blue', 'indigo', 'sky', 'emerald', 'amber', 'red', 'slate'] as const;

    ramps.forEach(ramp => {
      const shades = color[ramp] as unknown as Record<string, string>;
      expect(Object.keys(shades)).toEqual([
        '50',
        '100',
        '200',
        '300',
        '400',
        '500',
        '600',
        '700',
        '800',
        '900',
      ]);
      Object.values(shades).forEach(value => {
        expect(value).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });

  it('resolves semantic colours through to palette references', () => {
    expect(color.primary.base).toBe(color.blue['500']);
    expect(color.secondary.base).toBe(color.slate['900']);
    expect(color.success.base).toBe(color.emerald['500']);
    expect(color.warning.base).toBe(color.amber['500']);
    expect(color.error.base).toBe(color.red['500']);
    expect(color.info.base).toBe(color.sky['500']);
  });
});

describe('design tokens — 4px spacing scale', () => {
  it.each([
    ['xs', '4px'],
    ['sm', '8px'],
    ['md', '16px'],
    ['lg', '24px'],
    ['xl', '32px'],
    ['2xl', '48px'],
    ['3xl', '64px'],
  ] as const)('spacing.%s is %s', (name, expected) => {
    expect(spacing[name]).toBe(expected);
  });

  it('exposes the full named scale', () => {
    expect(Object.keys(spacing).sort()).toEqual(
      ['2xl', '2xs', '3xl', '4xl', 'lg', 'md', 'none', 'sm', 'xl', 'xs'].sort()
    );
  });

  it('keeps every scale step on a 4px grid', () => {
    Object.entries(spacing)
      .filter(([name]) => name !== 'none' && name !== '2xs')
      .forEach(([name, value]) => {
        const pixels = Number.parseInt(String(value), 10);
        expect(value).toMatch(/px$/);
        expect(pixels % 4).toBe(0);
        expect(`${name}:${pixels}`).not.toBe('');
      });
  });

  it('is monotonically increasing', () => {
    const ordered = ['none', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'] as const;
    const pixels = ordered.map(name => Number.parseInt(String(spacing[name]), 10));
    expect(pixels).toEqual([...pixels].sort((a, b) => a - b));
  });
});

describe('design tokens — typography', () => {
  it('defines font families', () => {
    expect(typography.fontFamily.sans).toContain('sans-serif');
    expect(typography.fontFamily.mono).toContain('monospace');
  });

  it('defines a font size ramp', () => {
    expect(Object.keys(typography.fontSize)).toEqual([
      'xs',
      'sm',
      'md',
      'lg',
      'xl',
      '2xl',
      '3xl',
      '4xl',
      '5xl',
    ]);
    expect(typography.fontSize.md).toBe('16px');
    expect(typography.fontSize.xs).toBe('12px');
  });
  it('defines numeric font weights', () => {
    expect(typography.fontWeight).toEqual({
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    });
  });

  it('defines line heights as unitless ratios', () => {
    expect(typography.lineHeight).toEqual({
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    });
    Object.values(typography.lineHeight).forEach(value => {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    });
  });

  it('defines letter spacing', () => {
    expect(typography.letterSpacing.tight).toBe('-0.025em');
    expect(typography.letterSpacing.normal).toBe('0');
    expect(typography.letterSpacing.wide).toBe('0.025em');
  });
});

describe('design tokens — radius, shadow, transition', () => {
  it('defines the radius scale', () => {
    expect(radius).toEqual({
      none: '0',
      sm: '4px',
      md: '6px',
      lg: '8px',
      xl: '16px',
      '2xl': '24px',
      full: '9999px',
    });
  });

  it('defines elevation shadows', () => {
    ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 'inner', 'focus'].forEach(name => {
      expect(shadow[name as keyof typeof shadow]).toBeTruthy();
    });
    expect(shadow.md).toContain('rgba');
    expect(shadow.inner).toContain('inset');
    expect(shadow.focus).toContain('0 0 0 3px');
  });

  it('defines transition durations and easings', () => {
    expect(transition.duration).toEqual({
      instant: '0ms',
      fast: '150ms',
      base: '200ms',
      slow: '300ms',
      slower: '500ms',
    });
    Object.values(transition.duration).forEach(value => {
      expect(value).toMatch(/^\d+ms$/);
    });
    expect(transition.easing.easeInOut).toMatch(/^cubic-bezier\(/);
    expect(transition.easing.easeOut).toContain('cubic-bezier');
  });

  it('emits transition shorthands where every property carries its timing', () => {
    // Split only on commas that are outside `cubic-bezier(...)` so each
    // comma-separated <single-transition> is compared on its own.
    const splitTransitions = (value: string): string[] => {
      const entries: string[] = [];
      let depth = 0;
      let current = '';

      for (const char of value) {
        if (char === '(') depth += 1;
        if (char === ')') depth -= 1;

        if (char === ',' && depth === 0) {
          entries.push(current.trim());
          current = '';
          continue;
        }
        current += char;
      }
      if (current.trim()) entries.push(current.trim());
      return entries;
    };

    const entries = splitTransitions(transition.preset.colors);

    expect(entries).toHaveLength(5);
    entries.forEach(entry => {
      expect(entry).toMatch(/^[a-z-]+ \d+ms cubic-bezier\(/);
    });
  });
});

describe('design token build outputs', () => {
  const cssOutput = readOutput(cssOutputPath);
  const figmaOutput = JSON.parse(readOutput(figmaOutputPath)) as Record<string, unknown>;

  it('emits CSS custom properties for every token', () => {
    expect(cssOutput).toMatch(/:root\s*\{/);
    Object.keys(cssVars).forEach(name => {
      expect(cssOutput).toContain(`${name}:`);
    });
  });

  it('keeps the CSS custom property names unique', () => {
    const declaration = /^\s*(--[a-z0-9-]+):/gm;
    const declared: string[] = [];
    // `matchAll` is unavailable at the project's `target: es5`, so iterate
    // with a plain RegExp loop instead.
    let match: RegExpExecArray | null = declaration.exec(cssOutput);
    while (match !== null) {
      declared.push(match[1]);
      match = declaration.exec(cssOutput);
    }

    expect(declared.length).toBe(Object.keys(cssVars).length);
    expect(new Set(declared).size).toBe(declared.length);
  });

  it('has no unresolved {reference} left in the CSS output', () => {
    expect(cssOutput).not.toMatch(/\{[a-z0-9.]+\}/i);
  });

  it('emits a Tokens Studio compatible Figma token set', () => {
    const set = figmaOutput.global as Record<string, unknown>;
    expect(set).toBeDefined();
    expect(typeof set).toBe('object');

    const leaves: Array<{ value: unknown; type: unknown }> = [];
    const walk = (node: unknown): void => {
      if (typeof node !== 'object' || node === null) return;
      const record = node as Record<string, unknown>;
      if ('value' in record && 'type' in record) {
        leaves.push(record as { value: unknown; type: unknown });
        return;
      }
      Object.values(record).forEach(walk);
    };
    walk(set);

    expect(leaves.length).toBe(Object.keys(cssVars).length);
    leaves.forEach(leaf => {
      expect(leaf.value).not.toBeUndefined();
      expect(typeof leaf.type).toBe('string');
      expect((leaf.type as string).length).toBeGreaterThan(0);
    });
  });

  it('exposes colours, spacing, typography, radius, shadow and transition sets to Figma', () => {
    const set = figmaOutput.global as Record<string, unknown>;
    ['color', 'spacing', 'typography', 'radius', 'shadow', 'transition'].forEach(group => {
      expect(set[group]).toBeDefined();
    });
  });

  it('builds CSS variable references from token names', () => {
    expect(cssVar('--color-primary-base')).toBe('var(--color-primary-base)');
    expect(cssVars['--spacing-md']).toBe('16px');
    expect(tokens.spacing.md).toBe('16px');
  });

  it('produces a stable token surface across exports', () => {
    expect(Object.keys(tokens).sort()).toEqual(
      ['color', 'radius', 'shadow', 'spacing', 'transition', 'typography'].sort()
    );
  });
});

/**
 * Tokens Studio can store an `em` letter-spacing token but cannot apply it to a
 * Figma text node; `percent` is the unit Figma accepts. The Figma build
 * therefore converts `em` -> `%` (1em = 100%) while CSS and TypeScript keep the
 * authored `em` values.
 *
 * https://docs.tokens.studio/manage-tokens/token-types/typography/letter-spacing
 */
describe('design tokens — Figma letter-spacing units', () => {
  const figmaLetterSpacing = (
    JSON.parse(readOutput(figmaOutputPath)) as {
      global: { typography: { letterSpacing: Record<string, { value: unknown }> } };
    }
  ).global.typography.letterSpacing;

  it('converts every em value to percent', () => {
    expect(figmaLetterSpacing.tight.value).toBe('-2.5%');
    expect(figmaLetterSpacing.normal.value).toBe('0%');
    expect(figmaLetterSpacing.wide.value).toBe('2.5%');
    expect(figmaLetterSpacing.wider.value).toBe('5%');
  });

  it('leaves no unit letters anywhere in the Figma letter-spacing set', () => {
    const values = Object.entries(figmaLetterSpacing).map(
      ([name, token]) => [name, String(token.value)] as const
    );

    // Inspect the token values themselves (no message text) so a stray unit
    // cannot hide behind a diagnostic string.
    values.forEach(([, value]) => {
      expect(value).toMatch(/%$/);
      expect(value).not.toMatch(/[a-z]/i);
    });

    expect(Object.fromEntries(values)).toEqual({
      tight: '-2.5%',
      normal: '0%',
      wide: '2.5%',
      wider: '5%',
    });
  });

  it('keeps the authored em values in CSS and TypeScript', () => {
    expect(typography.letterSpacing.tight).toBe('-0.025em');
    expect(typography.letterSpacing.normal).toBe('0');
    expect(typography.letterSpacing.wide).toBe('0.025em');
    expect(typography.letterSpacing.wider).toBe('0.05em');

    const css = readOutput(cssOutputPath);
    expect(css).toContain('--typography-letter-spacing-tight: -0.025em');
    expect(css).toContain('--typography-letter-spacing-wide: 0.025em');
  });

  it('leaves the Figma font-family stacks untouched', () => {
    // The docs confirm comma separated fallback lists are supported, so the
    // sans stack must reach Figma verbatim rather than being rewritten.
    const fontFamily = (
      JSON.parse(readOutput(figmaOutputPath)) as {
        global: {
          typography: { fontFamily: Record<string, { value: unknown; type: string }> };
        };
      }
    ).global.typography.fontFamily;

    expect(fontFamily.sans.value).toBe(typography.fontFamily.sans);
    expect(String(fontFamily.sans.value)).toContain(',');
    expect(fontFamily.sans.type).toBe('fontFamilies');
  });
});

/**
 * `src/styles/App.css` declares a hand written `:root` block that the existing
 * pages consume through `var(--radius-md)`, `var(--shadow-sm)`, ... and is
 * bundled AFTER `src/styles/tokens.css`, so it currently wins the cascade for
 * those names. This test fails if the generated tokens ever disagree with it,
 * which would silently change the rendered UI the moment the legacy block is
 * removed or reordered.
 *
 * When the legacy block is deleted, the whole suite skips.
 */
describe('design tokens — parity with the legacy App.css :root block', () => {
  const extractRootBlock = (css: string): string | null => {
    const start = css.indexOf(':root');
    if (start === -1) return null;
    const open = css.indexOf('{', start);
    const close = css.indexOf('}', open);
    return open === -1 || close === -1 ? null : css.slice(open + 1, close);
  };

  const declarations = (block: string): Record<string, string> => {
    const result: Record<string, string> = {};
    const pattern = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
    let match = pattern.exec(block);
    while (match !== null) {
      result[match[1]] = match[2].replace(/\s+/g, ' ').trim();
      match = pattern.exec(block);
    }
    return result;
  };

  const normalize = (value: string): string => {
    // rem against a 16px root is byte-for-byte equivalent to px.
    const rem = value.match(/^([0-9.]+)rem$/);
    if (rem) return `${(Number(rem[1]) * 16).toFixed(4).replace(/\.?0+$/, '')}px`;
    return value;
  };

  const legacyBlock = extractRootBlock(readOutput(join(__dirname, 'App.css')));

  it('shares no custom property with a different value', () => {
    if (legacyBlock === null) {
      // The legacy hand written token block has been removed; nothing to compare.
      return;
    }

    const legacy = declarations(legacyBlock);
    const generated = declarations(readOutput(cssOutputPath));

    const shared = Object.keys(legacy).filter(name => name in generated);
    expect(shared.length).toBeGreaterThan(0);

    const conflicts = shared
      .filter(name => normalize(legacy[name]) !== normalize(generated[name]))
      .map(name => `${name}: legacy=${legacy[name]} | tokens=${generated[name]}`);

    expect(conflicts).toEqual([]);
  });

  it('keeps the legacy spacing scale in step with the 4px token scale', () => {
    if (legacyBlock === null) return;

    const legacy = declarations(legacyBlock);
    expect(legacy['--spacing-xs']).toBe('0.25rem');
    expect(legacy['--spacing-md']).toBe('1rem');
    expect(spacing.xs).toBe('4px');
    expect(spacing.md).toBe('16px');
  });
});

describe('design tokens — dark mode', () => {
  it('includes dark mode tokens in CSS output', () => {
    const cssOutput = readOutput(cssOutputPath);
    expect(cssOutput).toContain('@media (prefers-color-scheme: dark)');
    expect(cssOutput).toContain(':root.dark');
  });

  it('has dark mode color overrides', () => {
    const cssOutput = readOutput(cssOutputPath);
    // Dark mode should override semantic colors
    expect(cssOutput).toContain('--color-background-base:');
    expect(cssOutput).toMatch(
      /@media \(prefers-color-scheme: dark\)[\s\S]*--color-background-base:/
    );
  });
});
