import React from 'react';

/**
 * Preload/prefetch utilities for route-level code splitting.
 * Adds link rel="prefetch" or rel="preload" on hover/focus of navigation links.
 */

type PreloadStrategy = 'prefetch' | 'preload';

interface PreloadOptions {
  strategy?: PreloadStrategy;
  /** Delay in ms before prefetching after hover/focus (default: 50) */
  delay?: number;
  /** Only prefetch once per link (default: true) */
  once?: boolean;
}

const preloadedLinks = new Set<string>();

/**
 * Create a preload link element and add it to the document head.
 */
function addPreloadLink(href: string, strategy: PreloadStrategy = 'prefetch'): void {
  if (preloadedLinks.has(href)) return;

  const link = document.createElement('link');
  link.rel = strategy;
  link.href = href;
  link.as = 'script';
  document.head.appendChild(link);
  preloadedLinks.add(href);
}

/**
 * Attach prefetch behavior to a navigation link element.
 * Call this in a useEffect or onMount for each nav link.
 */
export function setupNavLinkPrefetch(
  element: HTMLAnchorElement,
  options: PreloadOptions = {}
): () => void {
  const { strategy = 'prefetch', delay = 50, once = true } = options;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let hasTriggered = false;

  const trigger = () => {
    if (once && hasTriggered) return;
    hasTriggered = true;
    addPreloadLink(element.href, strategy);
  };

  const handleMouseEnter = () => {
    timeoutId = setTimeout(trigger, delay);
  };

  const handleFocus = () => {
    timeoutId = setTimeout(trigger, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
  };

  const handleBlur = () => {
    if (timeoutId) clearTimeout(timeoutId);
  };

  element.addEventListener('mouseenter', handleMouseEnter);
  element.addEventListener('focus', handleFocus);
  element.addEventListener('mouseleave', handleMouseLeave);
  element.addEventListener('blur', handleBlur);

  return () => {
    element.removeEventListener('mouseenter', handleMouseEnter);
    element.removeEventListener('focus', handleFocus);
    element.removeEventListener('mouseleave', handleMouseLeave);
    element.removeEventListener('blur', handleBlur);
    if (timeoutId) clearTimeout(timeoutId);
  };
}

/**
 * Hook to add prefetch behavior to all navigation links matching a selector.
 * Use in a component that renders the navigation.
 */
export function useNavLinkPrefetch(
  selector = 'nav[aria-label="Main navigation"] a',
  options: PreloadOptions = {}
): void {
  React.useEffect(() => {
    const links = document.querySelectorAll<HTMLAnchorElement>(selector);
    const cleanups = Array.from(links).map(link => setupNavLinkPrefetch(link, options));
    return () => cleanups.forEach(cleanup => cleanup());
  }, [selector, options]);
}
