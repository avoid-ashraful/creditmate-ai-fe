const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Return the tabbable descendants of `container` in DOM order. Elements that
 * are hidden from assistive tech or removed from the layout are skipped.
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    element =>
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      element.tabIndex !== -1
  );
}

/**
 * Keep Tab / Shift+Tab inside `container`. Attach to the dialog's keydown.
 * Returns true when focus was wrapped.
 */
export function trapTabKey(
  event: KeyboardEvent | React.KeyboardEvent,
  container: HTMLElement
): boolean {
  if (event.key !== 'Tab') return false;

  const focusable = getFocusableElements(container);
  if (focusable.length === 0) {
    event.preventDefault();
    return true;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement as HTMLElement | null;

  if (event.shiftKey) {
    if (active === first || !container.contains(active)) {
      event.preventDefault();
      last.focus();
      return true;
    }
  } else if (active === last || !container.contains(active)) {
    event.preventDefault();
    first.focus();
    return true;
  }

  return false;
}
