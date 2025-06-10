# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Start Development Server

```bash
npm start
```

Runs the React app in development mode on http://localhost:3000

### Testing

```bash
# Run all tests
npm test

# Run tests for specific component
npm test -- --testPathPattern=ComponentName
```

### Code Quality

```bash
# Lint and fix all files
npm run lint

# Format all files
npm run format

# Check TypeScript types
npm run check-types

# Check formatting without fixing
npm run check-format

# Check linting without fixing
npm run check-lint
```

### Build

```bash
npm run build
```

## Architecture Overview

### Technology Stack

- React 18 with TypeScript
- React Router DOM v6 for routing
- Styled Components for styling
- Framer Motion & React Spring for animations
- Create React App as build tool

### Application Structure

#### Core Pages (src/pages/)

- **HomePage**: Main landing page with featured cards and search
- **ComparisonPage**: Advanced comparison tool with filtering (up to 4 cards)
- **GlossaryPage**: Educational content about credit card terminology
- **AboutPage**: Platform information and mission

#### Key Components (src/components/)

- **CardList**: Displays grid of credit cards
- **CardListItem**: Individual card representation with selection capability
- **CardDetailsPopup**: Modal with detailed card information and image gallery
- **CardComparisonTable**: Side-by-side comparison of selected cards
- **FilterPanel**: Collapsible panel with search and filtering options
- **ComparisonBar**: Fixed bottom bar showing selected cards for comparison

#### Data Layer

- **Types** (src/types/): Core TypeScript interfaces for Bank, CreditCard, CardFilterOptions, etc.
- **Dummy Data** (src/dummy-data/): Mock credit card data for development
- Credit cards support multiple images, annual fee waiver policies, lounge access counts, and flexible additional features

#### Styling Architecture

- **Styled Components**: Global styled components in src/styles/StyledComponents.tsx
- **CSS Files**: Component-specific styles in src/styles/
- **Design System**: Gradient-based theme with purple/blue color scheme
- Responsive design with mobile-first approach

### Key Features

- **Smart Filtering**: By bank, annual fee range, interest rate, lounge access
- **Card Selection**: Users can select up to 4 cards for comparison
- **Image Galleries**: Cards can have multiple images with navigation
- **Educational Content**: Glossary terms and financial education
- **Responsive Design**: Works across desktop, tablet, and mobile

### Data Model

The `CreditCard` interface includes flexible fields:

- `annualFeeWaiverPolicy`: Record<string, any> | null (varies by bank)
- `additionalFeatures`: any[] (various feature types)
- `images`: Array of small/full image pairs
- `loungeAccessInternational/Domestic`: Number of lounge accesses

### Code Quality

- Pre-commit hooks with Husky enforce linting and formatting
- ESLint configuration includes React and TypeScript best practices
- Prettier formatting with 100-character line length
- Comprehensive test coverage using Jest and React Testing Library
