import { act, render, screen } from '@testing-library/react';
import React from 'react';

import { LanguageProvider } from '../locales';
import { ApiError } from '../services/apiError';

import NetworkStatus from './NetworkStatus';

describe('NetworkStatus', () => {
  afterEach(() => jest.useRealTimers());

  const renderStatus = () =>
    render(
      <LanguageProvider initialLang="en">
        <NetworkStatus />
      </LanguageProvider>
    );

  it('announces a rate limit and enables retry after the Retry-After countdown', () => {
    jest.useFakeTimers();
    renderStatus();
    act(() => {
      window.dispatchEvent(
        new CustomEvent('api-http-failure', {
          detail: new ApiError({ status: 429, retryAfter: 2 }),
        })
      );
    });
    expect(screen.getByText('Too many requests. Try again in 2s.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeDisabled();
    act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByText('Too many requests. Try again in 1s.')).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled();
  });

  it('offers retry for a server failure', () => {
    renderStatus();
    act(() => {
      window.dispatchEvent(
        new CustomEvent('api-http-failure', { detail: new ApiError({ status: 503 }) })
      );
    });
    expect(screen.getByText('The service is unavailable. Try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled();
  });
});
