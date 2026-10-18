import { motion } from 'framer-motion';
import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

import { MotionProvider, pageVariants, usePrefersReducedMotion } from './animations';
import { AccountMenu } from './components/AccountMenu';
import ErrorBoundary from './components/ErrorBoundary';
import {
  LazyPageFallback,
  LazyAuthFallback,
  LazyPageMinimalFallback,
} from './components/LazyPageFallback';
import NetworkStatus from './components/NetworkStatus';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeToggle } from './components/ThemeToggle';
import { AuthProvider } from './hooks/AuthProvider';
import { ThemeProvider } from './hooks/ThemeProvider';
import { ANALYTICS_EVENTS, analytics, getAnalyticsContextProperties } from './lib/analytics';
import { isResultsViewEnabled } from './lib/experiments';
import { LanguageProvider, LEGAL_PAGE_PATHS, getLegalCopy, useLanguage } from './locales';
import type { LegalPageKey } from './locales';
import CardDetailPage from './pages/CardDetailPage';
import CategoryPage from './pages/CategoryPage';
import ComparisonPage from './pages/ComparisonPage';
import HomePage from './pages/HomePage';
import SharedPage from './pages/SharedPage';
import './styles/App.css';
import { GradientHeader, GradientFooter, GradientBackground } from './styles/StyledComponents';
import { useNavLinkPrefetch } from './utils/preload';

/**
 * Conditionally lazy-load a component. In test environment, loads synchronously.
 * This allows tests to render pages without Suspense fallback delays.
 */
const lazyLoad = (
  importFn: () => Promise<{ default: React.ComponentType<React.PropsWithChildren<unknown>> }>
): React.ComponentType<React.PropsWithChildren<unknown>> => {
  if (process.env.NODE_ENV === 'test') {
    // In tests, resolve immediately to avoid Suspense fallback
    const module = importFn();
    if (module && typeof module.then === 'function') {
      // Return a component that will render the resolved module synchronously
      return (() => {
        let resolvedComponent: React.ComponentType<React.PropsWithChildren<unknown>> | null = null;
        module.then(resolved => {
          resolvedComponent = resolved.default;
        });
        // Since we're in test and the module is already loaded by Jest,
        // the promise should resolve synchronously
        const TestComponent = (props: React.PropsWithChildren<unknown>) => {
          if (resolvedComponent) {
            return React.createElement(resolvedComponent, props);
          }
          // Fallback - shouldn't happen in tests but satisfies TypeScript
          return null;
        };
        TestComponent.displayName = 'TestLazyComponent';
        return TestComponent;
      })();
    }
    // This shouldn't happen in test mode, but TypeScript needs a return
    return () => null;
  }
  return lazy(importFn);
};

// Lazy-loaded pages (non-critical paths) - eager in tests, lazy in production
const AboutPage = lazyLoad(() => import('./pages/AboutPage'));
const AccountPage = lazyLoad(() => import('./pages/AccountPage'));
const AdvancedSearchPage = lazyLoad(() => import('./pages/AdvancedSearchPage'));
const AlertsPage = lazyLoad(() => import('./pages/AlertsPage'));
const CollectionPage = lazyLoad(() => import('./pages/CollectionPage'));
const ExperimentResults = lazyLoad(() => import('./pages/ExperimentResults/ExperimentResults'));
const ForgotPasswordPage = lazyLoad(() => import('./pages/ForgotPasswordPage'));
const GlossaryPage = lazyLoad(() => import('./pages/GlossaryPage'));
const GuidesPage = lazyLoad(() => import('./pages/GuidesPage'));
const LegalPage = lazyLoad(() => import('./pages/LegalPage'));
const LoginPage = lazyLoad(() => import('./pages/LoginPage'));
const NotFoundPage = lazyLoad(() => import('./pages/NotFoundPage'));
const RecommendationQuiz = lazyLoad(() => import('./pages/RecommendationQuiz'));
const RegisterPage = lazyLoad(() => import('./pages/RegisterPage'));
const ResetPasswordPage = lazyLoad(() => import('./pages/ResetPasswordPage'));
const RewardCalculatorPage = lazyLoad(() => import('./pages/RewardCalculatorPage'));
const SavedPage = lazyLoad(() => import('./pages/SavedPage'));
const UnsubscribePage = lazyLoad(() => import('./pages/UnsubscribePage'));
const VerifyEmailPage = lazyLoad(() => import('./pages/VerifyEmailPage'));

// Critical path pages - eager loaded
// HomePage, CardDetailPage, CategoryPage, ComparisonPage, SharedPage

interface NavItem {
  to: string;
  en: string;
  bn: string;
}

/**
 * Primary navigation labels. These are the small set of key translations the
 * app ships today; they translate navigation chrome only, not the full content
 * of each page (see LOCALIZATION_GUIDE.md, "Limitations").
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', en: 'Home', bn: 'হোম' },
  { to: '/search', en: 'Advanced Search', bn: 'উন্নত অনুসন্ধান' },
  { to: '/perfect-card-finder', en: 'Quiz', bn: 'কুইজ' },
  { to: '/compare', en: 'Compare Cards', bn: 'কার্ড তুলনা' },
  { to: '/reward-calculator', en: 'Reward Calculator', bn: 'রিওয়ার্ড ক্যালকুলেটর' },
  { to: '/guides', en: 'Guides', bn: 'গাইড' },
  { to: '/glossary', en: 'Glossary', bn: 'শব্দকোষ' },
  { to: '/about', en: 'About', bn: 'আমাদের সম্পর্কে' },
];

const FOOTER_LEGAL_KEYS: LegalPageKey[] = [
  'terms',
  'privacy',
  'disclaimer',
  'howWeMakeMoney',
  'methodology',
  'contact',
];

/**
 * Render the page routes. Exported so routing can be tested with MemoryRouter.
 * Keyed on the pathname so each navigation replays the page fade-and-slide.
 */
export const AppRoutes: React.FC = () => {
  const location = useLocation();
  const showResultsView = isResultsViewEnabled();
  const reduceMotion = usePrefersReducedMotion();

  return (
    <motion.div
      key={location.pathname}
      className="page-transition"
      variants={pageVariants}
      initial={reduceMotion ? false : 'hidden'}
      animate="visible"
    >
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/search"
          element={
            <Suspense fallback={<LazyPageFallback label="Loading search..." />}>
              <AdvancedSearchPage />
            </Suspense>
          }
        />
        <Route path="/card/:bankSlug/:cardSlug" element={<CardDetailPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/compare" element={<ComparisonPage />} />
        <Route path="/shared/:token" element={<SharedPage />} />
        <Route
          path="/saved"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LazyPageFallback label="Loading saved items..." />}>
                <SavedPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved/collections/:id"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LazyPageFallback label="Loading collection..." />}>
                <CollectionPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfect-card-finder"
          element={
            <Suspense fallback={<LazyPageFallback label="Loading quiz..." />}>
              <RecommendationQuiz />
            </Suspense>
          }
        />
        <Route
          path="/reward-calculator"
          element={
            <Suspense fallback={<LazyPageFallback label="Loading calculator..." />}>
              <RewardCalculatorPage />
            </Suspense>
          }
        />
        <Route
          path="/guides"
          element={
            <Suspense fallback={<LazyPageFallback label="Loading guides..." />}>
              <GuidesPage />
            </Suspense>
          }
        />
        <Route
          path="/guides/:slug"
          element={
            <Suspense fallback={<LazyPageFallback label="Loading guide..." />}>
              <GuidesPage />
            </Suspense>
          }
        />
        <Route
          path="/glossary"
          element={
            <Suspense fallback={<LazyPageFallback label="Loading glossary..." />}>
              <GlossaryPage />
            </Suspense>
          }
        />
        <Route
          path="/about"
          element={
            <Suspense fallback={<LazyPageFallback label="Loading about page..." />}>
              <AboutPage />
            </Suspense>
          }
        />
        <Route
          path="/login"
          element={
            <Suspense fallback={<LazyAuthFallback />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="/register"
          element={
            <Suspense fallback={<LazyAuthFallback />}>
              <RegisterPage />
            </Suspense>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <Suspense fallback={<LazyAuthFallback />}>
              <ForgotPasswordPage />
            </Suspense>
          }
        />
        <Route
          path="/reset-password"
          element={
            <Suspense fallback={<LazyAuthFallback />}>
              <ResetPasswordPage />
            </Suspense>
          }
        />
        <Route
          path="/unsubscribe"
          element={
            <Suspense fallback={<LazyPageMinimalFallback label="Loading..." />}>
              <UnsubscribePage />
            </Suspense>
          }
        />
        <Route
          path="/verify-email"
          element={
            <Suspense fallback={<LazyAuthFallback />}>
              <VerifyEmailPage />
            </Suspense>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LazyPageFallback label="Loading account..." />}>
                <AccountPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LazyPageFallback label="Loading alerts..." />}>
                <AlertsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        {(Object.values(LEGAL_PAGE_PATHS) as string[]).map(path => (
          <Route
            key={path}
            path={path}
            element={
              <Suspense fallback={<LazyPageFallback label="Loading..." />}>
                <LegalPage />
              </Suspense>
            }
          />
        ))}
        {showResultsView && (
          <Route
            path="/experiment-results"
            element={
              <Suspense fallback={<LazyPageFallback label="Loading experiment results..." />}>
                <ExperimentResults />
              </Suspense>
            }
          />
        )}
        <Route
          path="*"
          element={
            <Suspense fallback={<LazyPageFallback label="Loading..." />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Routes>
    </motion.div>
  );
};

interface PageViewTrackerProps {
  pathname: string;
}

const PageViewTracker: React.FC<PageViewTrackerProps> = ({ pathname }) => {
  useEffect(() => {
    analytics.track(ANALYTICS_EVENTS.pageView, getAnalyticsContextProperties());
  }, [pathname]);

  return null;
};

const PageViewTrackerWrapper: React.FC = () => {
  const location = useLocation();

  return <PageViewTracker pathname={location.pathname} />;
};

/**
 * The full application shell: header, routed content and footer. Expects to be
 * rendered inside a router and a LanguageProvider.
 */
export const AppContent: React.FC = () => {
  const { lang, setLang } = useLanguage();
  const isBengali = lang === 'bn';
  const legalCopy = getLegalCopy(lang);

  // Prefetch lazy-loaded routes on hover/focus of nav links
  useNavLinkPrefetch();

  return (
    <div className="app">
      {/* Keyboard users can bypass the repeated header navigation. The target
          is focusable so the browser moves focus into the main content. */}
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <GradientHeader>
        <div className="header-content">
          <div className="logo">
            <Link to="/" lang={isBengali ? 'bn' : 'en'}>
              CreditMate AI
            </Link>
          </div>
          <nav className="main-nav" aria-label="Main navigation">
            <ul>
              {NAV_ITEMS.map(item => (
                <li key={item.to}>
                  <Link to={item.to} lang={isBengali ? 'bn' : 'en'}>
                    {isBengali ? item.bn : item.en}
                  </Link>
                </li>
              ))}
              <li className="lang-switcher-item">
                <button
                  type="button"
                  className={`lang-switcher-button ${isBengali ? 'active' : ''}`}
                  onClick={() => setLang(isBengali ? 'en' : 'bn')}
                  aria-label={isBengali ? 'Switch to English' : 'Switch to Bengali'}
                >
                  {isBengali ? 'EN' : 'BN'}
                </button>
              </li>
              <li className="lang-switcher-item">
                <ThemeToggle />
              </li>
              <AccountMenu />
            </ul>
          </nav>
        </div>
      </GradientHeader>

      <main id="main-content" className="app-content" tabIndex={-1}>
        <AppRoutes />
      </main>

      <GradientFooter>
        <div className="footer-content">
          <section aria-labelledby="footer-brand-heading">
            <h2 id="footer-brand-heading" className="visually-hidden">
              CreditMate AI
            </h2>
            <p className="footer-brand">
              {isBengali
                ? 'বাংলাদেশি গ্রাহকদের জন্য আর্থিক সিদ্ধান্ত সহজ করা।'
                : 'Making financial decisions simpler for Bangladeshi consumers.'}
            </p>
          </section>
          <nav aria-labelledby="footer-nav-heading" className="footer-section">
            <h2 id="footer-nav-heading" className="visually-hidden">
              {isBengali ? 'দ্রুত লিংক' : 'Quick Links'}
            </h2>
            <ul>
              {NAV_ITEMS.map(item => (
                <li key={item.to}>
                  <Link to={item.to} lang={isBengali ? 'bn' : 'en'}>
                    {isBengali ? item.bn : item.en}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-labelledby="footer-legal-heading" className="footer-section">
            <h2 id="footer-legal-heading" className="visually-hidden">
              {legalCopy.footerLegalHeading}
            </h2>
            <ul>
              {FOOTER_LEGAL_KEYS.map(key => (
                <li key={key}>
                  <Link to={LEGAL_PAGE_PATHS[key]} lang={isBengali ? 'bn' : 'en'}>
                    {legalCopy.pages[key].title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="copyright">
          <p>
            &copy; {new Date().getFullYear()} CreditMate AI.{' '}
            {isBengali ? 'সর্বস্বত্ব সংরক্ষিত।' : 'All rights reserved.'}
          </p>
        </div>
      </GradientFooter>
    </div>
  );
};

/** Router-bound application. Uses a browser router for the SPA. */
const App: React.FC = () => {
  return (
    <Router>
      <PageViewTrackerWrapper />
      <GradientBackground />
      <ErrorBoundary>
        <NetworkStatus />
        <AppContent />
      </ErrorBoundary>
    </Router>
  );
};

/** Root entry: provides the language and theme context around the routed app. */
export default function RootApp({ children }: { children?: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MotionProvider>
        <LanguageProvider>
          <AuthProvider>{children ?? <App />}</AuthProvider>
        </LanguageProvider>
      </MotionProvider>
    </ThemeProvider>
  );
}

RootApp.displayName = 'RootApp';

export { PageViewTrackerWrapper };
