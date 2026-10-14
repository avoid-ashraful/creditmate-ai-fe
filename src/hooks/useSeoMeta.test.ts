import { renderHook } from '@testing-library/react';

import { useSeoMeta } from './useSeoMeta';

/**
 * <head> lives outside the rendered tree, so Testing Library queries cannot
 * reach it. This helper is the only direct DOM access in this file.
 */
// eslint-disable-next-line testing-library/no-node-access
const headQuery = (selector: string): Element | null => document.head.querySelector(selector);

const readContent = (selector: string): string | null =>
  headQuery(selector)?.getAttribute('content') ?? null;

const OPTIONS = {
  title: 'Hook page | CreditMate AI',
  description: 'Set by the hook.',
  canonicalPath: '/about',
};

describe('useSeoMeta', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.title = 'Original Title';
  });

  test('applies metadata while mounted and restores the previous head on unmount', () => {
    const { unmount } = renderHook(() => useSeoMeta({ ...OPTIONS }));

    expect(document.title).toBe('Hook page | CreditMate AI');
    expect(readContent('meta[name="description"]')).toBe('Set by the hook.');
    expect(headQuery('link[rel="canonical"]')?.getAttribute('href')).toBe('http://localhost/about');

    unmount();

    expect(document.title).toBe('Original Title');
    expect(headQuery('meta[name="description"]')).toBeNull();
    expect(headQuery('link[rel="canonical"]')).toBeNull();
  });

  test('does nothing while options are null', () => {
    const { unmount } = renderHook(() => useSeoMeta(null));

    expect(document.title).toBe('Original Title');
    expect(headQuery('meta[name="description"]')).toBeNull();

    unmount();

    expect(document.title).toBe('Original Title');
  });

  test('re-applies only when option values change', () => {
    const { rerender } = renderHook(({ title }) => useSeoMeta({ ...OPTIONS, title }), {
      initialProps: { title: 'First' },
    });
    expect(document.title).toBe('First');

    rerender({ title: 'First' });
    expect(document.title).toBe('First');

    rerender({ title: 'Second' });
    expect(document.title).toBe('Second');
  });
});
