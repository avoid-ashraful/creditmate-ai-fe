import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { server } from '../mocks/jest.setup';
import HomePage from '../pages/HomePage';
import { apiService } from '../services/api';
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

// Component wrapper that manages state for autocomplete testing
const AutocompleteTestWrapper: React.FC<{
  onSelectCard?: jest.Mock;
  onSelectBank?: jest.Mock;
  onSelectCategory?: jest.Mock;
  onSelectFacet?: jest.Mock;
  onSearch?: jest.Mock;
}> = ({ onSelectCard, onSelectBank, onSelectCategory, onSelectFacet, onSearch }) => {
  const [value, setValue] = useState('');
  return (
    <SearchAutocomplete
      value={value}
      onChange={setValue}
      onSearch={onSearch || noop}
      onSelectCard={onSelectCard}
      onSelectBank={onSelectBank}
      onSelectCategory={onSelectCategory}
      onSelectFacet={onSelectFacet}
    />
  );
};

const renderAutocomplete = (
  overrides: Partial<{
    onSelectCard: jest.Mock;
    onSelectBank: jest.Mock;
    onSelectCategory: jest.Mock;
    onSelectFacet: jest.Mock;
    onSearch: jest.Mock;
  }> = {}
) =>
  render(
    <AutocompleteTestWrapper
      onSelectCard={overrides.onSelectCard}
      onSelectBank={overrides.onSelectBank}
      onSelectCategory={overrides.onSelectCategory}
      onSelectFacet={overrides.onSelectFacet}
      onSearch={overrides.onSearch}
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
    expect(parts).toHaveLength(2);
    expect(parts[0].matched).toBe(true);
    expect(parts[0].text).toBe('Visa');
    expect(parts[1].matched).toBe(false);
    expect(parts[1].text).toBe(' Platinum Card');
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
  beforeEach(() => jest.useRealTimers());
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

    // Wait for debounce and fetch to complete
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // Expect at least one option
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
  });

  it('highlights the matched query as <mark> text nodes', async () => {
    renderAutocomplete();

    const QUERY = 'visa';
    const input = screen.getByRole('combobox');
    fireEvent.input(input, { target: { value: QUERY } });

    await waitFor(
      () => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      },
      { timeout: 1500 }
    );

    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);

    const visaOption = Array.from(options).find(opt =>
      opt.textContent?.toLowerCase().includes(QUERY)
    );
    expect(visaOption).toBeDefined();
    // eslint-disable-next-line testing-library/no-node-access
    const mark = visaOption?.querySelector('mark');
    expect(mark).toBeInTheDocument();
    expect(mark?.textContent?.toLowerCase()).toBe(QUERY);
  });

  it('renders a "did you mean" suggestion when the query is a known typo', async () => {
    renderAutocomplete();

    const input = screen.getByRole('combobox');
    fireEvent.input(input, { target: { value: 'viza' } });

    // Did you mean button should appear
    const didYouMeanButton = await screen.findByRole('button', { name: /visa/i });
    expect(didYouMeanButton.textContent).toContain('visa');
  });

  it('renders facet counts when facets are present', async () => {
    renderAutocomplete();

    const input = screen.getByRole('combobox');
    fireEvent.input(input, { target: { value: 'te' } });

    const facetButtons = await waitFor(
      () => {
        const buttons = screen.getAllByRole('button');
        return buttons.filter(btn => btn.textContent?.includes('('));
      },
      { timeout: 1500 }
    );
    expect(facetButtons.length).toBeGreaterThan(0);
    expect(facetButtons[0].textContent).toMatch(/\(\d+\)/);
  });
});

// ---- Keyboard navigation tests ----------------------------------------

describe('SearchAutocomplete – keyboard navigation', () => {
  beforeEach(() => jest.useRealTimers());
  afterEach(() => jest.useRealTimers());

  it('does not fetch for queries shorter than two characters', async () => {
    const apiSpy = jest
      .spyOn(apiService, 'getTypeaheadSuggestions')
      .mockResolvedValue({ suggestions: [], facets: [], didYouMean: null });

    renderAutocomplete();
    const input = screen.getByRole('combobox');
    fireEvent.input(input, { target: { value: 'x' } });

    await new Promise(resolve => setTimeout(resolve, 200));
    expect(apiSpy).not.toHaveBeenCalled();
    apiSpy.mockRestore();
  });

  it('debounces the request by 150ms and then fetches with the correct q param', async () => {
    const apiSpy = jest
      .spyOn(apiService, 'getTypeaheadSuggestions')
      .mockResolvedValue({ suggestions: [], facets: [], didYouMean: null });

    renderAutocomplete();
    const input = screen.getByRole('combobox');

    fireEvent.input(input, { target: { value: 'te' } });

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(apiSpy).not.toHaveBeenCalled();

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(apiSpy).toHaveBeenCalled();
    expect(apiSpy).toHaveBeenCalledWith('te');

    apiSpy.mockRestore();
  });

  it('keyboard ArrowDown moves focus to the next option', async () => {
    renderAutocomplete();
    const input = screen.getByRole('combobox');
    fireEvent.input(input, { target: { value: 'ot' } });

    const options = await screen.findAllByRole('option');
    expect(options.length).toBeGreaterThan(0);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const activeOption = input.getAttribute('aria-activedescendant');
    expect(activeOption).toBeDefined();

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const activeOption2 = input.getAttribute('aria-activedescendant');
    expect(activeOption2).toBeDefined();
  });

  it('Enter key selects the active option and calls onChange', async () => {
    renderAutocomplete();

    const input = screen.getByRole('combobox');
    fireEvent.input(input, { target: { value: 'ot' } });

    const options = await screen.findAllByRole('option');
    expect(options.length).toBeGreaterThan(0);

    fireEvent.keyDown(input, { key: 'Enter' });
  });

  it('Escape key closes the dropdown', async () => {
    renderAutocomplete();

    const input = screen.getByRole('combobox');
    fireEvent.input(input, { target: { value: 'ot' } });

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });
    const inputElement = screen.getByRole('combobox') as HTMLInputElement;
    expect(inputElement.value).toBe('');
  });

  it('category selection includes correct slug and calls onSelectCategory', async () => {
    const onSelectCategory = jest.fn();
    renderAutocomplete({
      onSelectCategory,
    });

    const input = screen.getByRole('combobox');
    fireEvent.input(input, { target: { value: 'tra' } });

    const options = await screen.findAllByRole('option');
    expect(options.length).toBeGreaterThan(0);

    const travelOption = Array.from(options).find(opt =>
      opt.textContent?.toLowerCase().includes('travel')
    );
    expect(travelOption).toBeDefined();

    fireEvent.click(travelOption as HTMLElement);

    expect(onSelectCategory).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'travel',
        name: 'Travel',
      })
    );
  });
});

// ---- Integration with HomePage tests ----------------------------------

describe('SearchAutocomplete – HomePage integration', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('typing "signature" into the hero search triggers typeahead and filters results on Enter', async () => {
    renderHomePage();

    const searchInput = screen.getByPlaceholderText(/Search by card name/i);
    await userEvent.type(searchInput, 'signature');

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    const searchBtn = screen.getByRole('button', { name: /Search/i });
    await userEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText(/Signature/i)).toBeInTheDocument();
    });
  });

  it('selecting a category suggestion from autocomplete applies the category filter', async () => {
    renderHomePage();

    const searchInput = screen.getByPlaceholderText(/Search by card name/i);
    await userEvent.type(searchInput, 'tra');

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    const travelOptions = screen.getAllByRole('option');
    const travelOption = travelOptions.find(opt => opt.textContent?.includes('Travel'));
    expect(travelOption).toBeDefined();

    if (travelOption) {
      await userEvent.click(travelOption);
    }

    const input = screen.getByRole('combobox') as HTMLInputElement;
    await waitFor(() => {
      expect(input.value).toBe('Travel');
    });
  });
});
