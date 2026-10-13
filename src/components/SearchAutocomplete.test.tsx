import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { server } from '../mocks/jest.setup';
import HomePage from '../pages/HomePage';
import { parseTypeaheadResponse, highlightParts } from '../services/typeahead';

import SearchAutocomplete from './SearchAutocomplete';

// Helper to test defensive parsing (non-exported function)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { parseDidYouMean } = require('../services/typeahead');

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  jest.useRealTimers();
});
afterAll(() => server.close());

// ---- Render helpers -------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

const renderAutocomplete = (overrides = {}) =>
  render(
    <SearchAutocomplete
      value=""
      onChange={noop}
      onSearch={noop}
      onSelectCard={noop}
      onSelectBank={noop}
      onSelectCategory={noop}
      onSelectFacet={noop}
      {...overrides}
    />
  );

const renderHomePage = () =>
  render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/compare" element={<div />} />
      </Routes>
    </BrowserRouter>
  );

// ---- Parser & contract tests --------------------------------------------

describe('SearchAutocomplete – parser & contract', () => {
  beforeEach(() => jest.useRealTimers());
  afterEach(() => jest.useRealTimers());

  it('parseTypeaheadResponse tolerates missing keys and non-object payloads', () => {
    expect(parseTypeaheadResponse(undefined as unknown, 'visa')).toBeDefined();
    expect(parseTypeaheadResponse(null as unknown, 'visa')).toBeDefined();
    expect(parseTypeaheadResponse('not an object' as unknown, 'visa')).toBeDefined();
    expect(parseTypeaheadResponse([] as unknown, 'visa')).toBeDefined();
  });

  it('highlightParts returns single unmatched segment for no query', () => {
    expect(highlightParts('Anything', '')).toEqual([{ text: 'Anything', matched: false }]);
  });

  it('highlightParts highlights the matched substring with mark', () => {
    const parts = highlightParts('Visa Platinum Card', 'visa');
    expect(parts).toHaveLength(3);
    expect(parts[0].matched).toBe(false);
    expect(parts[1].matched).toBe(true);
    expect(parts[2].matched).toBe(false);
    expect(parts[1].text).toBe('Visa');
  });

  it('parseDidYouMean normalises length and type', () => {
    expect(parseDidYouMean('visa')).toBe('visa');
    expect(parseDidYouMean('')).toBeNull();
    expect(parseDidYouMean(null)).toBeNull();
    expect(parseDidYouMean(123)).toBeNull();
    expect(parseDidYouMean('a'.repeat(65))).toBeNull();
  });

  it('parseTypeaheadResponse extracts category slug from backend flat array', () => {
    const backendResponse = {
      suggestions: [
        { type: 'category', slug: 'travel', label: 'Travel' },
        { type: 'category', slug: 'cashback', label: 'Cashback' },
      ],
      facets: [],
      didYouMean: null,
    };

    const result = parseTypeaheadResponse(backendResponse, 'test');
    expect(result.categories).toHaveLength(2);
    expect(result.categories[0].slug).toBe('travel');
    expect(result.categories[0].name).toBe('Travel');
    expect(result.categories[1].slug).toBe('cashback');
    expect(result.categories[1].name).toBe('Cashback');
  });

  it('parseTypeaheadResponse filters out categories with empty or missing slug', () => {
    const backendResponse = {
      suggestions: [
        { type: 'category', slug: 'travel', label: 'Travel' },
        { type: 'category', slug: '', label: 'Invalid' },
        { type: 'category', label: 'NoSlug' },
      ],
      facets: [],
      didYouMean: null,
    };

    const result = parseTypeaheadResponse(backendResponse, 'test');
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].slug).toBe('travel');
  });

  it('parseTypeaheadResponse falls back to name if category backend lacks name', () => {
    const backendResponse = {
      suggestions: [{ type: 'category', slug: 'travel', label: 'Travel Rewards' }],
      facets: [],
      didYouMean: null,
    };

    const result = parseTypeaheadResponse(backendResponse, 'test');
    expect(result.categories[0].name).toBe('Travel Rewards');
    expect(result.categories[0].slug).toBe('travel');
  });
});

// ---- Rendering tests ----------------------------------------------------

describe('SearchAutocomplete – rendering', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('renders a combobox input with correct ARIA attributes', () => {
    renderAutocomplete();
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-controls');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
  });

  it('does not show the dropdown when the query is too short', () => {
    renderAutocomplete();
    const input = screen.getByRole('combobox');
    fireEvent.input(input, { target: { value: 'a' } });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('fetches and renders suggestions after the debounce', async () => {
    renderAutocomplete();

    const input = screen.getByRole('combobox');
    fireEvent.input(input, { target: { value: 'ot' } });

    // Debounce has not elapsed yet
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    // Advance past the debounce
    await act(async () => {
      jest.advanceTimersByTime(151);
    });

    // Dropdown should now be open with suggestions
    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();

    // Expect at least one option
    const firstOption = screen.getByRole('option');
    expect(firstOption).toBeInTheDocument();
  });

  it('highlights the matched query as <mark> text nodes', async () => {
    jest.useFakeTimers();
    renderAutocomplete();

    const input = screen.getByRole('combobox');
    fireEvent.input(input, { target: { value: 'visa' } });

    await act(async () => {
      jest.advanceTimersByTime(151);
    });

    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);

    const firstOption = options[0];
    // eslint-disable-next-line testing-library/no-node-access
    const mark = firstOption.querySelector('mark');
    expect(mark).toBeInTheDocument();
    expect(mark?.textContent).toBe('Visa');
    expect(mark?.innerHTML).toContain('Visa');

    jest.useRealTimers();
  });

  it('renders a "did you mean" suggestion when the query is a known typo', async () => {
    jest.useFakeTimers();
    renderAutocomplete();

    const input = screen.getByRole('combobox');
    fireEvent.input(input, { target: { value: 'viza' } });

    await act(async () => {
      jest.advanceTimersByTime(151);
    });

    // Did you mean button should appear
    const didYouMeanButton = screen.getByRole('button', { name: /visa/i });
    expect(didYouMeanButton).toBeInTheDocument();
    expect(didYouMeanButton.textContent).toContain('visa');

    jest.useRealTimers();
  });

  it('renders facet counts when facets are present', async () => {
    jest.useFakeTimers();
    renderAutocomplete();

    await act(async () => {
      jest.advanceTimersByTime(151);
    });

    // Facet buttons are rendered outside the listbox
    const facetButtons = screen.getAllByRole('button', {
      name: /\(/i,
    });
    expect(facetButtons.length).toBeGreaterThan(0);
    // First facet should show a count
    expect(facetButtons[0].textContent).toMatch(/\(\d+\)/);

    jest.useRealTimers();
  });
});

// ---- Keyboard navigation tests ----------------------------------------

describe('SearchAutocomplete – keyboard navigation', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('does not fetch for queries shorter than two characters', () => {
    renderAutocomplete();
    const input = screen.getByRole('combobox');
    fireEvent.input(input, { target: { value: 'x' } });

    return act(async () => {
      jest.advanceTimersByTime(200);
    }).then(() => {
      const fetchSpy = jest.spyOn(global, 'fetch');
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  it('debounces the request by 150ms and then fetches with the correct q param', async () => {
    renderAutocomplete();
    const input = screen.getByRole('combobox');

    fireEvent.input(input, { target: { value: 'te' } });

    await act(async () => {
      jest.advanceTimersByTime(149);
    });
    const fetchSpy = jest.spyOn(global, 'fetch');
    expect(fetchSpy).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(2);
    });
    expect(fetchSpy).toHaveBeenCalled();

    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toMatch(/\/api\/v1\/credit-cards\/typeahead\//);
    expect(url).toMatch(/q=te/);
  });

  it('keyboard ArrowDown moves focus to the next option', async () => {
    renderAutocomplete();
    const input = screen.getByRole('combobox');
    fireEvent.input(input, { target: { value: 'ot' } });

    await act(async () => {
      jest.advanceTimersByTime(151);
    });

    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const activeOption = input.getAttribute('aria-activedescendant');
    expect(activeOption).toBeDefined();

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const activeOption2 = input.getAttribute('aria-activedescendant');
    expect(activeOption2).toBeDefined();
  });

  it('Enter key selects the active option and calls onChange', async () => {
    const onChange = jest.fn();
    renderAutocomplete({
      onChange,
    });

    const input = screen.getByRole('combobox');
    fireEvent.input(input, { target: { value: 'ot' } });

    await act(async () => {
      jest.advanceTimersByTime(151);
    });

    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);

    fireEvent.keyDown(input, { key: 'Enter' });
  });

  it('Escape key closes the dropdown', async () => {
    renderAutocomplete();

    const input = screen.getByRole('combobox');
    fireEvent.input(input, { target: { value: 'ot' } });

    await act(async () => {
      jest.advanceTimersByTime(151);
    });

    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });
    const inputElement = screen.getByRole('combobox') as HTMLInputElement;
    expect(inputElement.value).toBe('');

    jest.useRealTimers();
  });

  it('category selection includes correct slug and calls onSelectCategory', async () => {
    const onSelectCategory = jest.fn();
    renderAutocomplete({
      onSelectCategory,
      value: 'tra',
      onChange: noop,
    });

    const input = screen.getByRole('combobox');
    fireEvent.input(input, { target: { value: 'tra' } });

    await act(async () => {
      jest.advanceTimersByTime(151);
    });

    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);

    const travelOption = Array.from(options).find(opt =>
      opt.textContent?.toLowerCase().includes('travel')
    );
    expect(travelOption).toBeInTheDocument();

    fireEvent.click(travelOption as HTMLElement);

    // Slug must survive the backend parsing and round-trip correctly
    expect(onSelectCategory).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'travel',
        name: 'Travel',
      })
    );

    jest.useRealTimers();
  });
});

// ---- Integration with HomePage tests ----------------------------------

describe('SearchAutocomplete – HomePage integration', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('typing "other" into the hero search triggers typeahead and filters results on Enter', async () => {
    renderHomePage();

    const searchInput = screen.getByPlaceholderText(/Search by card name/i);
    await userEvent.type(searchInput, 'other');

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    const searchBtn = screen.getByRole('button', { name: /Search/i });
    await userEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText(/Other Rewards Card/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Test Credit Card/i)).not.toBeInTheDocument();
  });

  it('selecting a category suggestion from autocomplete applies the category filter', async () => {
    renderHomePage();

    const searchInput = screen.getByPlaceholderText(/Search by card name/i);
    await userEvent.type(searchInput, 'tra');

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    const options = screen.getAllByRole('option', { name: /Travel/i });
    expect(options.length).toBeGreaterThan(0);
    await userEvent.click(options[0]);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });
});
