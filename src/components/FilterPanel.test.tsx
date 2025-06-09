import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterPanel from './FilterPanel';
import { Bank, CardFilterOptions } from '../types';

// Mock data for banks
const mockBanks: Bank[] = [
  {
    id: 1,
    name: 'Bank A',
    logo: 'bank-a-logo.png',
    website: 'https://banka.com',
    isActive: true,
  },
  {
    id: 2,
    name: 'Bank B',
    logo: 'bank-b-logo.png',
    website: 'https://bankb.com',
    isActive: true,
  },
  {
    id: 3,
    name: 'Bank C',
    logo: 'bank-c-logo.png',
    website: 'https://bankc.com',
    isActive: false,
  },
];

// Mock initial filters
const mockInitialFilters: CardFilterOptions = {
  bankIds: [1],
  minAnnualFee: 1000,
  maxAnnualFee: 5000,
  minInterestRate: 10,
  maxInterestRate: 20,
  hasInternationalLounge: true,
  hasDomesticLounge: false,
  searchTerm: 'premium',
};

describe('FilterPanel Component', () => {
  // Test basic rendering
  test('renders filter panel in collapsed state by default', () => {
    render(
      <FilterPanel 
        banks={mockBanks} 
        onFilterChange={jest.fn()} 
      />
    );
    
    // Check if the header is rendered
    expect(screen.getByText('Filter Options')).toBeInTheDocument();
    
    // Check if the panel is collapsed (Expand button is visible)
    expect(screen.getByText('Expand')).toBeInTheDocument();
    
    // Check that filter content is not visible
    expect(screen.queryByText('Banks')).not.toBeInTheDocument();
  });

  // Test expanding the panel
  test('expands panel when header is clicked', () => {
    render(
      <FilterPanel 
        banks={mockBanks} 
        onFilterChange={jest.fn()} 
      />
    );
    
    // Click the header to expand
    fireEvent.click(screen.getByText('Filter Options'));
    
    // Check if the panel is expanded (Collapse button is visible)
    expect(screen.getByText('Collapse')).toBeInTheDocument();
    
    // Check that filter content is now visible
    expect(screen.getByText('Banks')).toBeInTheDocument();
    expect(screen.getByText('Annual Fee')).toBeInTheDocument();
    expect(screen.getByText('Interest Rate (APR)')).toBeInTheDocument();
    expect(screen.getByText('Lounge Access')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  // Test rendering with initial filters
  test('renders with initial filters applied', () => {
    render(
      <FilterPanel 
        banks={mockBanks} 
        onFilterChange={jest.fn()} 
        initialFilters={mockInitialFilters}
      />
    );
    
    // Expand the panel to see the filters
    fireEvent.click(screen.getByText('Filter Options'));
    
    // Check if bank checkbox is checked
    const bankACheckbox = screen.getByLabelText('Bank A') as HTMLInputElement;
    expect(bankACheckbox.checked).toBe(true);
    
    // Check if annual fee inputs have correct values
    const minAnnualFeeInput = screen.getByLabelText('Min (BDT):') as HTMLInputElement;
    expect(minAnnualFeeInput.value).toBe('1000');
    
    const maxAnnualFeeInput = screen.getByLabelText('Max (BDT):') as HTMLInputElement;
    expect(maxAnnualFeeInput.value).toBe('5000');
    
    // Check if interest rate inputs have correct values
    const minInterestRateInput = screen.getByLabelText('Min (%):') as HTMLInputElement;
    expect(minInterestRateInput.value).toBe('10');
    
    const maxInterestRateInput = screen.getByLabelText('Max (%):') as HTMLInputElement;
    expect(maxInterestRateInput.value).toBe('20');
    
    // Check if lounge access checkboxes have correct values
    const internationalLoungeCheckbox = screen.getByLabelText('International Lounge Access') as HTMLInputElement;
    expect(internationalLoungeCheckbox.checked).toBe(true);
    
    const domesticLoungeCheckbox = screen.getByLabelText('Domestic Lounge Access') as HTMLInputElement;
    expect(domesticLoungeCheckbox.checked).toBe(false);
    
    // Check if search term has correct value
    const searchInput = screen.getByPlaceholderText('Search by card name or features') as HTMLInputElement;
    expect(searchInput.value).toBe('premium');
  });

  // Test bank selection
  test('handles bank selection correctly', () => {
    const mockOnFilterChange = jest.fn();
    render(
      <FilterPanel 
        banks={mockBanks} 
        onFilterChange={mockOnFilterChange} 
      />
    );
    
    // Expand the panel
    fireEvent.click(screen.getByText('Filter Options'));
    
    // Select Bank A
    fireEvent.click(screen.getByLabelText('Bank A'));
    
    // Select Bank B
    fireEvent.click(screen.getByLabelText('Bank B'));
    
    // Apply filters
    fireEvent.click(screen.getByText('Apply Filters'));
    
    // Check if onFilterChange was called with correct bank IDs
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        bankIds: [1, 2]
      })
    );
    
    // Unselect Bank A
    fireEvent.click(screen.getByLabelText('Bank A'));
    
    // Apply filters again
    fireEvent.click(screen.getByText('Apply Filters'));
    
    // Check if onFilterChange was called with updated bank IDs
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        bankIds: [2]
      })
    );
  });

  // Test annual fee range inputs
  test('handles annual fee range inputs correctly', () => {
    const mockOnFilterChange = jest.fn();
    render(
      <FilterPanel 
        banks={mockBanks} 
        onFilterChange={mockOnFilterChange} 
      />
    );
    
    // Expand the panel
    fireEvent.click(screen.getByText('Filter Options'));
    
    // Set min annual fee
    const minAnnualFeeInput = screen.getByLabelText('Min (BDT):');
    fireEvent.change(minAnnualFeeInput, { target: { value: '1000' } });
    
    // Set max annual fee
    const maxAnnualFeeInput = screen.getByLabelText('Max (BDT):');
    fireEvent.change(maxAnnualFeeInput, { target: { value: '5000' } });
    
    // Apply filters
    fireEvent.click(screen.getByText('Apply Filters'));
    
    // Check if onFilterChange was called with correct annual fee range
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        minAnnualFee: 1000,
        maxAnnualFee: 5000
      })
    );
  });

  // Test interest rate range inputs
  test('handles interest rate range inputs correctly', () => {
    const mockOnFilterChange = jest.fn();
    render(
      <FilterPanel 
        banks={mockBanks} 
        onFilterChange={mockOnFilterChange} 
      />
    );
    
    // Expand the panel
    fireEvent.click(screen.getByText('Filter Options'));
    
    // Set min interest rate
    const minInterestRateInput = screen.getByLabelText('Min (%):');
    fireEvent.change(minInterestRateInput, { target: { value: '10.5' } });
    
    // Set max interest rate
    const maxInterestRateInput = screen.getByLabelText('Max (%):');
    fireEvent.change(maxInterestRateInput, { target: { value: '20.5' } });
    
    // Apply filters
    fireEvent.click(screen.getByText('Apply Filters'));
    
    // Check if onFilterChange was called with correct interest rate range
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        minInterestRate: 10.5,
        maxInterestRate: 20.5
      })
    );
  });

  // Test lounge access checkboxes
  test('handles lounge access checkboxes correctly', () => {
    const mockOnFilterChange = jest.fn();
    render(
      <FilterPanel 
        banks={mockBanks} 
        onFilterChange={mockOnFilterChange} 
      />
    );
    
    // Expand the panel
    fireEvent.click(screen.getByText('Filter Options'));
    
    // Check international lounge access
    fireEvent.click(screen.getByLabelText('International Lounge Access'));
    
    // Check domestic lounge access
    fireEvent.click(screen.getByLabelText('Domestic Lounge Access'));
    
    // Apply filters
    fireEvent.click(screen.getByText('Apply Filters'));
    
    // Check if onFilterChange was called with correct lounge access options
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        hasInternationalLounge: true,
        hasDomesticLounge: true
      })
    );
    
    // Uncheck international lounge access
    fireEvent.click(screen.getByLabelText('International Lounge Access'));
    
    // Apply filters again
    fireEvent.click(screen.getByText('Apply Filters'));
    
    // Check if onFilterChange was called with updated lounge access options
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        hasInternationalLounge: false,
        hasDomesticLounge: true
      })
    );
  });

  // Test search input
  test('handles search input correctly', () => {
    const mockOnFilterChange = jest.fn();
    render(
      <FilterPanel 
        banks={mockBanks} 
        onFilterChange={mockOnFilterChange} 
      />
    );
    
    // Expand the panel
    fireEvent.click(screen.getByText('Filter Options'));
    
    // Enter search term
    const searchInput = screen.getByPlaceholderText('Search by card name or features');
    fireEvent.change(searchInput, { target: { value: 'premium card' } });
    
    // Apply filters
    fireEvent.click(screen.getByText('Apply Filters'));
    
    // Check if onFilterChange was called with correct search term
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        searchTerm: 'premium card'
      })
    );
  });

  // Test reset button
  test('resets all filters when reset button is clicked', () => {
    const mockOnFilterChange = jest.fn();
    render(
      <FilterPanel 
        banks={mockBanks} 
        onFilterChange={mockOnFilterChange} 
        initialFilters={mockInitialFilters}
      />
    );
    
    // Expand the panel
    fireEvent.click(screen.getByText('Filter Options'));
    
    // Click reset button
    fireEvent.click(screen.getByText('Reset'));
    
    // Check if onFilterChange was called with empty filters
    expect(mockOnFilterChange).toHaveBeenCalledWith({});
    
    // Check if all inputs are reset
    const bankACheckbox = screen.getByLabelText('Bank A') as HTMLInputElement;
    expect(bankACheckbox.checked).toBe(false);
    
    const minAnnualFeeInput = screen.getByLabelText('Min (BDT):') as HTMLInputElement;
    expect(minAnnualFeeInput.value).toBe('');
    
    const maxAnnualFeeInput = screen.getByLabelText('Max (BDT):') as HTMLInputElement;
    expect(maxAnnualFeeInput.value).toBe('');
    
    const minInterestRateInput = screen.getByLabelText('Min (%):') as HTMLInputElement;
    expect(minInterestRateInput.value).toBe('');
    
    const maxInterestRateInput = screen.getByLabelText('Max (%):') as HTMLInputElement;
    expect(maxInterestRateInput.value).toBe('');
    
    const internationalLoungeCheckbox = screen.getByLabelText('International Lounge Access') as HTMLInputElement;
    expect(internationalLoungeCheckbox.checked).toBe(false);
    
    const domesticLoungeCheckbox = screen.getByLabelText('Domestic Lounge Access') as HTMLInputElement;
    expect(domesticLoungeCheckbox.checked).toBe(false);
    
    const searchInput = screen.getByPlaceholderText('Search by card name or features') as HTMLInputElement;
    expect(searchInput.value).toBe('');
  });

  // Test empty input handling
  test('handles empty inputs correctly', () => {
    const mockOnFilterChange = jest.fn();
    render(
      <FilterPanel 
        banks={mockBanks} 
        onFilterChange={mockOnFilterChange} 
      />
    );
    
    // Expand the panel
    fireEvent.click(screen.getByText('Filter Options'));
    
    // Set min annual fee then clear it
    const minAnnualFeeInput = screen.getByLabelText('Min (BDT):');
    fireEvent.change(minAnnualFeeInput, { target: { value: '1000' } });
    fireEvent.change(minAnnualFeeInput, { target: { value: '' } });
    
    // Apply filters
    fireEvent.click(screen.getByText('Apply Filters'));
    
    // Check if onFilterChange was called with undefined for empty inputs
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        minAnnualFee: undefined
      })
    );
  });

  // Test with no banks
  test('renders correctly with empty banks array', () => {
    render(
      <FilterPanel 
        banks={[]} 
        onFilterChange={jest.fn()} 
      />
    );
    
    // Expand the panel
    fireEvent.click(screen.getByText('Filter Options'));
    
    // Check that the banks section is still rendered but empty
    expect(screen.getByText('Banks')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Bank/)).not.toBeInTheDocument();
  });
});