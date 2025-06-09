import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import HomePage from './HomePage';

// Mock the dummy data
jest.mock('../dummy-data/credit-cards', () => ({
  dummyBanks: [
    {
      id: 1,
      name: 'Test Bank',
      logo: '/test-logo.png',
      website: 'https://test.com',
      isActive: true,
    },
  ],
  dummyCreditCards: [
    {
      id: 1,
      bankId: 1,
      name: 'Test Credit Card',
      annualFee: 1000,
      interestRateApr: 20.0,
      loungeAccessInternational: 2,
      loungeAccessDomestic: 4,
      cashAdvanceFee: '2%',
      latePaymentFee: 'BDT 500',
      annualFeeWaiverPolicy: null,
      rewardPointsPolicy: 'Test rewards',
      additionalFeatures: ['Feature 1', 'Feature 2'],
      sourceUrl: 'https://test.com',
      isActive: true,
      lastUpdated: new Date(),
    },
  ],
}));

test('renders HomePage with credit card content', async () => {
  render(
    <BrowserRouter>
      <HomePage />
    </BrowserRouter>
  );

  // Check if the hero section is rendered
  const heroHeading = screen.getByText(/Find Your Perfect Credit Card/i);
  expect(heroHeading).toBeInTheDocument();

  // Wait for the credit cards to load (simulated API call)
  await screen.findByText(/Test Credit Card/i);

  // Check if credit card content is rendered
  const cardElement = screen.getByText(/Test Credit Card/i);
  expect(cardElement).toBeInTheDocument();

  const annualFeeElement = screen.getByText(/BDT 1,000/i);
  expect(annualFeeElement).toBeInTheDocument();

  const interestRateElement = screen.getByText(/20% APR/i);
  expect(interestRateElement).toBeInTheDocument();

  // Check if filter panel is rendered
  const filterElement = screen.getByText(/Filter Options/i);
  expect(filterElement).toBeInTheDocument();
});
