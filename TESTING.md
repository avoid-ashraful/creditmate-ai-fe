# Testing Documentation for CreditMate AI

This document outlines the testing approach and test coverage for the CreditMate AI application.

## Testing Framework

The application uses the following testing tools:

- **Jest**: JavaScript testing framework
- **React Testing Library**: Testing utilities for React components
- **Jest DOM**: Custom Jest matchers for DOM testing

## Testing Approach

The testing strategy follows these principles:

1. **Component Testing**: Each React component is tested in isolation to verify its functionality.
2. **Behavior-Driven Testing**: Tests focus on component behavior rather than implementation details.
3. **Edge Case Coverage**: Tests include edge cases to ensure robust component behavior.
4. **Mocking**: External dependencies are mocked to isolate component testing.
5. **Accessibility**: Components are tested for basic accessibility concerns.

## Test Coverage

### Core Components

#### CardListItem Component

The `CardListItem` component tests cover:

- Basic rendering of card information
- Handling cards without images
- Handling cards without lounge access
- Selectable card functionality
- Selected card state
- Event handling (onSelect, onViewDetails)
- Edge cases (no callbacks provided, many features)

#### FilterPanel Component

The `FilterPanel` component tests cover:

- Default collapsed state rendering
- Expanding/collapsing functionality
- Rendering with initial filters
- Bank selection functionality
- Annual fee range input handling
- Interest rate range input handling
- Lounge access checkbox handling
- Search input functionality
- Reset button functionality
- Empty input handling
- Rendering with empty banks array

#### CardDetailsPopup Component

The `CardDetailsPopup` component tests cover:

- Rendering of all card details
- Handling cards without images
- Handling cards without annual fee waiver policy
- Handling cards without lounge access
- Image gallery navigation
- Add/remove from comparison list functionality
- Close button functionality
- Event propagation (overlay clicks vs. popup content clicks)
- Conditional rendering (navigation buttons for multiple images)

## Running Tests

To run all tests:

```bash
npm test
```

To run tests for a specific component:

```bash
npm test -- --testPathPattern=ComponentName
```

## Test File Structure

Each test file follows this structure:

1. **Imports**: Required libraries and components
2. **Mock Data**: Test data for different scenarios
3. **Test Suite**: Grouped tests for the component
4. **Individual Tests**: Specific test cases with assertions

## Best Practices

When adding new tests, follow these guidelines:

1. Test component behavior, not implementation details
2. Use descriptive test names that explain what is being tested
3. Group related tests together
4. Mock external dependencies
5. Test edge cases and error conditions
6. Keep tests independent of each other
7. Use setup and teardown functions for common operations

## Future Improvements

Areas for expanding test coverage:

1. Integration tests for component interactions
2. End-to-end tests for critical user flows
3. Performance testing for complex components
4. Accessibility testing with specialized tools
5. Visual regression testing