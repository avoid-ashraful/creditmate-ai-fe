import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import RelatedContent from './RelatedContent';

const renderWithRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('RelatedContent', () => {
  test('lists internal links under a labelled section', () => {
    renderWithRouter(
      <RelatedContent
        heading="More guides"
        links={[
          { to: '/guides/first-card', label: 'First card', description: 'Start here.' },
          { to: '/guides/fees', label: 'Annual fees' },
        ]}
      />
    );

    const section = screen.getByRole('region', { name: 'More guides' });
    expect(section).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'First card' })).toHaveAttribute(
      'href',
      '/guides/first-card'
    );
    expect(screen.getByRole('link', { name: 'Annual fees' })).toHaveAttribute(
      'href',
      '/guides/fees'
    );
    expect(screen.getByText('Start here.')).toBeInTheDocument();
  });

  test('renders nothing when there are no links', () => {
    const { container } = renderWithRouter(<RelatedContent heading="Empty" links={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
