import React, { useMemo, useState } from 'react';

import { useSeoMeta } from '../hooks/useSeoMeta';
import {
  filterGlossaryTerms,
  formatBengaliDate,
  getCategoryLabel,
  getDefinitionText,
  getTermText,
  glossaryCategories,
  glossaryTerms,
  useLanguage,
} from '../locales';
import type { GlossaryCategory } from '../locales';
import '../styles/GlossaryPage.css';

const GlossaryPage: React.FC = () => {
  useSeoMeta({
    title: 'Financial terms glossary | CreditMate AI',
    description:
      'Plain-language definitions of credit card terms, including annual fee, interest rate, cash advance and lounge access.',
    canonicalPath: '/glossary',
  });

  const { lang, setLang } = useLanguage();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<GlossaryCategory | 'all'>('all');

  const isBengali = lang === 'bn';

  const visibleTerms = useMemo(() => {
    const filtered = filterGlossaryTerms(glossaryTerms, {
      query: searchTerm,
      category: activeCategory,
      lang,
    });
    return [...filtered].sort((a, b) => a.term_en.localeCompare(b.term_en));
  }, [searchTerm, activeCategory, lang]);

  return (
    <div className="glossary-page">
      <div className="glossary-header">
        <h1>{isBengali ? 'আর্থিক শব্দকোষ' : 'Financial Terms Glossary'}</h1>
        <p>
          {isBengali
            ? 'ক্রেডিট কার্ডের প্রস্তাব ও আর্থিক পণ্যে ব্যবহৃত মূল পরিভাষাগুলো বুঝুন।'
            : 'Understanding the key terminology used in credit card offers and financial products'}
        </p>
      </div>

      <div className="glossary-controls">
        <div className="language-switcher-right">
          <div className="language-switcher" role="group" aria-label="Language">
            <button
              type="button"
              className={`lang-button ${lang === 'en' ? 'active' : ''}`}
              aria-pressed={lang === 'en'}
              onClick={() => setLang('en')}
            >
              EN
            </button>
            <button
              type="button"
              className={`lang-button ${lang === 'bn' ? 'active' : ''}`}
              aria-pressed={lang === 'bn'}
              onClick={() => setLang('bn')}
            >
              BN
            </button>
          </div>
        </div>

        <div className="search-box">
          <input
            type="text"
            aria-label={isBengali ? 'শব্দ খুঁজুন' : 'Search glossary'}
            placeholder={isBengali ? 'শব্দ খুঁজুন...' : 'Search for terms...'}
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="category-filters">
          {glossaryCategories.map(category => (
            <button
              type="button"
              key={category.id}
              className={`category-button ${activeCategory === category.id ? 'active' : ''}`}
              aria-pressed={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
            >
              {getCategoryLabel(category.id, lang)}
            </button>
          ))}
        </div>
      </div>

      <div className="glossary-content">
        {visibleTerms.length === 0 ? (
          <div className="no-results">
            <p>
              {isBengali
                ? 'আপনার অনুসন্ধানের সাথে কোনো শব্দ মেলেনি। অনুসন্ধান বা বিভাগ পরিবর্তন করে দেখুন।'
                : 'No terms match your search criteria. Try adjusting your search or category filter.'}
            </p>
          </div>
        ) : (
          <section aria-labelledby="terms-heading">
            <h2 id="terms-heading" className="visually-hidden">
              {isBengali ? 'শব্দের তালিকা' : 'Terms list'}
            </h2>
            <dl className="terms-list">
              {visibleTerms.map(item => {
                const showBengaliDate =
                  item.bengaliCalendarDate !== null && isBengali
                    ? formatBengaliDate(new Date(item.bengaliCalendarDate))
                    : '';

                return (
                  <React.Fragment key={item.id}>
                    <dt className="term" role="term">
                      {getTermText(item, lang)}
                    </dt>
                    <dd className="definition" role="definition">
                      {getDefinitionText(item, lang)}
                    </dd>
                    {showBengaliDate && (
                      <dd className="bengali-calendar-tag" role="definition">
                        {showBengaliDate}
                      </dd>
                    )}
                  </React.Fragment>
                );
              })}
            </dl>
          </section>
        )}
      </div>
    </div>
  );
};

export default GlossaryPage;
