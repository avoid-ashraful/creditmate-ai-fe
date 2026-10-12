/**
 * Converts a `letterSpacing` token value into the unit Figma understands.
 *
 * Tokens Studio can *store* an `em` letter-spacing token but cannot apply it to
 * a Figma text node — see
 * https://docs.tokens.studio/manage-tokens/token-types/typography/letter-spacing,
 * which documents `percent` as the usable Figma unit. Since 1em is 100% of the
 * font size, the conversion is a plain x100.
 *
 *   '-0.025em' -> '-2.5%'
 *   '0.05em'   -> '5%'
 *   '0'        -> '0%'
 *   '2px'      -> '2px'   (already a usable Figma unit)
 *
 * This is applied to the **Figma output only**. The CSS and TypeScript builds
 * keep the authored `em` values, which is what the stylesheet wants.
 */
export function figmaLetterSpacing(value) {
  if (typeof value !== 'string') return value;

  const em = value.trim().match(/^(-?\d*\.?\d+)em$/);
  if (em) {
    return `${Number((parseFloat(em[1]) * 100).toFixed(6))}%`;
  }

  // A bare `0` is unitless in CSS but Figma expects a unit.
  if (value.trim() === '0') return '0%';

  // `px` and `%` are already valid Figma units; leave them alone.
  return value;
}
