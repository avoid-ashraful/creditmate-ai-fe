import React, { useEffect, useState } from 'react';

import { useLanguage } from '../locales';
import { ApiError } from '../services/apiError';

import Toast from './Toast';

export default function NetworkStatus(): JSX.Element | null {
  const [online, setOnline] = useState(typeof navigator === 'undefined' || navigator.onLine);
  const [failed, setFailed] = useState(false);
  const [httpFailure, setHttpFailure] = useState<ApiError | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const { lang } = useLanguage();
  useEffect(() => {
    const up = () => {
      setOnline(true);
      setFailed(false);
    };
    const down = () => setOnline(false);
    const failure = () => setFailed(true);
    const http = (event: Event) => {
      const error = (event as CustomEvent<ApiError>).detail;
      if (!(error instanceof ApiError)) return;
      setHttpFailure(error);
      setSecondsLeft(error.status === 429 ? Math.ceil(error.retryAfter ?? 0) : 0);
    };
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    window.addEventListener('api-network-failure', failure);
    window.addEventListener('api-http-failure', http);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
      window.removeEventListener('api-network-failure', failure);
      window.removeEventListener('api-http-failure', http);
    };
  }, []);
  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = window.setTimeout(() => setSecondsLeft(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);
  if (online && !failed && !httpFailure) return null;
  const retryable = Boolean(httpFailure && httpFailure.status !== 429);
  const message = httpFailure
    ? lang === 'bn'
      ? httpFailure.status === 429
        ? secondsLeft > 0
          ? `অনেক বেশি অনুরোধ হয়েছে। ${secondsLeft} সেকেন্ড পরে আবার চেষ্টা করুন।`
          : 'অনেক বেশি অনুরোধ হয়েছে। আবার চেষ্টা করুন।'
        : 'সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
      : httpFailure.status === 429
      ? secondsLeft > 0
        ? `Too many requests. Try again in ${secondsLeft}s.`
        : 'Too many requests. You can try again now.'
      : 'The service is unavailable. Try again.'
    : lang === 'bn'
    ? !online
      ? 'ইন্টারনেট সংযোগ নেই।'
      : 'অনুরোধটি সম্পন্ন হয়নি। সংযোগ পরীক্ষা করুন।'
    : !online
    ? 'You are offline.'
    : 'The request failed. Check your connection.';
  return (
    <div className="network-banner" role="status" aria-live="polite">
      <Toast message={message} />
      {httpFailure && (
        <button
          type="button"
          disabled={!retryable && secondsLeft > 0}
          onClick={() => window.location.reload()}
        >
          {lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
        </button>
      )}
    </div>
  );
}
