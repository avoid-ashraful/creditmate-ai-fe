# CreditMate AI 🏦

A comprehensive credit card comparison platform designed specifically for Bangladeshi consumers, helping users make informed financial decisions through transparent information and intuitive comparison tools.

## 🌟 Features

- **Smart Credit Card Comparison**: Compare up to 4 credit cards side-by-side with detailed metrics
- **Advanced Filtering**: Filter cards by annual fees, interest rates, lounge access, and more
- **Real-time Search**: Search across all major Bangladeshi banks and card offerings
- **Educational Resources**: Learn about credit card terminology through our comprehensive glossary
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile devices
- **Modern UI**: Clean, gradient-based design with smooth animations

## 🚀 Quick Start

### Prerequisites

- Node.js 24 LTS (`nvm use`, using the committed `.nvmrc`)
- npm 11 or newer; use the committed `package-lock.json`

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/credit-mate-ai.git
cd credit-mate-ai
```

2. Install dependencies:

```bash
npm ci
```

3. Start the development server:

```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

## 🛠️ Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Runs Jest once; `npm run test:watch` enables watch mode
- `npm run test:ci` - Runs all unit tests with one worker for CI
- `npm run build` - Builds the app for production
- `npm run lint` - Runs ESLint to check code quality
- `npm run format` - Formats code using Prettier
- `npm run check-types` - Runs TypeScript compiler to check types

## 🏗️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Routing**: React Router DOM v7
- **Styling**: Styled Components + CSS
- **Animations**: Framer Motion & React Spring
- **Testing**: Jest & React Testing Library
- **Code Quality**: ESLint, Prettier, Husky
- **Build Tool**: Vite 8; Jest 30 with Babel; TypeScript 5.9

## 📱 Pages

- **Home**: Landing page with featured cards and quick search
- **Compare**: Advanced comparison tool with filtering options
- **Glossary**: Educational content about credit card terminology
- **About**: Information about the platform and mission

## 🎯 Project Goals

CreditMate AI addresses the information fragmentation and transparency issues in Bangladesh's credit card market by:

- Aggregating credit card data from major Bangladeshi banks
- Standardizing information presentation for easy comparison
- Providing educational resources for first-time credit card users
- Enabling informed financial decision-making through transparent data

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── CardComparisonTable.tsx
│   ├── CardDetailsPopup.tsx
│   ├── CardList.tsx
│   ├── CardListItem.tsx
│   ├── ComparisonBar.tsx
│   └── FilterPanel.tsx
├── dummy-data/          # Mock data for development
├── pages/               # Page components
│   ├── AboutPage.tsx
│   ├── ComparisonPage.tsx
│   ├── GlossaryPage.tsx
│   └── HomePage.tsx
├── styles/              # CSS styles and styled components
├── types/               # TypeScript type definitions
├── App.tsx              # Main application component
└── index.tsx            # Application entry point
```

## 🔧 Development

### Analytics

Product analytics is privacy-first and disabled by default. Set
`REACT_APP_ANALYTICS_KEY` only when your deployment also registers an analytics
provider callback. No provider is registered in this repository, so builds remain
safe/no-network and analytics are inactive until deployment integration code calls
`analytics.setProvider`. The injected callback must not include cookies or persistent
identifiers, and it should fail silently through the normal callback contract.

### Analytics Events

The registry defines the acceptance event names: `page_view`, `search`,
`filter_apply`, `card_select`, `compare_start`, `compare_share`,
`card_detail_view`, `quiz_start`, `quiz_complete`, `calculator_use`, `signup`,
and `login`. Existing browsing and page-action call sites use the first ten.
`signup` and `login` remain available for Task 7.1 authentication routes; no
authentication behavior is invented or sent here.

### Provider Adapter Contract

Deployment integration code should register one callback per concern, using only
the sanitized payload supplied by `analytics`:

- `setProvider((event) => { ... })` receives `{ name, properties }` for an event.
- `setUserProvider((properties) => { ... })` receives only `tier`,
  `savedComparisons`, and `emailOptIn`.
- `setUserDeletionProvider(() => { ... })` deletes or resets the provider-side user
  data. `deleteUserData()` invokes this callback before persisting opt-out.

Event properties are limited to allowlisted identifiers, public bank names, filter
keys/counts, normalized enum values, aggregate spend, counts, strict UTM values,
and the referrer origin. They never include email, person names, raw search text,
full referrer URLs, or arbitrary object fields.

`optOut()` and `clearUserData()` immediately stop local event emission and persist
the opt-out. `clearUserData()` is the local-only stop; `deleteUserData()` additionally
requests provider-side deletion or reset when a callback is registered. These are
intentionally distinct operations, even though both end in a persisted opt-out.

The key is a local integration toggle and must not be treated as a secret or used
to send data to an external network by default.

### Code Quality

This project maintains high code quality standards through:

- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for pre-commit hooks
- **Lint-staged** for staged file processing

### Testing

Run tests with:

```bash
npm test
```

The project includes comprehensive test coverage for components and user interactions.

### Building for Production

```bash
npm run build
```

Builds the app for production to the `build` folder, optimizing for best performance.

## 📊 Data Model

The application works with standardized credit card data including:

- Bank information and branding
- Annual fees and interest rates
- Lounge access benefits (domestic & international)
- Fee structures and waiver policies
- Reward points programs
- Additional features and benefits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style guidelines and includes appropriate tests.

## 📋 Roadmap

### Phase 1 (Current - MVP)

- ✅ Core comparison functionality
- ✅ Search and filtering
- ✅ Responsive design
- ✅ Educational content

### Phase 2 (Planned)

- User accounts and preferences
- Save and share comparisons
- User reviews and ratings
- Enhanced mobile experience

### Phase 3 (Future)

- Personalized recommendations
- Advanced analytics
- API integrations
- Community features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋 Support

For questions, suggestions, or issues:

- Create an issue on GitHub
- Contact the development team
- Visit our [documentation](./docs)

## 🙏 Acknowledgments

- All the financial institutions in Bangladesh that provide credit card services
- The open-source community for the amazing tools and libraries
- Contributors who help improve the platform

---

**Made with ❤️ for the Bangladeshi financial community**

## Frontend tooling and environment

Use Node 24 and `npm ci` for a clean, reproducible installation. Vite serves development
on port 3000 (`PORT` can override it), and `npm run build` writes `build/`. The bundle
budget checks JavaScript files in `build/static/`; preview the build with `npm run preview`.
Run `npm run check-types`, `npm run check-lint`, `npm run check-format`, and
`npm run test:ci` before merging. Storybook has its own production check:
`npm run storybook:build`.

Existing `.env` / `.env.local` settings using `REACT_APP_*` remain supported, including
`REACT_APP_API_BASE_URL` and the dynamic validation in `src/config/env.ts`. These are
public browser configuration: never place credentials in `REACT_APP_*` or `VITE_*`
variables. Vite injects only public prefixes, `NODE_ENV`, and `PUBLIC_URL`, rather than
the server's full environment. `PUBLIC_URL=/credit/` sets the static asset base; manifest,
icons, and the early theme script follow it. Application routes currently assume deployment
at the domain root; a subdirectory deployment also needs a matching router basename.

CI runs on pull requests and pushes to `master` using Node 24, pinned actions, locked
installs, read-only permissions, and a synthetic API URL. It does not require production
credentials or publish externally. See [Storybook publishing](docs/storybook-publishing.md)
for an optional, explicitly initiated upload.

The migration removes Create React App and its retired build pipeline. React 18 remains
supported by Router 7; the application still uses its declarative router APIs. On 2026-10-20, `npm audit --omit=dev` reports zero production vulnerabilities. The full
audit reports 38 development-inclusive findings (15 high, 22 moderate, 1 low), chiefly
in Storybook and lint dependencies. Review `npm audit` and
`npm audit --omit=dev` separately; upgrades to Storybook and lint tooling need their own
compatibility checks rather than an unreviewed `npm audit fix --force`.
