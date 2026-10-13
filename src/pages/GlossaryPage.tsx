import React, { useMemo, useState } from 'react';

import { useSeoMeta } from '../hooks/useSeoMeta';
import type { GlossaryCategory } from '../locales';
import {
  filterGlossaryTerms,
  formatBengaliDate,
  getCategoryLabel,
  getDefinitionText,
  getTermText,
  glossaryCategories,
  glossaryTerms,
  useLanguage,
  getCommonCopy,
} from '../locales';
import '../styles/GlossaryPage.css';

const GlossaryPage: React.FC = () => {
  const { lang } = useLanguage();
  const common = getCommonCopy(lang);
  useSeoMeta({
    title: common.glossaryTitle,
    description: common.glossaryDescription,
    canonicalPath: '/glossary',
  });

  const { lang: currentLang, setLang } = useLanguage();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<GlossaryCategory | 'all'>('all');

  const isBengali = currentLang === 'bn';

  const visibleTerms = useMemo(() => {
    const filtered = filterGlossaryTerms(glossaryTerms, {
      query: searchTerm,
      category: activeCategory,
      lang: currentLang,
    });
    return [...filtered].sort((a, b) => a.term_en.localeCompare(b.term_en));
  }, [searchTerm, activeCategory, currentLang]);

  return (
    <div className="glossary-page">
      <div className="glossary-header">
        <h1>{common.glossaryTitle}</h1>
        <p>{common.glossaryDescription}</p>
      </div>

      <div className="glossary-controls">
        <div className="language-switcher-right">
          <div className="language-switcher" role="group" aria-label="Language">
            <button
              type="button"
              className={`lang-button ${currentLang === 'en' ? 'active' : ''}`}
              aria-pressed={currentLang === 'en'}
              onClick={() => setLang('en')}
            >
              EN
            </button>
            <button
              type="button"
              className={`lang-button ${currentLang === 'bn' ? 'active' : ''}`}
              aria-pressed={currentLang === 'bn'}
              onClick={() => setLang('bn')}
            >
              BN
            </button>
          </div>
        </div>

        <div className="search-box">
          <input
            type="text"
            aria-label={common.glossarySearchAriaLabel}
            placeholder={common.glossarySearchPlaceholder}
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
              {getCategoryLabel(category.id, currentLang)}
            </button>
          ))}
        </div>
      </div>

      <div className="glossary-content">
        {visibleTerms.length === 0 ? (
          <div className="no-results">
            <p>{common.glossaryNoResults}</p>
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
                      {getTermText(item, currentLang)}
                    </dt>
                    <dd className="definition" role="definition">
                      {getDefinitionText(item, currentLang)}
                    </dd>
                    <dd className="category-tag" role="definition">
                      {getCategoryLabel(item.category, currentLang)}
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
