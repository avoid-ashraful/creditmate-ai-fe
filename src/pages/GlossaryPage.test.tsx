import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LanguageProvider } from '../locales';
import { glossaryTerms } from '../locales/glossary';

import GlossaryPage from './GlossaryPage';

const renderGlossary = (initialLang: 'en' | 'bn' = 'en') =>
  render(
    <LanguageProvider initialLang={initialLang}>
      <GlossaryPage />
    </LanguageProvider>
  );

describe('GlossaryPage', () => {
  it('renders English glossary content by default', () => {
    renderGlossary();
    expect(screen.getByRole('heading', { name: 'Financial Terms Glossary' })).toBeInTheDocument();
    expect(screen.getByText('Annual Fee')).toBeInTheDocument();
    expect(screen.getByText(glossaryTerms[0].definition_en)).toBeInTheDocument();
  });

  it('renders all glossary entries (>= 50) in the list', () => {
    renderGlossary();
    const list = screen.getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items.length).toBeGreaterThanOrEqual(50);
  });

  it('switches to Bengali and back with the language buttons', async () => {
    const user = userEvent.setup();
    renderGlossary();

    expect(screen.getByText('Annual Fee')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'BN' }));
    expect(screen.getByRole('heading', { name: 'আর্থিক শব্দকোষ' })).toBeInTheDocument();
    expect(screen.queryByText('Annual Fee')).not.toBeInTheDocument();
    expect(screen.getByText('বার্ষিক ফি')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByText('Annual Fee')).toBeInTheDocument();
  });

  it('filters by category', async () => {
    const user = userEvent.setup();
    renderGlossary();

    await user.click(screen.getByRole('button', { name: 'Fees & Charges' }));

    const list = screen.getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items.length).toBeGreaterThan(0);
    items.forEach(item => {
      expect(item.textContent).toMatch(/Fee|ফি|মাশুল|Charge|চার্জ/);
    });
  });

  it('searches in both languages', async () => {
    const user = userEvent.setup();
    renderGlossary();

    const searchBox = screen.getByRole('textbox', { name: 'Search glossary' });
    await user.type(searchBox, 'credit');

    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem').length).toBeGreaterThan(0);

    await user.clear(searchBox);
    await user.click(screen.getByRole('button', { name: 'BN' }));
    const bengaliSearch = screen.getByRole('textbox', { name: 'শব্দ খুঁজুন' });
    await user.type(bengaliSearch, 'ক্রেডিট');
    expect(within(list).getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup();
    renderGlossary();

    await user.type(
      screen.getByRole('textbox', { name: 'Search glossary' }),
      'zzzz-not-a-real-term'
    );
    expect(screen.getByText(/No terms match your search criteria/i)).toBeInTheDocument();
  });
});
