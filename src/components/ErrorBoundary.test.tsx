import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { analytics } from '../lib/analytics';
import { LanguageProvider } from '../locales';

import ErrorBoundary from './ErrorBoundary';

jest.mock('../lib/analytics', () => ({ analytics: { track: jest.fn() } }));

function Crasher(): JSX.Element {
  throw Object.assign(new Error('private message'), { name: 'RenderFault' });
}

describe('ErrorBoundary', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('shows accessible recovery without exposing an error message and reports only its name', () => {
    render(
      <MemoryRouter>
        <LanguageProvider initialLang="en">
          <ErrorBoundary>
            <Crasher />
          </ErrorBoundary>
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
    expect(screen.queryByText('private message')).not.toBeInTheDocument();
    expect(analytics.track).toHaveBeenCalledWith('app_error', { errorName: 'RenderFault' });
    const payload = (analytics.track as jest.Mock).mock.calls[0][1];
    expect(Object.keys(payload)).toEqual(['errorName']);
  });

  it('localizes its fallback in Bengali', () => {
    render(
      <MemoryRouter>
        <LanguageProvider initialLang="bn">
          <ErrorBoundary>
            <Crasher />
          </ErrorBoundary>
        </LanguageProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: 'কিছু সমস্যা হয়েছে' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'হোমে যান' })).toBeInTheDocument();
  });
});
