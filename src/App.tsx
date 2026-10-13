import { motion } from 'framer-motion';
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

import { MotionProvider, pageVariants, usePrefersReducedMotion } from './animations';
import { AccountMenu } from './components/AccountMenu';
import ErrorBoundary from './components/ErrorBoundary';
import NetworkStatus from './components/NetworkStatus';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeToggle } from './components/ThemeToggle';
import { AuthProvider } from './hooks/AuthProvider';
import { ThemeProvider } from './hooks/ThemeProvider';
import { ANALYTICS_EVENTS, analytics, getAnalyticsContextProperties } from './lib/analytics';
import { isResultsViewEnabled } from './lib/experiments';
import { LanguageProvider, useLanguage } from './locales';
import AboutPage from './pages/AboutPage';
import AccountPage from './pages/AccountPage';
import AlertsPage from './pages/AlertsPage';
import CardDetailPage from './pages/CardDetailPage';
import CategoryPage from './pages/CategoryPage';
import CollectionPage from './pages/CollectionPage';
import ComparisonPage from './pages/ComparisonPage';
import ExperimentResults from './pages/ExperimentResults/ExperimentResults';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import GlossaryPage from './pages/GlossaryPage';
import GuidesPage from './pages/GuidesPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RecommendationQuiz from './pages/RecommendationQuiz';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RewardCalculatorPage from './pages/RewardCalculatorPage';
import SavedPage from './pages/SavedPage';
import SharedPage from './pages/SharedPage';
import UnsubscribePage from './pages/UnsubscribePage';
import './styles/App.css';
import { GradientHeader, GradientFooter, GradientBackground } from './styles/StyledComponents';

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
  { to: '/perfect-card-finder', en: 'Quiz', bn: 'কুইজ' },
  { to: '/compare', en: 'Compare Cards', bn: 'কার্ড তুলনা' },
  { to: '/reward-calculator', en: 'Reward Calculator', bn: 'রিওয়ার্ড ক্যালকুলেটর' },
  { to: '/guides', en: 'Guides', bn: 'গাইড' },
  { to: '/glossary', en: 'Glossary', bn: 'শব্দকোষ' },
  { to: '/about', en: 'About', bn: 'আমাদের সম্পর্কে' },
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
        <Route path="/card/:bankSlug/:cardSlug" element={<CardDetailPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/compare" element={<ComparisonPage />} />
        <Route path="/shared/:token" element={<SharedPage />} />
        <Route
          path="/saved"
          element={
            <ProtectedRoute>
              <SavedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved/collections/:id"
          element={
            <ProtectedRoute>
              <CollectionPage />
            </ProtectedRoute>
          }
        />
        <Route path="/perfect-card-finder" element={<RecommendationQuiz />} />
        <Route path="/reward-calculator" element={<RewardCalculatorPage />} />
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/guides/:slug" element={<GuidesPage />} />
        <Route path="/glossary" element={<GlossaryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/unsubscribe" element={<UnsubscribePage />} />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <AlertsPage />
            </ProtectedRoute>
          }
        />
        {showResultsView && <Route path="/experiment-results" element={<ExperimentResults />} />}
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
              {isBengali ? 'আইনগত' : 'Legal'}
            </h2>
            <ul>
              <li>
                <Link to="/terms">{isBengali ? 'সেবার শর্তাবলি' : 'Terms of Service'}</Link>
              </li>
              <li>
                <Link to="/privacy">{isBengali ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}</Link>
              </li>
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
