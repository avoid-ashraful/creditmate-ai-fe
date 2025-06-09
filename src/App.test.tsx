import { render, screen } from '@testing-library/react';
import React from 'react';

import App from './App';

test('renders main application content', () => {
  render(<App />);

  // Check if the header is rendered
  const headerElement = screen.getByText(/CreditMate AI/i);
  expect(headerElement).toBeInTheDocument();

  // Check if navigation links are rendered
  const homeLink = screen.getByText(/Home/i);
  expect(homeLink).toBeInTheDocument();

  const compareLink = screen.getByText(/Compare Cards/i);
  expect(compareLink).toBeInTheDocument();

  const glossaryLink = screen.getByText(/Glossary/i);
  expect(glossaryLink).toBeInTheDocument();

  const aboutLink = screen.getByText(/About/i);
  expect(aboutLink).toBeInTheDocument();

  // Check if the footer is rendered
  const footerElement = screen.getByText(/All rights reserved/i);
  expect(footerElement).toBeInTheDocument();
});
