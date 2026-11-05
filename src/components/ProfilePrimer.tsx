import React, { useEffect, useState } from 'react';

import { useAuth } from '../hooks/AuthProvider';
import { isDefaultProfile, useProfile } from '../lib/profile';
import { fillCopy, useLanguage } from '../locales';
import { getHomeCopy } from '../locales/home';

import { Button, MoneyInput } from './ui';
import './ProfilePrimer.css';

const PRIMER_STORAGE_KEY = 'creditmate.primer.v1';

/**
 * One-question-per-screen profile primer (Phase 4, addendum B9).
 *
 * Shown once, on mobile, to a signed-in user whose profile still holds
 * the shipped defaults: three questions — typical balance, monthly card
 * spend, planned loan — one per screen, each skippable, the whole
 * primer dismissible. It stores ONLY those three voluntary numbers,
 * through the same profile write path as every other surface (which
 * syncs them to the account). Nothing about eligibility is asked or
 * stored here.
 */
const ProfilePrimer: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getHomeCopy(lang);
  const { user } = useAuth();
  const { profile, setProfile } = useProfile();
  const [isMobile, setIsMobile] = useState(false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(PRIMER_STORAGE_KEY) !== null;
    } catch {
      return true;
    }
  });
  const [step, setStep] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);
  const [spend, setSpend] = useState<number | null>(null);
  const [loan, setLoan] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  if (!user || dismissed || !isMobile || !isDefaultProfile(profile)) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(PRIMER_STORAGE_KEY, 'done');
    } catch {
      // Storage unavailable: dismiss for this mount only.
    }
    setDismissed(true);
  };

  const finish = () => {
    setProfile({
      balance: balance ?? profile.balance,
      monthlySpend: spend ?? profile.monthlySpend,
      loanAmount: loan ?? profile.loanAmount,
    });
    dismiss();
  };

  const questions = [
    { label: copy.primerBalanceQ, value: balance, set: setBalance },
    { label: copy.primerSpendQ, value: spend, set: setSpend },
    { label: copy.primerLoanQ, value: loan, set: setLoan },
  ];
  const current = questions[step];
  const isLast = step === questions.length - 1;

  return (
    <section className="cm-primer" aria-label={copy.primerTitle}>
      <h2>{copy.primerTitle}</h2>
      <p className="cm-primer-intro">{copy.primerIntro}</p>
      <p className="cm-primer-progress">
        {fillCopy(copy.primerProgress, { step: String(step + 1), total: String(questions.length) })}
      </p>
      <MoneyInput label={current.label} value={current.value} onValueChange={current.set} />
      <div className="cm-primer-actions">
        <Button variant="ghost" onClick={dismiss}>
          {copy.primerSkip}
        </Button>
        {isLast ? (
          <Button onClick={finish}>{copy.primerDone}</Button>
        ) : (
          <Button onClick={() => setStep(step + 1)}>{copy.primerNext}</Button>
        )}
      </div>
    </section>
  );
};

export default ProfilePrimer;
