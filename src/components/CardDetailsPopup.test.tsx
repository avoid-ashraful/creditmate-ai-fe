import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CardDetailsPopup from './CardDetailsPopup';
import { CreditCard } from '../types';

// Create a mock credit card for testing
const mockCreditCard: CreditCard = {
  id: 1,
  bankId: 123,
  name: 'Premium Gold Card',
  annualFee: 5000,
  interestRateApr: 18.5,
  loungeAccessInternational: 2,
  loungeAccessDomestic: 3,
  cashAdvanceFee: '2%',
  latePaymentFee: 'BDT 500',
  annualFeeWaiverPolicy: {
    conditions: 'Annual fee waived if spending exceeds BDT 300,000 per year'
  },
  rewardPointsPolicy: 'Earn 1 point for every BDT 50 spent',
  additionalFeatures: ['Free SMS alerts', 'Contactless payments', 'EMI facilities'],
  sourceUrl: 'https://example.com',
  isActive: true,
  lastUpdated: new Date('2023-01-01'),
  images: [
    {
      small: 'https://example.com/card-small-1.jpg',
      full: 'https://example.com/card-full-1.jpg',
    },
    {
      small: 'https://example.com/card-small-2.jpg',
      full: 'https://example.com/card-full-2.jpg',
    },
  ],
};

// Create a mock credit card without images for testing edge cases
const mockCreditCardNoImages: CreditCard = {
  ...mockCreditCard,
  id: 2,
  images: [],
};

// Create a mock credit card without annual fee waiver policy
const mockCreditCardNoWaiver: CreditCard = {
  ...mockCreditCard,
  id: 3,
  annualFeeWaiverPolicy: null,
};

// Create a mock credit card without lounge access
const mockCreditCardNoLounge: CreditCard = {
  ...mockCreditCard,
  id: 4,
  loungeAccessInternational: 0,
  loungeAccessDomestic: 0,
};

describe('CardDetailsPopup Component', () => {
  // Test basic rendering
  test('renders card details correctly', () => {
    render(
      <CardDetailsPopup 
        card={mockCreditCard} 
        onClose={jest.fn()} 
        onAddToCompare={jest.fn()} 
        isInCompareList={false} 
      />
    );
    
    // Check if card name is rendered
    expect(screen.getByText('Premium Gold Card')).toBeInTheDocument();
    
    // Check if bank ID is rendered
    expect(screen.getByText('Bank ID: 123')).toBeInTheDocument();
    
    // Check if annual fee is rendered
    expect(screen.getByText('BDT 5,000')).toBeInTheDocument();
    
    // Check if interest rate is rendered
    expect(screen.getByText('18.5% APR')).toBeInTheDocument();
    
    // Check if lounge access is rendered
    expect(screen.getByText('2 visits per year')).toBeInTheDocument();
    expect(screen.getByText('3 visits per year')).toBeInTheDocument();
    
    // Check if fees are rendered
    expect(screen.getByText('2%')).toBeInTheDocument();
    expect(screen.getByText('BDT 500')).toBeInTheDocument();
    
    // Check if annual fee waiver policy is rendered
    expect(screen.getByText('Annual fee waived if spending exceeds BDT 300,000 per year')).toBeInTheDocument();
    
    // Check if rewards policy is rendered
    expect(screen.getByText('Earn 1 point for every BDT 50 spent')).toBeInTheDocument();
    
    // Check if features are rendered
    expect(screen.getByText('Free SMS alerts')).toBeInTheDocument();
    expect(screen.getByText('Contactless payments')).toBeInTheDocument();
    expect(screen.getByText('EMI facilities')).toBeInTheDocument();
    
    // Check if source URL is rendered
    expect(screen.getByText('Official Website')).toBeInTheDocument();
    
    // Check if last updated date is rendered
    expect(screen.getByText('1/1/2023')).toBeInTheDocument();
    
    // Check if add to compare button is rendered
    expect(screen.getByText('Add to Compare')).toBeInTheDocument();
  });

  // Test card without images
  test('renders card without images correctly', () => {
    render(
      <CardDetailsPopup 
        card={mockCreditCardNoImages} 
        onClose={jest.fn()} 
        onAddToCompare={jest.fn()} 
        isInCompareList={false} 
      />
    );
    
    // Check if card name is still rendered
    expect(screen.getByText('Premium Gold Card')).toBeInTheDocument();
    
    // Check that no image gallery is rendered
    const imageGallery = document.querySelector('.card-image-gallery');
    expect(imageGallery).not.toBeInTheDocument();
  });

  // Test card without annual fee waiver policy
  test('renders card without annual fee waiver policy correctly', () => {
    render(
      <CardDetailsPopup 
        card={mockCreditCardNoWaiver} 
        onClose={jest.fn()} 
        onAddToCompare={jest.fn()} 
        isInCompareList={false} 
      />
    );
    
    // Check if "Not available" is displayed for annual fee waiver
    expect(screen.getByText('Not available')).toBeInTheDocument();
  });

  // Test card without lounge access
  test('renders card without lounge access correctly', () => {
    render(
      <CardDetailsPopup 
        card={mockCreditCardNoLounge} 
        onClose={jest.fn()} 
        onAddToCompare={jest.fn()} 
        isInCompareList={false} 
      />
    );
    
    // Check if "Not available" is displayed for lounge access
    const notAvailableTexts = screen.getAllByText('Not available');
    expect(notAvailableTexts.length).toBeGreaterThanOrEqual(2);
  });

  // Test image navigation
  test('navigates through images correctly', () => {
    render(
      <CardDetailsPopup 
        card={mockCreditCard} 
        onClose={jest.fn()} 
        onAddToCompare={jest.fn()} 
        isInCompareList={false} 
      />
    );
    
    // Check if image counter shows correct initial state
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    
    // Check if the first image is displayed
    const initialImage = document.querySelector('.card-full-image') as HTMLImageElement;
    expect(initialImage.src).toContain('card-full-1.jpg');
    
    // Click next button
    fireEvent.click(screen.getByText('>'));
    
    // Check if image counter is updated
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    
    // Check if the second image is displayed
    const nextImage = document.querySelector('.card-full-image') as HTMLImageElement;
    expect(nextImage.src).toContain('card-full-2.jpg');
    
    // Click next button again (should cycle back to first image)
    fireEvent.click(screen.getByText('>'));
    
    // Check if image counter is updated
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    
    // Check if the first image is displayed again
    const cycledImage = document.querySelector('.card-full-image') as HTMLImageElement;
    expect(cycledImage.src).toContain('card-full-1.jpg');
    
    // Click previous button
    fireEvent.click(screen.getByText('<'));
    
    // Check if image counter is updated
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    
    // Check if the second image is displayed
    const prevImage = document.querySelector('.card-full-image') as HTMLImageElement;
    expect(prevImage.src).toContain('card-full-2.jpg');
  });

  // Test add to compare functionality
  test('calls onAddToCompare when add to compare button is clicked', () => {
    const mockOnAddToCompare = jest.fn();
    render(
      <CardDetailsPopup 
        card={mockCreditCard} 
        onClose={jest.fn()} 
        onAddToCompare={mockOnAddToCompare} 
        isInCompareList={false} 
      />
    );
    
    // Click the add to compare button
    fireEvent.click(screen.getByText('Add to Compare'));
    
    // Check if onAddToCompare was called with the correct card
    expect(mockOnAddToCompare).toHaveBeenCalledTimes(1);
    expect(mockOnAddToCompare).toHaveBeenCalledWith(mockCreditCard);
  });

  // Test remove from compare functionality
  test('shows remove from compare button when card is in compare list', () => {
    render(
      <CardDetailsPopup 
        card={mockCreditCard} 
        onClose={jest.fn()} 
        onAddToCompare={jest.fn()} 
        isInCompareList={true} 
      />
    );
    
    // Check if the remove from compare button is rendered
    expect(screen.getByText('Remove from Compare')).toBeInTheDocument();
  });

  // Test close button functionality
  test('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    render(
      <CardDetailsPopup 
        card={mockCreditCard} 
        onClose={mockOnClose} 
        onAddToCompare={jest.fn()} 
        isInCompareList={false} 
      />
    );
    
    // Click the close button
    fireEvent.click(screen.getByText('×'));
    
    // Check if onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Test overlay click closes the popup
  test('calls onClose when overlay is clicked', () => {
    const mockOnClose = jest.fn();
    render(
      <CardDetailsPopup 
        card={mockCreditCard} 
        onClose={mockOnClose} 
        onAddToCompare={jest.fn()} 
        isInCompareList={false} 
      />
    );
    
    // Click the overlay (not the popup content)
    fireEvent.click(document.querySelector('.popup-overlay')!);
    
    // Check if onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Test event propagation - clicking inside popup doesn't close it
  test('does not call onClose when clicking inside popup content', () => {
    const mockOnClose = jest.fn();
    render(
      <CardDetailsPopup 
        card={mockCreditCard} 
        onClose={mockOnClose} 
        onAddToCompare={jest.fn()} 
        isInCompareList={false} 
      />
    );
    
    // Click inside the popup content
    fireEvent.click(screen.getByText('Premium Gold Card'));
    
    // Check that onClose was not called
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  // Test with a card that has only one image (no navigation buttons)
  test('does not show navigation buttons for single image', () => {
    const cardWithOneImage = {
      ...mockCreditCard,
      images: [mockCreditCard.images[0]],
    };
    
    render(
      <CardDetailsPopup 
        card={cardWithOneImage} 
        onClose={jest.fn()} 
        onAddToCompare={jest.fn()} 
        isInCompareList={false} 
      />
    );
    
    // Check that navigation buttons are not rendered
    expect(screen.queryByText('>')).not.toBeInTheDocument();
    expect(screen.queryByText('<')).not.toBeInTheDocument();
  });
});