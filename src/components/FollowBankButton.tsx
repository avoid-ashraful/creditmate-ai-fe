/**
 * Follow-a-bank action (redesign Section 4.11, decision D4).
 *
 * The follow is a real server-side subscription (alerts bank-follows
 * endpoints) — never localStorage. Signed-out visitors get an honest
 * sign-in prompt instead of a toggle that would silently do nothing.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../hooks/AuthProvider';
import { getAlertsCopy, useLanguage } from '../locales';
import { alertsClient } from '../services/alerts';

import './FollowBankButton.css';

interface FollowBankButtonProps {
  bankId: number;
  bankName: string;
}

const FollowBankButton: React.FC<FollowBankButtonProps> = ({ bankId, bankName }) => {
  const { status: authStatus } = useAuth();
  const { lang } = useLanguage();
  const copy = getAlertsCopy(lang);

  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (authStatus !== 'authenticated') return;
    try {
      const follows = await alertsClient.listBankFollows();
      setIsFollowing(follows.results.some(follow => follow.bank === bankId));
    } catch (err) {
      console.error('Failed to load bank follows:', err);
    }
  }, [authStatus, bankId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (authStatus !== 'authenticated') {
    return (
      <p className="cm-follow-bank-prompt">
        {copy.followBankPrompt}{' '}
        <Link to="/login" className="cm-follow-bank-login">
          {copy.followBank}
        </Link>
      </p>
    );
  }

  const handleToggle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isFollowing) {
        await alertsClient.unfollowBank(bankId);
        setIsFollowing(false);
      } else {
        await alertsClient.followBank(bankId);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Bank follow toggle failed:', err);
      setError(copy.followBankError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cm-follow-bank">
      <button
        type="button"
        className={`cm-follow-bank-button${isFollowing ? ' is-following' : ''}`}
        onClick={handleToggle}
        disabled={isLoading}
        aria-pressed={isFollowing}
        aria-label={`${isFollowing ? copy.followingBank : copy.followBank}: ${bankName}`}
      >
        {isFollowing ? copy.followingBank : copy.followBank}
      </button>
      {error && (
        <p className="cm-follow-bank-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default FollowBankButton;
