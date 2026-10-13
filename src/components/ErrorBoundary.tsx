import React from 'react';
import { Link } from 'react-router-dom';

import { analytics } from '../lib/analytics';

interface State {
  failed: boolean;
}
export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { failed: false };
  static getDerivedStateFromError(): State {
    return { failed: true };
  }
  componentDidCatch(error: Error): void {
    analytics.track('app_error', { errorName: error.name });
    const dsn = process.env.REACT_APP_SENTRY_DSN;
    if (dsn) {
      // Optional global hook lets deployments initialize Sentry without bundling it here.
      const hook = (
        window as Window & { __reportSentryError?: (error: Error, dsn: string) => void }
      ).__reportSentryError;
      hook?.(error, dsn);
    }
  }
  render(): React.ReactNode {
    if (this.state.failed)
      return (
        <main role="alert" className="error-boundary">
          <h1>Something went wrong</h1>
          <p>The page could not be displayed.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload page
          </button>{' '}
          <Link to="/">Go home</Link>
        </main>
      );
    return this.props.children;
  }
}
