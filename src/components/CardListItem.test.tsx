import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CardListItem from './CardListItem';
import { CreditCard } from '../types';

// Mock the framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: React.PropsWithChildren<any>) => (
        <div {...props}>{children}</div>
      ),
      button: ({ children, ...props }: React.PropsWithChildren<any>) => (
        <button {...props}>{children}</button>
      ),
    },
  };
});

// Create a mock credit card for testing
const mockCreditCard: CreditCard = {
  id: 1,
  bankId: 123,
  name: 'Test Credit Card',
  annualFee: 5000,
  interestRateApr: 18.5,
  loungeAccessInternational: 2,
  loungeAccessDomestic: 3,
  cashAdvanceFee: '2%',
  latePaymentFee: 'BDT 500',
  annualFeeWaiverPolicy: null,
  rewardPointsPolicy: 'Earn 1 point for every BDT 50 spent',
  additionalFeatures: ['Free SMS alerts', 'Contactless payments', 'EMI facilities'],
  sourceUrl: 'https://example.com',
  isActive: true,
  lastUpdated: new Date('2023-01-01'),
  images: [
    {
      small: 'https://example.com/card-small.jpg',
      full: 'https://example.com/card-full.jpg',
    },
  ],
};

// Create a mock credit card without images for testing edge cases
const mockCreditCardNoImages: CreditCard = {
  ...mockCreditCard,
  id: 2,
  images: [],
};

// Create a mock credit card without lounge access for testing edge cases
const mockCreditCardNoLounge: CreditCard = {
  ...mockCreditCard,
  id: 3,
  loungeAccessInternational: 0,
  loungeAccessDomestic: 0,
};

describe('CardListItem Component', () => {
  // Test basic rendering
  test('renders card information correctly', () => {
    render(<CardListItem card={mockCreditCard} />);
    
    // Check if card name is rendered
    expect(screen.getByText('Test Credit Card')).toBeInTheDocument();
    
    // Check if bank ID is rendered
    expect(screen.getByText('Bank ID: 123')).toBeInTheDocument();
    
    // Check if annual fee is rendered
    expect(screen.getByText('BDT 5,000')).toBeInTheDocument();
    
    // Check if interest rate is rendered
    expect(screen.getByText('18.5% APR')).toBeInTheDocument();
    
    // Check if lounge access is rendered
    expect(screen.getByText('2 Int\'l / 3 Domestic')).toBeInTheDocument();
    
    // Check if rewards policy is rendered
    expect(screen.getByText('Earn 1 point for every BDT 50 spent')).toBeInTheDocument();
    
    // Check if features are rendered
    expect(screen.getByText('Free SMS alerts')).toBeInTheDocument();
    expect(screen.getByText('Contactless payments')).toBeInTheDocument();
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });

  // Test card without images
  test('renders card without images correctly', () => {
    render(<CardListItem card={mockCreditCardNoImages} />);
    
    // Check if card name is still rendered
    expect(screen.getByText('Test Credit Card')).toBeInTheDocument();
    
    // Check that no image is rendered
    const cardImageDiv = document.querySelector('.card-image');
    expect(cardImageDiv).not.toBeInTheDocument();
  });

  // Test card without lounge access
  test('renders card without lounge access correctly', () => {
    render(<CardListItem card={mockCreditCardNoLounge} />);
    
    // Check if "None" is displayed for lounge access
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  // Test selectable card
  test('renders selectable card with add to compare button', () => {
    render(<CardListItem card={mockCreditCard} selectable={true} />);
    
    // Check if the add to compare button is rendered
    expect(screen.getByText('Add to Compare')).toBeInTheDocument();
  });

  // Test selected card
  test('renders selected card with remove from compare button', () => {
    render(<CardListItem card={mockCreditCard} selectable={true} isSelected={true} />);
    
    // Check if the remove from compare button is rendered
    expect(screen.getByText('Remove from Compare')).toBeInTheDocument();
  });

  // Test onSelect callback
  test('calls onSelect when add to compare button is clicked', () => {
    const mockOnSelect = jest.fn();
    render(
      <CardListItem 
        card={mockCreditCard} 
        selectable={true} 
        onSelect={mockOnSelect} 
      />
    );
    
    // Click the add to compare button
    fireEvent.click(screen.getByText('Add to Compare'));
    
    // Check if onSelect was called
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  // Test onViewDetails callback
  test('calls onViewDetails when card is clicked', () => {
    const mockOnViewDetails = jest.fn();
    render(
      <CardListItem 
        card={mockCreditCard} 
        onViewDetails={mockOnViewDetails} 
      />
    );
    
    // Click the card
    fireEvent.click(screen.getByText('Test Credit Card'));
    
    // Check if onViewDetails was called with the correct card
    expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
    expect(mockOnViewDetails).toHaveBeenCalledWith(mockCreditCard);
  });

  // Test edge case: no callbacks provided
  test('handles click events when no callbacks are provided', () => {
    render(<CardListItem card={mockCreditCard} />);
    
    // Click the card (should not throw errors)
    fireEvent.click(screen.getByText('Test Credit Card'));
    
    // Test passes if no error is thrown
  });

  // Test edge case: card with many features
  test('renders card with many features correctly', () => {
    const cardWithManyFeatures = {
      ...mockCreditCard,
      additionalFeatures: [
        'Feature 1', 'Feature 2', 'Feature 3', 'Feature 4', 'Feature 5'
      ],
    };
    
    render(<CardListItem card={cardWithManyFeatures} />);
    
    // Check if only the first two features are shown
    expect(screen.getByText('Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Feature 2')).toBeInTheDocument();
    
    // Check if the "+3 more" text is shown
    expect(screen.getByText('+3 more')).toBeInTheDocument();
  });
});