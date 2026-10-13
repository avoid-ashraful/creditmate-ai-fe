import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { PageViewTrackerWrapper } from './App';
import { ANALYTICS_EVENTS, analytics } from './lib/analytics';

jest.mock('./services/api');

describe('App', () => {
  const provider = jest.fn();

  beforeEach(() => {
    process.env.REACT_APP_ANALYTICS_KEY = 'test-key';
    provider.mockClear();
    analytics.setProvider(provider);
    analytics.optIn();
  });

  afterEach(() => {
    analytics.setProvider(null);
    analytics.optIn();
    process.env.REACT_APP_ANALYTICS_KEY = '';
  });

  it('tracks one page view for the current route', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <Routes>
          <Route path="/about" element={<PageViewTrackerWrapper />} />
        </Routes>
      </MemoryRouter>
    );

    expect(provider).toHaveBeenCalledTimes(1);
    expect(provider).toHaveBeenCalledWith({
      name: ANALYTICS_EVENTS.pageView,
      properties: {},
    });
  });
});
