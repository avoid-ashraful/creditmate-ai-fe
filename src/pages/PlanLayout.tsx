/**
 * Plan workspace shell (redesign plan Section 4.8, Phase 3).
 *
 * One workspace, several tools: the sub-navigation switches tools without
 * losing the workspace frame, and every tool's inputs live in its URL so
 * scenarios are shareable and reopenable. Eligibility stays in Cards mode
 * (it produces a shortlist, Phase 2) — Plan links to it as a tool entry
 * rather than duplicating it.
 */

import React from 'react';
import { Link, NavLink } from 'react-router-dom';

import { useLanguage } from '../locales';
import { getPlanCopy, type PlanCopy } from '../locales/plan';

import './PlanPage.css';

const PlanLayout: React.FC<{
  titleKey: keyof PlanCopy;
  landing?: boolean;
  children: React.ReactNode;
}> = ({ titleKey, landing = false, children }) => {
  const { lang } = useLanguage();
  const copy = getPlanCopy(lang);
  const title = copy[titleKey];
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `plan-nav-link${isActive ? ' plan-nav-link-active' : ''}`;
  return (
    <div className="plan-page">
      {landing ? null : (
        <p>
          <Link to="/plan">← {copy.backToPlan}</Link>
        </p>
      )}
      <h1>{title}</h1>
      <nav className="plan-nav" aria-label={copy.toolsHeading}>
        <NavLink to="/plan/emi" className={linkClass}>
          {copy.toolEmi}
        </NavLink>
        <NavLink to="/plan/payoff" className={linkClass}>
          {copy.toolPayoff}
        </NavLink>
        <NavLink to="/plan/rewards" className={linkClass}>
          {copy.toolRewards}
        </NavLink>
        <NavLink to="/plan/deposit" className={linkClass}>
          {copy.toolDeposit}
        </NavLink>
        <NavLink to="/plan/loan" className={linkClass}>
          {copy.toolLoan}
        </NavLink>
        <NavLink to="/plan/account" className={linkClass}>
          {copy.toolAccount}
        </NavLink>
        <NavLink to="/eligibility-checker" className={linkClass}>
          {copy.toolEligibility}
        </NavLink>
      </nav>
      {children}
    </div>
  );
};

export default PlanLayout;
