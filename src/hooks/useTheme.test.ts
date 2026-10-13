import { renderHook, act } from '@testing-library/react';

import { useTheme } from './useTheme';

const THEME_STORAGE_KEY = 'creditmate-theme';

// Helper to create matchMedia mock
function createMatchMediaMock(isDark = false) {
  return jest.fn().mockImplementation(query => ({
    matches: isDark && query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    jest.clearAllMocks();
    // Reset matchMedia mock for each test
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: createMatchMediaMock(false),
    });
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('initializes with light theme by default', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(result.current.isDark).toBe(false);
  });

  it('persists theme to localStorage', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('applies dark class to html element', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes dark class when switching to light', () => {
    document.documentElement.classList.add('dark');
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('light');
    });

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggles theme', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('respects prefers-color-scheme on first load', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: createMatchMediaMock(true),
    });

    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(true);
  });

  it('uses localStorage preference over system preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: createMatchMediaMock(true),
    });

    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });

  it('responds to system theme changes when no manual override exists', () => {
    // Create a real MediaQueryList mock we can interact with
    let listener: ((e: MediaQueryListEvent) => void) | null = null;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn((event, callback) => {
          if (event === 'change') {
            listener = callback as ((e: MediaQueryListEvent) => void) | null;
          }
        }),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(false);

    // Simulate system preference change
    const listenerFn = listener as unknown as (e: MediaQueryListEvent) => void;
    expect(listenerFn).toBeDefined();
    act(() => {
      listenerFn({ matches: true } as MediaQueryListEvent);
    });
    expect(result.current.isDark).toBe(true);
  });

  it('ignores system theme changes when localStorage has manual override', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    // Create a real MediaQueryList mock we can interact with
    let listener: ((e: MediaQueryListEvent) => void) | null = null;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn((event, callback) => {
          if (event === 'change') {
            listener = callback as ((e: MediaQueryListEvent) => void) | null;
          }
        }),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(true);

    // Simulate system preference change to light
    const listenerFn = listener as unknown as (e: MediaQueryListEvent) => void;
    expect(listenerFn).toBeDefined();
    act(() => {
      listenerFn({ matches: false } as MediaQueryListEvent);
    });
    // Should still be dark (localStorage override persists)
    expect(result.current.isDark).toBe(true);
  });

  it('applies light class when switching to light mode', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('light');
    });

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('explicit light mode overrides system dark preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: createMatchMediaMock(true), // System prefers dark
    });

    const { result } = renderHook(() => useTheme());
    // Should be light despite system preference
    expect(result.current.isDark).toBe(false);
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
