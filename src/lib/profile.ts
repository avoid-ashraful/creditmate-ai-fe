/**
 * The user's decision profile: the numbers every scenario presets from
 * (plan Sections 2.3 and 4.2 — personalisation changes inputs, never
 * rankings). Phase 1 stores it on this device; server-side storage is a
 * Phase 3 backend item. Eligibility inputs are deliberately NOT part of
 * this profile — the eligibility endpoint stores nothing.
 */

import { useCallback, useEffect, useState } from 'react';

export interface ProfileValues {
  /** Typical average bank-account balance (BDT). */
  balance: number;
  /** Typical monthly credit-card spend (BDT). */
  monthlySpend: number;
  /** Planned personal-loan amount (BDT). */
  loanAmount: number;
}

export const PROFILE_DEFAULTS: ProfileValues = {
  balance: 50000,
  monthlySpend: 30000,
  loanAmount: 500000,
};

export const PROFILE_STORAGE_KEY = 'creditmate.profile.v1';

const listeners = new Set<() => void>();

const isValid = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

export const readProfile = (): ProfileValues => {
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return { ...PROFILE_DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<ProfileValues>;
    return {
      balance: isValid(parsed.balance) ? parsed.balance : PROFILE_DEFAULTS.balance,
      monthlySpend: isValid(parsed.monthlySpend)
        ? parsed.monthlySpend
        : PROFILE_DEFAULTS.monthlySpend,
      loanAmount: isValid(parsed.loanAmount) ? parsed.loanAmount : PROFILE_DEFAULTS.loanAmount,
    };
  } catch {
    return { ...PROFILE_DEFAULTS };
  }
};

export const writeProfile = (values: ProfileValues): void => {
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(values));
  } catch {
    // Storage can be unavailable (private mode); the profile just won't persist.
  }
  listeners.forEach(listener => listener());
};

/** True when the stored profile still equals the shipped defaults. */
export const isDefaultProfile = (values: ProfileValues): boolean =>
  values.balance === PROFILE_DEFAULTS.balance &&
  values.monthlySpend === PROFILE_DEFAULTS.monthlySpend &&
  values.loanAmount === PROFILE_DEFAULTS.loanAmount;

/** Subscribe to profile writes (used by the Phase 3 server sync). */
export const subscribeProfile = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useProfile = (): {
  profile: ProfileValues;
  setProfile: (values: ProfileValues) => void;
} => {
  const [profile, setProfileState] = useState<ProfileValues>(() => readProfile());

  useEffect(() => {
    const listener = () => setProfileState(readProfile());
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setProfile = useCallback((values: ProfileValues) => {
    writeProfile(values);
    setProfileState(values);
  }, []);

  return { profile, setProfile };
};
