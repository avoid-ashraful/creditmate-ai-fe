import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { CATEGORIES, Category, getCategoryBySlug } from '../config/categories';
import { LanguageProvider } from '../locales';

import CategoryCard from './CategoryCard';

test('all required categories exist', () => {
  const slugs = CATEGORIES.map(c => c.slug);
  expect(slugs).toEqual([
    'travel',
    'cashback',
    'premium',
    'student',
    'business',
    'no-annual-fee',
    'islamic',
  ]);
});

test('CategoryCard renders name, description and link', () => {
  const travel = getCategoryBySlug('travel');
  expect(travel).toBeDefined();
  render(
    <BrowserRouter>
      <CategoryCard category={travel as Category} />
    </BrowserRouter>
  );
  expect(screen.getByText('Travel')).toBeInTheDocument();
  const link = screen.getByRole('link');
  expect(link).toHaveAttribute('href', '/cards?categories=travel');
});

test('CategoryCard links islamic to the Islamic filter, not categories=islamic', () => {
  const islamic = getCategoryBySlug('islamic');
  expect(islamic).toBeDefined();
  render(
    <BrowserRouter>
      <CategoryCard category={islamic as Category} />
    </BrowserRouter>
  );
  // The backend canonical taxonomy has no `islamic` category slug; the
  // card must land on the discovery Islamic filter instead.
  expect(screen.getByRole('link')).toHaveAttribute('href', '/cards?is_islamic=true');
});

test('each category has SEO metadata', () => {
  CATEGORIES.forEach(category => {
    expect(category.metaTitle).toBeTruthy();
    expect(category.metaDescription).toBeTruthy();
    expect(category.badge).toBeTruthy();
  });
});

test('CategoryCard uses the visible Bengali text as its accessible name', () => {
  render(
    <LanguageProvider initialLang="bn">
      <BrowserRouter>
        <CategoryCard category={getCategoryBySlug('travel') as Category} />
      </BrowserRouter>
    </LanguageProvider>
  );
  expect(screen.getByText('ভ্রমণ')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /ভ্রমণ/ })).toHaveAttribute(
    'href',
    '/cards?categories=travel'
  );
  expect(screen.queryByText('Travel')).not.toBeInTheDocument();
});
