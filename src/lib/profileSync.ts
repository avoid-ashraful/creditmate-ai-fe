/**
 * Server sync for the "Your numbers" profile (Phase 3, D4).
 *
 * Reconciliation on sign-in:
 * - Server values win field-by-field; fields the server has never stored
 *   keep the device's values.
 * - If the server holds nothing and the device profile differs from the
 *   shipped defaults, the device values are uploaded — the user's numbers
 *   follow them to the account instead of being stranded on one device.
 *
 * After that first sync, local profile writes are pushed to the server
 * (debounced). A failed push is not fatal: the local profile remains the
 * working copy and the next sign-in reconciles again.
 */

import { getServerProfileDefaults, updateServerProfileDefaults } from '../services/profile';

import {
  isDefaultProfile,
  ProfileValues,
  readProfile,
  subscribeProfile,
  writeProfile,
} from './profile';

const toNumber = (value: string | null): number | null => {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const toWire = (values: ProfileValues) => ({
  typical_balance: String(values.balance),
  monthly_card_spend: String(values.monthlySpend),
  planned_loan_amount: String(values.loanAmount),
});

let started = false;
let applyingServerState = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;

const pushNow = async (): Promise<void> => {
  try {
    await updateServerProfileDefaults(toWire(readProfile()));
  } catch {
    // Non-fatal: reconciled again at the next sign-in.
  }
};

const schedulePush = (): void => {
  if (applyingServerState) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void pushNow();
  }, 600);
};

/** Reconcile the device profile with the account's, then keep them in sync. */
export const startProfileSync = async (): Promise<void> => {
  if (started) return;
  started = true;
  subscribeProfile(schedulePush);
  try {
    const server = await getServerProfileDefaults();
    const local = readProfile();
    const serverBalance = toNumber(server.typical_balance);
    const serverSpend = toNumber(server.monthly_card_spend);
    const serverLoan = toNumber(server.planned_loan_amount);
    if (serverBalance !== null || serverSpend !== null || serverLoan !== null) {
      const merged: ProfileValues = {
        balance: serverBalance ?? local.balance,
        monthlySpend: serverSpend ?? local.monthlySpend,
        loanAmount: serverLoan ?? local.loanAmount,
      };
      if (
        merged.balance !== local.balance ||
        merged.monthlySpend !== local.monthlySpend ||
        merged.loanAmount !== local.loanAmount
      ) {
        applyingServerState = true;
        writeProfile(merged);
        applyingServerState = false;
      }
    } else if (!isDefaultProfile(local)) {
      await updateServerProfileDefaults(toWire(local));
    }
  } catch {
    // Offline or expired session: the local profile keeps working.
  }
};
