import { motion } from 'framer-motion';
import React, { useEffect, Suspense, lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
} from 'react-router-dom';

import { MotionProvider, pageVariants, usePrefersReducedMotion } from './animations';
import ErrorBoundary from './components/ErrorBoundary';
import { LazyPageFallback } from './components/LazyPageFallback';
import NetworkStatus from './components/NetworkStatus';
import { ProtectedRoute } from './components/ProtectedRoute';
import AppShell from './components/shell/AppShell';
import { ToastProvider } from './components/ui';
import { AuthProvider } from './hooks/AuthProvider';
import { ShortlistProvider } from './hooks/ShortlistProvider';
import { ThemeProvider } from './hooks/ThemeProvider';
import { ANALYTICS_EVENTS, analytics, getAnalyticsContextProperties } from './lib/analytics';
import { isResultsViewEnabled } from './lib/experiments';
import { LanguageProvider, LEGAL_PAGE_PATHS } from './locales';
import CardDetailPage from './pages/CardDetailPage';
import HomePage from './pages/HomePage';
import SharedPage from './pages/SharedPage';
import './styles/App.css';
import './components/shell/Shell.css';
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

const AboutPage = lazyLoad(() => import('./pages/AboutPage'));
const BankPage = lazyLoad(() => import('./pages/BankPage'));
const BanksPage = lazyLoad(() => import('./pages/BanksPage'));
const AccountPage = lazyLoad(() => import('./pages/AccountPage'));
const AlertsPage = lazyLoad(() => import('./pages/AlertsPage'));
const CardsDiscoveryPage = lazyLoad(() => import('./pages/CardsDiscoveryPage'));
const CollectionPage = lazyLoad(() => import('./pages/CollectionPage'));
const EligibilityCheckerPage = lazyLoad(() => import('./pages/EligibilityCheckerPage'));
const ComparisonPage = lazyLoad(() => import('./pages/ComparisonPage'));
const ExperimentResults = lazyLoad(() => import('./pages/ExperimentResults/ExperimentResults'));
const ForgotPasswordPage = lazyLoad(() => import('./pages/ForgotPasswordPage'));
const GlossaryPage = lazyLoad(() => import('./pages/GlossaryPage'));
const GuidesPage = lazyLoad(() => import('./pages/GuidesPage'));
const LegalPage = lazyLoad(() => import('./pages/LegalPage'));
const LoginPage = lazyLoad(() => import('./pages/LoginPage'));
const MyPage = lazyLoad(() => import('./pages/MyPage'));
const NotFoundPage = lazyLoad(() => import('./pages/NotFoundPage'));
const RecommendationQuiz = lazyLoad(() => import('./pages/RecommendationQuiz'));
const RegisterPage = lazyLoad(() => import('./pages/RegisterPage'));
const ResetPasswordPage = lazyLoad(() => import('./pages/ResetPasswordPage'));
const RewardCalculatorPage = lazyLoad(() => import('./pages/RewardCalculatorPage'));
const CalculatorsPage = lazyLoad(() => import('./pages/CalculatorsPage'));
const LoansPage = lazyLoad(() => import('./pages/LoansPage'));
const LoanDetailPage = lazyLoad(() => import('./pages/LoanDetailPage'));
const DepositsPage = lazyLoad(() => import('./pages/DepositsPage'));
const DepositDetailPage = lazyLoad(() => import('./pages/DepositDetailPage'));
const AccountsPage = lazyLoad(() => import('./pages/AccountsPage'));
const AccountDetailPage = lazyLoad(() => import('./pages/AccountDetailPage'));
const SavedPage = lazyLoad(() => import('./pages/SavedPage'));
const UnsubscribePage = lazyLoad(() => import('./pages/UnsubscribePage'));
const VerifyEmailPage = lazyLoad(() => import('./pages/VerifyEmailPage'));

// Critical path pages - eager loaded
// HomePage, CardDetailPage, SharedPage
// (ComparisonPage moved to lazyLoad above: the main chunk was at its size
// budget, and /compare is reached by an explicit user action, not on landing.)

/** /search is retired: the canonical discovery lives at /cards (query preserved). */
const SearchRedirect: React.FC = () => {
  const location = useLocation();
  return <Navigate to={`/cards${location.search}`} replace />;
};

/** /category/:slug folds into /cards with the category applied as a filter. */
const CategoryRedirect: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/cards?categories=${encodeURIComponent(slug ?? '')}`} replace />;
};

/** /saved/collections/:id moved under /my (Section 2.2 route map). */
const CollectionRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/my/collections/${id ?? ''}`} replace />;
};

const lazyRoute = (label: string, element: React.ReactNode) => (
  <Suspense fallback={<LazyPageFallback label={label} />}>{element}</Suspense>
);

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
        <Route path="/cards" element={lazyRoute('Loading cards...', <CardsDiscoveryPage />)} />
        <Route path="/search" element={<SearchRedirect />} />
        <Route path="/category/:slug" element={<CategoryRedirect />} />
        <Route path="/card/:bankSlug/:cardSlug" element={<CardDetailPage />} />
        <Route path="/banks" element={lazyRoute('Loading banks...', <BanksPage />)} />
        <Route path="/bank/:slug" element={lazyRoute('Loading bank...', <BankPage />)} />
        <Route path="/compare" element={lazyRoute('Loading comparison...', <ComparisonPage />)} />
        <Route path="/shared/:token" element={<SharedPage />} />
        <Route path="/saved/shared/collections/:slug" element={<SharedPage kind="collection" />} />

        {/* My CreditMate (Phase 1 route map): personal surfaces under /my. */}
        <Route path="/my" element={lazyRoute('Loading your CreditMate...', <MyPage />)} />
        <Route
          path="/my/saved"
          element={
            <ProtectedRoute>{lazyRoute('Loading saved items...', <SavedPage />)}</ProtectedRoute>
          }
        />
        <Route
          path="/my/collections/:id"
          element={
            <ProtectedRoute>
              {lazyRoute('Loading collection...', <CollectionPage />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/my/profile"
          element={
            <ProtectedRoute>{lazyRoute('Loading account...', <AccountPage />)}</ProtectedRoute>
          }
        />
        <Route
          path="/my/alerts"
          element={
            <ProtectedRoute>{lazyRoute('Loading alerts...', <AlertsPage />)}</ProtectedRoute>
          }
        />

        {/* Permanent in-app redirects from the pre-redesign paths. */}
        <Route path="/saved" element={<Navigate to="/my/saved" replace />} />
        <Route path="/saved/collections/:id" element={<CollectionRedirect />} />
        <Route path="/account" element={<Navigate to="/my/profile" replace />} />
        <Route path="/alerts" element={<Navigate to="/my/alerts" replace />} />

        <Route
          path="/perfect-card-finder"
          element={lazyRoute('Loading quiz...', <RecommendationQuiz />)}
        />
        <Route
          path="/eligibility-checker"
          element={lazyRoute('Loading eligibility checker...', <EligibilityCheckerPage />)}
        />
        <Route
          path="/reward-calculator"
          element={lazyRoute('Loading reward calculator...', <RewardCalculatorPage />)}
        />
        <Route
          path="/calculators"
          element={lazyRoute('Loading calculators...', <CalculatorsPage />)}
        />
        <Route path="/loans" element={lazyRoute('Loading loans...', <LoansPage />)} />
        <Route path="/loans/:slug" element={lazyRoute('Loading loan...', <LoanDetailPage />)} />
        <Route path="/deposits" element={lazyRoute('Loading deposits...', <DepositsPage />)} />
        <Route
          path="/deposits/:slug"
          element={lazyRoute('Loading deposit...', <DepositDetailPage />)}
        />
        <Route path="/accounts" element={lazyRoute('Loading accounts...', <AccountsPage />)} />
        <Route
          path="/accounts/:slug"
          element={lazyRoute('Loading account...', <AccountDetailPage />)}
        />
        <Route path="/guides" element={lazyRoute('Loading guides...', <GuidesPage />)} />
        <Route path="/guides/:slug" element={lazyRoute('Loading guide...', <GuidesPage />)} />
        <Route path="/glossary" element={lazyRoute('Loading glossary...', <GlossaryPage />)} />
        <Route path="/about" element={lazyRoute('Loading about...', <AboutPage />)} />
        <Route path="/login" element={lazyRoute('Loading sign in...', <LoginPage />)} />
        <Route path="/register" element={lazyRoute('Loading register...', <RegisterPage />)} />
        <Route path="/forgot-password" element={lazyRoute('Loading...', <ForgotPasswordPage />)} />
        <Route path="/reset-password" element={lazyRoute('Loading...', <ResetPasswordPage />)} />
        <Route path="/unsubscribe" element={lazyRoute('Loading...', <UnsubscribePage />)} />
        <Route path="/verify-email" element={lazyRoute('Loading...', <VerifyEmailPage />)} />
        {(Object.values(LEGAL_PAGE_PATHS) as string[]).map(path => (
          <Route key={path} path={path} element={lazyRoute('Loading...', <LegalPage />)} />
        ))}
        {showResultsView && (
          <Route
            path="/experiment-results"
            element={lazyRoute('Loading experiment results...', <ExperimentResults />)}
          />
        )}
        <Route path="*" element={lazyRoute('Loading...', <NotFoundPage />)} />
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
 * The full application: shell (mode rail / mobile bars), providers and the
 * routed content. Expects to be rendered inside a router, a
 * LanguageProvider and an AuthProvider.
 */
export const AppContent: React.FC = () => {
  // Prefetch lazy-loaded routes on hover/focus of nav links
  useNavLinkPrefetch();

  return (
    <ShortlistProvider>
      <ToastProvider>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </ToastProvider>
    </ShortlistProvider>
  );
};

AppContent.displayName = 'AppContent';

/** Router-bound application. Uses a browser router for the SPA. */
const App: React.FC = () => {
  return (
    <Router>
      <PageViewTrackerWrapper />
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
