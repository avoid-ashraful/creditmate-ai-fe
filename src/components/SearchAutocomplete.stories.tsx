import React, { useState } from 'react';

import SearchAutocomplete from './SearchAutocomplete';

export default {
  title: 'Components/SearchAutocomplete',
  component: SearchAutocomplete,
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
    viewport: { defaultViewport: 'tablet' },
  },
  argTypes: {
    value: { control: 'text' },
    onChange: { action: 'onChange' },
    onSearch: { action: 'onSearch' },
    onSelectCard: { action: 'onSelectCard' },
    onSelectBank: { action: 'onSelectBank' },
    onSelectCategory: { action: 'onSelectCategory' },
    onSelectFacet: { action: 'onSelectFacet' },
    placeholder: { control: 'text' },
    debounceMs: { control: { type: 'number', min: 0, max: 1000 } },
    minQueryLength: { control: { type: 'number', min: 1, max: 5 } },
    ariaLabel: { control: 'text' },
  },
};

/* State: default empty */
export const Default = {
  args: {
    value: '',
    onChange: () => {},
    onSearch: () => {},
  },
};

/* State: with initial value */
export const WithValue = {
  args: {
    value: 'Platinum',
    onChange: () => {},
    onSearch: () => {},
  },
};

/* State: with placeholder */
export const WithPlaceholder = {
  args: {
    value: '',
    onChange: () => {},
    onSearch: () => {},
    placeholder: 'Search cards, banks, or features...',
  },
};

/* State: Bengali placeholder */
export const Bengali = {
  args: {
    value: '',
    onChange: () => {},
    onSearch: () => {},
    placeholder: 'কার্ড, ব্যাংক বা বৈশিষ্ট্য খুঁজুন...',
    ariaLabel: 'অনুসন্ধান',
  },
};

/* State: with custom debounce */
export const CustomDebounce = {
  args: {
    value: '',
    onChange: () => {},
    onSearch: () => {},
    debounceMs: 300,
    minQueryLength: 3,
  },
};

/* State: interactive with mocked suggestions */
export const Interactive = () => {
  const [value, setValue] = useState('');
  const [lastSearch, setLastSearch] = useState('');
  const [lastSelection, setLastSelection] = useState<{ kind: string; label: string } | null>(null);

  return (
    <div style={{ maxWidth: '500px' }}>
      <SearchAutocomplete
        value={value}
        onChange={setValue}
        onSearch={q => setLastSearch(q)}
        onSelectCard={s => setLastSelection({ kind: 'card', label: s.name })}
        onSelectBank={s => setLastSelection({ kind: 'bank', label: s.name })}
        onSelectCategory={s => setLastSelection({ kind: 'category', label: s.name })}
        placeholder="Search by card name, bank, or features..."
      />
      <div
        style={{
          marginTop: '1rem',
          padding: '1rem',
          background: 'var(--color-background-surface)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.875rem',
        }}
      >
        <p>
          <strong>Current value:</strong> {value || '(empty)'}
        </p>
        <p>
          <strong>Last search:</strong> {lastSearch || '(none)'}
        </p>
        <p>
          <strong>Last selection:</strong>{' '}
          {lastSelection ? `${lastSelection.kind}: ${lastSelection.label}` : '(none)'}
        </p>
      </div>
    </div>
  );
};

/* State: minimum query length = 1 */
export const MinQueryOne = {
  args: {
    value: '',
    onChange: () => {},
    onSearch: () => {},
    minQueryLength: 1,
  },
};

/* State: with custom aria label */
export const CustomAriaLabel = {
  args: {
    value: '',
    onChange: () => {},
    onSearch: () => {},
    ariaLabel: 'Find credit cards',
  },
};

/* State: disabled-like (empty onChange) */
export const ReadOnly = {
  args: {
    value: 'Premium Card',
    onChange: () => {},
    onSearch: () => {},
  },
};

/* State: multiple instances */
export const MultipleInstances = () => {
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '500px' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          Primary Search
        </label>
        <SearchAutocomplete
          value={value1}
          onChange={setValue1}
          onSearch={() => {}}
          placeholder="Search cards..."
          ariaLabel="Primary search"
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          Secondary Search
        </label>
        <SearchAutocomplete
          value={value2}
          onChange={setValue2}
          onSearch={() => {}}
          placeholder="Search banks..."
          ariaLabel="Secondary search"
        />
      </div>
    </div>
  );
};
