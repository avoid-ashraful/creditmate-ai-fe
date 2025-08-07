/* eslint-disable no-console */
// Simple test to verify range filter formats
// This is a manual test file for development purposes

import { apiService } from './api';

// Test the different range filter formats
const testRangeFilters = async () => {
  console.log('Testing API Range Filters...\n');

  // Test 1: Individual min/max parameters
  console.log('Test 1: Individual min/max parameters');
  const filters1 = {
    annualFeeRange: { min: 0, max: 5000 },
    interestRateRange: { min: 20, max: 25 },
  };

  try {
    const response1 = await apiService.getCreditCards(filters1);
    console.log('✅ Individual min/max filters work');
    console.log(`Found ${response1.results.length} cards`);
  } catch (error) {
    console.log('❌ Individual min/max filters failed:', error.message);
  }

  // Test 2: String range format (both min and max)
  console.log('\nTest 2: String range format (both values)');
  const filters2 = {
    annualFeeRange: { min: 0, max: 5000 },
    interestRateRange: { min: 20, max: 25 },
  };

  try {
    const response2 = await apiService.getCreditCards(filters2);
    console.log('✅ String range filters work');
    console.log(`Found ${response2.results.length} cards`);
  } catch (error) {
    console.log('❌ String range filters failed:', error.message);
  }

  // Test 3: Direct string format
  console.log('\nTest 3: Direct string format');
  const filters3 = {
    annualFeeRangeString: '0,5000',
    interestRateRangeString: '20.0,25.0',
  };

  try {
    const response3 = await apiService.getCreditCards(filters3);
    console.log('✅ Direct string format filters work');
    console.log(`Found ${response3.results.length} cards`);
  } catch (error) {
    console.log('❌ Direct string format filters failed:', error.message);
  }

  // Test 4: Only min value (should use individual parameter)
  console.log('\nTest 4: Only min value');
  const filters4 = {
    annualFeeRange: { min: 1000 },
    interestRateRange: { max: 24 },
  };

  try {
    const response4 = await apiService.getCreditCards(filters4);
    console.log('✅ Partial range filters work');
    console.log(`Found ${response4.results.length} cards`);
  } catch (error) {
    console.log('❌ Partial range filters failed:', error.message);
  }

  console.log('\n🎉 Range filter testing completed!');
};

// Export for manual testing
export { testRangeFilters };

// Log instructions for manual testing
console.log(`
📋 Manual Testing Instructions:

1. Start your backend server on localhost:8000
2. Open browser console and run:
   import('./services/api-test.js').then(module => module.testRangeFilters());

3. Or add this to a component and call testRangeFilters()

Range Filter Examples:
- String format: "0,200" or "18.0,25.0"
- Object format: { min: 0, max: 200 }
- Partial: { min: 100 } or { max: 500 }
`);
