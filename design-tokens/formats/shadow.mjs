/**
 * Converts a CSS `box-shadow` value into the object/array shape the Tokens
 * Studio for Figma plugin expects for a `boxShadow` token.
 *
 *   "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
 *   -> [ { x, y, blur, spread, color, type }, { ... } ]
 */

/** Splits on commas that are not nested inside `rgba(...)`-style parentheses. */
export function splitTopLevelCommas(value) {
  const parts = [];
  let depth = 0;
  let current = '';

  for (const char of value) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;

    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }

  if (current.trim() !== '') parts.push(current);
  return parts.map(part => part.trim()).filter(Boolean);
}

const COLOUR_START = /^(#|rgba?\(|hsla?\(|[a-z]+$)/i;
const MAX_DIMENSIONS = 4;

export function parseShadow(shadow) {
  const parts = shadow.trim().split(/\s+/);

  let inset = false;
  if (parts[0] === 'inset') {
    inset = true;
    parts.shift();
  }

  const dimensions = [];
  while (parts.length > 0 && dimensions.length < MAX_DIMENSIONS && !COLOUR_START.test(parts[0])) {
    dimensions.push(parts.shift());
  }

  // `stroke | 0 | 0` style shorthands omit trailing lengths; pad them so the
  // Figma object always has all four geometry fields.
  while (dimensions.length < MAX_DIMENSIONS) dimensions.push('0');

  const color = parts.join(' ') || 'rgba(0, 0, 0, 0)';

  return {
    x: dimensions[0],
    y: dimensions[1],
    blur: dimensions[2],
    spread: dimensions[3],
    color,
    type: inset ? 'innerShadow' : 'dropShadow',
  };
}

/**
 * Returns the Figma value for a shadow token. Tokens that are not a concrete
 * shadow (`none`) are returned unchanged with their type downgraded, because
 * the plugin cannot build a shadow paint out of `none`.
 */
export function shadowValue(value) {
  if (value === 'none') {
    return { type: 'other', value };
  }

  const shadows = splitTopLevelCommas(value).map(parseShadow);
  return { type: 'boxShadow', value: shadows.length === 1 ? shadows[0] : shadows };
}
