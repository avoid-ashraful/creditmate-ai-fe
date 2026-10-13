import React from 'react';
import { Link } from 'react-router-dom';

import { analytics } from '../lib/analytics';
import { useLanguage } from '../locales';

interface State {
  failed: boolean;
}
interface Props extends React.PropsWithChildren {
  language?: 'en' | 'bn';
}
class Boundary extends React.Component<Props, State> {
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
    if (this.state.failed) {
      const bengali = this.props.language === 'bn';
      return (
        <main role="alert" className="error-boundary">
          <h1>{bengali ? 'কিছু সমস্যা হয়েছে' : 'Something went wrong'}</h1>
          <p>{bengali ? 'পৃষ্ঠাটি দেখানো যায়নি।' : 'The page could not be displayed.'}</p>
          <button type="button" onClick={() => window.location.reload()}>
            {bengali ? 'পুনরায় লোড করুন' : 'Reload page'}
          </button>{' '}
          <Link to="/">{bengali ? 'হোমে যান' : 'Go home'}</Link>
        </main>
      );
    }
    return this.props.children;
  }
}

export default function ErrorBoundary(props: React.PropsWithChildren): JSX.Element {
  const { lang } = useLanguage();
  return <Boundary {...props} language={lang} />;
}
