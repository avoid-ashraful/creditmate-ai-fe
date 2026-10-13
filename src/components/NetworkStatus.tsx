import React, { useEffect, useState } from 'react';

import { useLanguage } from '../locales';

import Toast from './Toast';

export default function NetworkStatus(): JSX.Element | null {
  const [online, setOnline] = useState(typeof navigator === 'undefined' || navigator.onLine);
  const [failed, setFailed] = useState(false);
  const { lang } = useLanguage();
  useEffect(() => {
    const up = () => {
      setOnline(true);
      setFailed(false);
    };
    const down = () => setOnline(false);
    const failure = () => setFailed(true);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    window.addEventListener('api-network-failure', failure);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
      window.removeEventListener('api-network-failure', failure);
    };
  }, []);
  if (online && !failed) return null;
  const message =
    lang === 'bn'
      ? !online
        ? 'ইন্টারনেট সংযোগ নেই।'
        : 'অনুরোধটি সম্পন্ন হয়নি। সংযোগ পরীক্ষা করুন।'
      : !online
      ? 'You are offline.'
      : 'The request failed. Check your connection.';
  return <Toast className="network-banner" message={message} />;
}
