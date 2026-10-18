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
    expect(color.success.base).toBe(color.emerald['700']);
    expect(color.warning.base).toBe(color.amber['500']);
    expect(color.error.base).toBe(color.red['700']);
    expect(color.info.base).toBe(color.sky['700']);
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
    // Light mode tokens are at root level
    const lightTokenVars = Object.keys(cssVars).filter(name => !name.includes('-dark-'));
    lightTokenVars.forEach(name => {
      expect(cssOutput).toContain(`${name}:`);
    });
    // Dark mode tokens are in dark mode rules (renamed without -dark- prefix)
    const darkTokenVars = Object.keys(cssVars).filter(name => name.includes('-dark-'));
    darkTokenVars.forEach(name => {
      const renamedVar = name.replace('--color-dark-', '--color-');
      expect(cssOutput).toContain(`${renamedVar}:`);
    });
  });

  it('keeps the CSS custom property names unique within their scope', () => {
    // Extract unique variable names (accounting for multiple declarations in different scopes)
    const declaration = /^\s*(--[a-z0-9-]+):/gm;
    const declared: string[] = [];
    // `matchAll` is unavailable at the project's `target: es5`, so iterate
    // with a plain RegExp loop instead.
    let match: RegExpExecArray | null = declaration.exec(cssOutput);
    while (match !== null) {
      declared.push(match[1]);
      match = declaration.exec(cssOutput);
    }

    // Dark mode: semantic colors declared in multiple scopes:
    // 1. :root (light mode defaults)
    // 2. @media (prefers-color-scheme: dark) :root:not(.light) (system dark)
    // 3. :root.dark (manual dark override)
    // 4. :root.light (manual light override on dark system)
    // CSS emits semantic names only (--color-primary-base, not --color-dark-*).
    const uniqueVarNames = new Set(declared);
    const lightTokens = Object.keys(cssVars).filter(k => !k.includes('-dark-'));
    // Unique variable names should match the count of non-dark tokens
    expect(uniqueVarNames.size).toBe(lightTokens.length);
    // Total declarations > unique names due to multiple scopes
    expect(declared.length).toBeGreaterThan(uniqueVarNames.size);
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

describe('design tokens — WCAG contrast ratios', () => {
  /**
   * Compute relative luminance per WCAG 2.1 (sRGB).
   * https://www.w3.org/WAI/GL/wiki/Relative_luminance
   */
  function luminance(hex: string): number {
    const rgb = hexToRgb(hex);
    if (!rgb) throw new Error(`Invalid hex color: ${hex}`);
    const srgb = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map(c =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  }

  function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const m = hex.replace('#', '').match(/.{2}/g);
    if (!m) return null;
    return { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) };
  }

  function contrastRatio(fg: string, bg: string): number {
    const l1 = luminance(fg);
    const l2 = luminance(bg);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  // Semantic color pairs that must meet WCAG AA (4.5:1 for text, 3:1 for UI)
  // Format: [foregroundToken, backgroundToken, description, minRatio]
  // Note: Dark mode uses the same token names as light mode but different
  // values in @media (prefers-color-scheme: dark)
  const lightContrastPairs: Array<[string, string, string, number]> = [
    // Light mode text on background
    [
      '--color-text-primary',
      '--color-background-base',
      'Primary text on base background (light)',
      4.5,
    ],
    [
      '--color-text-secondary',
      '--color-background-base',
      'Secondary text on base background (light)',
      4.5,
    ],
    [
      '--color-text-tertiary',
      '--color-background-base',
      'Tertiary text on base background (light)',
      4.5,
    ],
    ['--color-text-primary', '--color-background-surface', 'Primary text on surface (light)', 4.5],
    [
      '--color-text-secondary',
      '--color-background-surface',
      'Secondary text on surface (light)',
      4.5,
    ],
    ['--color-text-on-primary', '--color-primary-base', 'Text on primary button (light)', 4.5],
    [
      '--color-text-on-primary',
      '--color-primary-hover',
      'Text on primary button hover (light)',
      4.5,
    ],
    [
      '--color-success-contrast',
      '--color-success-base',
      'Success text on success background (light)',
      4.5,
    ],
    [
      '--color-warning-contrast',
      '--color-warning-base',
      'Warning text on warning background (light)',
      4.5,
    ],
    ['--color-error-contrast', '--color-error-base', 'Error text on error background (light)', 4.5],
    ['--color-info-contrast', '--color-info-base', 'Info text on info background (light)', 4.5],
    // Light mode UI elements (borders, focus)
    ['--color-border-base', '--color-background-base', 'Border on base background (light)', 3.0],
    [
      '--color-border-focus',
      '--color-background-base',
      'Focus border on base background (light)',
      3.0,
    ],
    [
      '--color-border-error',
      '--color-background-base',
      'Error border on base background (light)',
      3.0,
    ],
  ];

  const darkContrastPairs: Array<[string, string, string, number]> = [
    // Dark mode text on background (same token names, different values in dark mode media query)
    [
      '--color-text-primary',
      '--color-background-base',
      'Primary text on base background (dark)',
      4.5,
    ],
    [
      '--color-text-secondary',
      '--color-background-base',
      'Secondary text on base background (dark)',
      4.5,
    ],
    [
      '--color-text-tertiary',
      '--color-background-base',
      'Tertiary text on base background (dark)',
      4.5,
    ],
    ['--color-text-primary', '--color-background-surface', 'Primary text on surface (dark)', 4.5],
    [
      '--color-text-secondary',
      '--color-background-surface',
      'Secondary text on surface (dark)',
      4.5,
    ],
    ['--color-text-on-primary', '--color-primary-base', 'Text on primary button (dark)', 4.5],
    [
      '--color-text-on-primary',
      '--color-primary-hover',
      'Text on primary button hover (dark)',
      4.5,
    ],
    [
      '--color-success-contrast',
      '--color-success-base',
      'Success text on success background (dark)',
      4.5,
    ],
    [
      '--color-warning-contrast',
      '--color-warning-base',
      'Warning text on warning background (dark)',
      4.5,
    ],
    ['--color-error-contrast', '--color-error-base', 'Error text on error background (dark)', 4.5],
    ['--color-info-contrast', '--color-info-base', 'Info text on info background (dark)', 4.5],
    // Dark mode UI elements
    ['--color-border-base', '--color-background-base', 'Border on base background (dark)', 3.0],
    [
      '--color-border-focus',
      '--color-background-base',
      'Focus border on base background (dark)',
      3.0,
    ],
    [
      '--color-border-error',
      '--color-background-base',
      'Error border on base background (dark)',
      3.0,
    ],
  ];

  // Build a map of all CSS variables for both light and dark
  function getCssVarMap(css: string): Map<string, string> {
    const map = new Map<string, string>();
    // Match CSS custom properties: --name: value;
    const pattern = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(css)) !== null) {
      const name = match[1];
      const value = match[2].trim();
      if (!map.has(name)) {
        map.set(name, value);
      }
    }
    return map;
  }

  const cssOutput = readOutput(cssOutputPath);
  const lightVars = getCssVarMap(cssOutput.split('@media (prefers-color-scheme: dark)')[0]);
  const darkVars = getCssVarMap(
    cssOutput.split('@media (prefers-color-scheme: dark)')[1]?.split(':root.dark')[0] || ''
  );

  // Helper to resolve a token value (handles var() references)
  function resolveToken(varMap: Map<string, string>, token: string): string {
    const value = varMap.get(token);
    if (!value) throw new Error(`Token not found: ${token}`);
    // If it's a var() reference, resolve it recursively
    const varMatch = value.match(/var\((--[a-z0-9-]+)\)/);
    if (varMatch) {
      return resolveToken(varMap, varMatch[1]);
    }
    return value;
  }

  [...lightContrastPairs, ...darkContrastPairs].forEach(
    ([fgToken, bgToken, description, minRatio]) => {
      it(`meets WCAG ${minRatio}:1 for ${description}`, () => {
        const isDark = description.includes('(dark)');
        const varMap = isDark ? darkVars : lightVars;
        const fgValue = resolveToken(varMap, fgToken);
        const bgValue = resolveToken(varMap, bgToken);

        // Both should be hex colors
        expect(fgValue).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(bgValue).toMatch(/^#[0-9a-fA-F]{6}$/);

        const ratio = contrastRatio(fgValue, bgValue);
        expect(ratio).toBeGreaterThanOrEqual(minRatio);
      });
    }
  );
});

// Browser axe cannot resolve every gradient or interactive state. Keep the
// shared text, filled-control and control-boundary pairs above their AA ratios.
describe('WCAG AA semantic contrast', () => {
  const luminance = (hex: string): number => {
    const channels = [1, 3, 5].map(index => {
      const value = parseInt(hex.slice(index, index + 2), 16) / 255;
      return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const ratio = (a: string, b: string): number => {
    const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (lighter + 0.05) / (darker + 0.05);
  };

  it.each([
    ['light', color],
    ['dark', color.dark],
  ] as const)('%s text and UI colors retain AA contrast', (_name, theme) => {
    const surfaces = [
      theme.background.base,
      theme.background.surface,
      theme.background.elevated,
      theme.background.muted,
    ];
    for (const background of surfaces) {
      for (const text of [theme.text.primary, theme.text.secondary, theme.text.tertiary]) {
        expect(ratio(text, background)).toBeGreaterThanOrEqual(4.5);
      }
      expect(ratio(theme.border.strong, background)).toBeGreaterThanOrEqual(3);
      expect(ratio(theme.border.focus, background)).toBeGreaterThanOrEqual(3);
    }
    for (const group of [theme.primary, theme.success, theme.error, theme.info]) {
      expect(ratio(group.base, group.contrast)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
