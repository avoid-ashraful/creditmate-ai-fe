import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { ThemeProvider } from '../hooks/ThemeProvider';
import { CreditCard } from '../types';

import ComparisonBar from './ComparisonBar';

const mockCards: CreditCard[] = [
  {
    id: 1,
    name: 'EBL Platinum Card',
    bankId: 1,
    bankName: 'Eastern Bank Limited',
    annualFee: 5000,
    interestRateApr: 24.5,
    loungeAccessInternational: '6 visits',
    loungeAccessDomestic: '12 visits',
    cashAdvanceFee: '2.5% or BDT 500',
    latePaymentFee: 'BDT 1000',
    annualFeeWaiverPolicy: { conditions: 'Must spend BDT 300,000' },
    rewardPointsPolicy: '1 point per BDT 50',
    additionalFeatures: ['Feature 1'],
    sourceUrl: 'https://example.com',
    isActive: true,
    images: [{ small: '/img.png', full: '/img-full.png' }],
    lastUpdated: new Date('2025-05-15'),
  },
  {
    id: 2,
    name: 'SCB Visa Platinum',
    bankId: 2,
    bankName: 'Standard Chartered Bank',
    annualFee: 4000,
    interestRateApr: 25.0,
    loungeAccessInternational: '8 visits',
    loungeAccessDomestic: '12 visits',
    cashAdvanceFee: '2% or BDT 500',
    latePaymentFee: 'BDT 1200',
    annualFeeWaiverPolicy: { conditions: 'Spend BDT 250,000' },
    rewardPointsPolicy: '1 point per BDT 40',
    additionalFeatures: ['Feature 2'],
    sourceUrl: 'https://example.com',
    isActive: true,
    images: [{ small: '/img.png', full: '/img-full.png' }],
    lastUpdated: new Date('2025-05-28'),
  },
  {
    id: 3,
    name: 'BRAC Bank Signature',
    bankId: 3,
    bankName: 'BRAC Bank Limited',
    annualFee: 6000,
    interestRateApr: 23.5,
    loungeAccessInternational: '10 visits',
    loungeAccessDomestic: '24 visits',
    cashAdvanceFee: '2% or BDT 600',
    latePaymentFee: 'BDT 1000',
    annualFeeWaiverPolicy: { conditions: 'Spend BDT 400,000' },
    rewardPointsPolicy: '2 points per BDT 100',
    additionalFeatures: ['Feature 3'],
    sourceUrl: 'https://example.com',
    isActive: true,
    images: [{ small: '/img.png', full: '/img-full.png' }],
    lastUpdated: new Date('2025-06-10'),
  },
  {
    id: 4,
    name: 'City Bank American Express Gold',
    bankId: 4,
    bankName: 'City Bank Limited',
    annualFee: 4500,
    interestRateApr: 24.0,
    loungeAccessInternational: '6 visits',
    loungeAccessDomestic: '12 visits',
    cashAdvanceFee: '2.5% or BDT 550',
    latePaymentFee: 'BDT 1000',
    annualFeeWaiverPolicy: { conditions: 'Spend BDT 350,000' },
    rewardPointsPolicy: 'Amex points',
    additionalFeatures: ['Feature 4'],
    sourceUrl: 'https://example.com',
    isActive: true,
    images: [{ small: '/img.png', full: '/img-full.png' }],
    lastUpdated: new Date('2025-07-01'),
  },
];

const withProviders = (Story: React.FC) => (
  <MemoryRouter initialEntries={['/']}>
    <ThemeProvider>
      <Story />
    </ThemeProvider>
  </MemoryRouter>
);

export default {
  title: 'Components/ComparisonBar',
  component: ComparisonBar,
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
    viewport: { defaultViewport: 'tablet' },
  },
  argTypes: {
    selectedCards: { control: false, description: 'Array of selected credit cards' },
    onRemoveCard: { action: 'onRemoveCard', description: 'Callback when a card is removed' },
    maxSelections: {
      control: { type: 'number', min: 1, max: 5 },
      description: 'Maximum cards allowed for comparison',
    },
  },
  decorators: [withProviders],
};

/* State: no cards selected (renders null) */
export const Empty = {
  args: {
    selectedCards: [],
    onRemoveCard: () => {},
    maxSelections: 4,
  },
};

/* State: 1 card selected - compare button disabled */
export const OneCard = {
  args: {
    selectedCards: [mockCards[0]],
    onRemoveCard: () => {},
    maxSelections: 4,
  },
};

/* State: 2 cards selected - compare button enabled */
export const TwoCards = {
  args: {
    selectedCards: [mockCards[0], mockCards[1]],
    onRemoveCard: () => {},
    maxSelections: 4,
  },
};

/* State: 3 cards selected */
export const ThreeCards = {
  args: {
    selectedCards: [mockCards[0], mockCards[1], mockCards[2]],
    onRemoveCard: () => {},
    maxSelections: 4,
  },
};

/* State: 4 cards selected - at maximum */
export const FourCards = {
  args: {
    selectedCards: mockCards,
    onRemoveCard: () => {},
    maxSelections: 4,
  },
};

/* State: 5 cards with maxSelections=5 */
export const FiveCardsMaxFive = {
  args: {
    selectedCards: [
      ...mockCards,
      {
        id: 5,
        name: 'DBBL Titanium Card',
        bankId: 5,
        bankName: 'Dutch-Bangla Bank Limited',
        annualFee: 3000,
        interestRateApr: 22.0,
        loungeAccessInternational: '4 visits',
        loungeAccessDomestic: '8 visits',
        cashAdvanceFee: '2.5% or BDT 500',
        latePaymentFee: 'BDT 800',
        annualFeeWaiverPolicy: { conditions: 'Spend BDT 200,000' },
        rewardPointsPolicy: '1 point per BDT 75',
        additionalFeatures: ['Feature 5'],
        sourceUrl: 'https://example.com',
        isActive: true,
        images: [{ small: '/img.png', full: '/img-full.png' }],
        lastUpdated: new Date('2025-08-15'),
      },
    ],
    onRemoveCard: () => {},
    maxSelections: 5,
  },
};

/* State: interactive demo with removal logging */
export const Interactive = () => {
  const [selectedCards, setSelectedCards] = React.useState<CreditCard[]>([
    mockCards[0],
    mockCards[1],
  ]);
  const [lastRemoved, setLastRemoved] = React.useState<string>('(none)');
  const [compareMessage, setCompareMessage] = React.useState<string>('');

  const handleRemove = (cardId: number) => {
    const card = selectedCards.find(c => c.id === cardId);
    setLastRemoved(card?.name || 'Unknown');
    setSelectedCards(selectedCards.filter(c => c.id !== cardId));
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <ComparisonBar selectedCards={selectedCards} onRemoveCard={handleRemove} maxSelections={4} />
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
          <strong>Selected cards:</strong> {selectedCards.length}/4
        </p>
        <p>
          <strong>Last removed:</strong> {lastRemoved}
        </p>
        <p>
          <strong>Compare enabled:</strong> {selectedCards.length >= 2 ? 'Yes' : 'No'}
        </p>
        {compareMessage && <p style={{ color: 'var(--color-error)' }}>{compareMessage}</p>}
      </div>
    </div>
  );
};

/* State: cards with null fee/APR values */
export const WithNullValues = {
  args: {
    selectedCards: [
      {
        ...mockCards[0],
        annualFee: null,
        interestRateApr: null,
      },
      {
        ...mockCards[1],
        annualFee: null,
      },
    ],
    onRemoveCard: () => {},
    maxSelections: 4,
  },
};

/* State: single card with long name */
export const LongCardName = {
  args: {
    selectedCards: [
      {
        ...mockCards[0],
        name: 'Very Long Premium Platinum Credit Card Name That Should Test Truncation',
      },
    ],
    onRemoveCard: () => {},
    maxSelections: 4,
  },
};

/* State: mobile viewport */
export const Mobile = {
  args: {
    selectedCards: [mockCards[0], mockCards[1]],
    onRemoveCard: () => {},
    maxSelections: 4,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

/* State: dark mode */
export const DarkMode = {
  args: {
    selectedCards: [mockCards[0], mockCards[1], mockCards[2]],
    onRemoveCard: () => {},
    maxSelections: 4,
  },
  decorators: [
    (Story: React.FC) => (
      <MemoryRouter initialEntries={['/']}>
        <ThemeProvider>
          <div data-theme="dark" style={{ padding: '1rem' }}>
            <Story />
          </div>
        </ThemeProvider>
      </MemoryRouter>
    ),
  ],
};

/* State: reduced motion (simulated via decorator note) */
export const ReducedMotionNote = {
  args: {
    selectedCards: [mockCards[0], mockCards[1]],
    onRemoveCard: () => {},
    maxSelections: 4,
  },
  parameters: {
    docs: {
      description: {
        story:
          'This component respects `prefers-reduced-motion` via the `usePrefersReducedMotion` hook. Animations for card chips (enter/exit) and the bar entrance are disabled when reduced motion is enabled.',
      },
    },
  },
};

/* State: with custom maxSelections */
export const CustomMaxSelections = {
  args: {
    selectedCards: [mockCards[0]],
    onRemoveCard: () => {},
    maxSelections: 3,
  },
};

/* State: remove card interaction test */
export const RemoveInteraction = () => {
  const [cards, setCards] = React.useState<CreditCard[]>([
    mockCards[0],
    mockCards[1],
    mockCards[2],
  ]);
  const [log, setLog] = React.useState<string[]>([]);

  const handleRemove = (cardId: number) => {
    const card = cards.find(c => c.id === cardId);
    setLog(prev => [`Removed: ${card?.name}`, ...prev].slice(0, 5));
    setCards(cards.filter(c => c.id !== cardId));
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <ComparisonBar selectedCards={cards} onRemoveCard={handleRemove} maxSelections={4} />
      <div
        style={{
          marginTop: '1rem',
          padding: '1rem',
          background: 'var(--color-background-surface)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.875rem',
        }}
      >
        <strong>Removal Log:</strong>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
          {log.map((entry, i) => (
            <li key={i}>{entry}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/* State: compare button click with insufficient cards */
export const CompareDisabledInteraction = () => {
  const [cards, setCards] = React.useState<CreditCard[]>([mockCards[0]]);
  const [message, setMessage] = React.useState<string>('');

  return (
    <div style={{ maxWidth: '600px' }}>
      <ComparisonBar
        selectedCards={cards}
        onRemoveCard={id => setCards(cards.filter(c => c.id !== id))}
        maxSelections={4}
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
          <strong>Selected cards:</strong> {cards.length}/4
        </p>
        <p>
          <strong>Status:</strong>{' '}
          {cards.length >= 2 ? 'Ready to compare' : 'Need at least 2 cards'}
        </p>
        {message && <p style={{ color: 'var(--color-error)' }}>{message}</p>}
        <button
          onClick={() => {
            if (cards.length < 2) {
              setMessage('Please select at least 2 cards to compare');
            } else {
              setMessage('Navigating to comparison page...');
            }
          }}
          style={{ marginTop: '0.5rem', padding: '0.5rem 1rem' }}
        >
          Simulate Compare Click
        </button>
      </div>
    </div>
  );
};
