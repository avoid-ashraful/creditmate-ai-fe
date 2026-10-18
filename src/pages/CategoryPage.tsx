import { AnimatePresence } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import CardDetailsPopup from '../components/CardDetailsPopup';
import CardList from '../components/CardList';
import ComparisonBar from '../components/ComparisonBar';
import RelatedContent, { RelatedLink } from '../components/RelatedContent';
import { SkeletonCardGrid } from '../components/Skeleton';
import Toast from '../components/Toast';
import { CATEGORIES, Category, getCategoryBySlug } from '../config/categories';
import { getGuide } from '../content/guides';
import {
  useLanguage,
  getCommonCopy,
  getCategoryText,
  getCategoryHeading,
  type Language,
} from '../locales';
import { apiService, CreditCardApiResponse } from '../services/api';
import { CreditCard } from '../types';
import { resetSeoMeta, setSeoMeta } from '../utils/seo';
import { breadcrumbJsonLd } from '../utils/structuredData';
import '../styles/HomePage.css';
import '../styles/CategoryPage.css';

const PAGE_SIZE = 100;

const guideLinksFor = (category: Category): RelatedLink[] =>
  category.relatedGuideSlugs.flatMap(slug => {
    const guide = getGuide(slug);
    return guide ? [{ to: `/guides/${guide.slug}`, label: guide.title }] : [];
  });

const otherCategoryLinksFor = (category: Category, lang: Language): RelatedLink[] =>
  CATEGORIES.filter(other => other.slug !== category.slug).map(other => ({
    to: `/category/${other.slug}`,
    label: getCategoryText(other, lang).name,
  }));

interface CategoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CreditCardApiResponse[];
}

interface QueryStreams {
  primary: { page: number; exhausted: boolean };
  alternate: { page: number; exhausted: boolean };
}

const mergeCards = (cards: CreditCard[]): CreditCard[] => {
  const mergedCards = new Map(cards.map(card => [card.id, card]));
  cards.forEach(card => mergedCards.set(card.id, card));
  return Array.from(mergedCards.values());
};

const transformResponses = (responses: CategoryResponse[]): CreditCard[] =>
  mergeCards(
    responses.flatMap(response =>
      response.results.map(card => apiService.transformCreditCard(card))
    )
  );

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const category = slug ? getCategoryBySlug(slug) : undefined;
  const { lang } = useLanguage();
  const common = getCommonCopy(lang);

  const [cards, setCards] = useState<CreditCard[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [viewedCard, setViewedCard] = useState<CreditCard | null>(null);
  const [selectionMessage, setSelectionMessage] = useState<string>('');
  const [queryStreams, setQueryStreams] = useState<QueryStreams>({
    primary: { page: 1, exhausted: false },
    alternate: { page: 1, exhausted: false },
  });
  const [hasMorePages, setHasMorePages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const queryGenerationRef = useRef(0);

  useEffect(() => {
    if (category) {
      setSeoMeta({
        title: category.metaTitle,
        description: category.metaDescription,
        canonicalPath: `/category/${category.slug}`,
        jsonLd: breadcrumbJsonLd(window.location.origin, [
          { name: 'Home', path: '/' },
          { name: category.name, path: `/category/${category.slug}` },
        ]),
      });
    }
    return () => {
      resetSeoMeta();
    };
  }, [category]);

  useEffect(() => {
    const loadedCardIds = new Set(cards.map(card => card.id));
    setSelectedCardIds(previousIds => previousIds.filter(id => loadedCardIds.has(id)));
  }, [cards]);

  useEffect(() => {
    if (!category) return;

    const requestGeneration = ++queryGenerationRef.current;
    let cancelled = false;
    setIsLoadingMore(false);
    setHasMorePages(false);
    const { fallbackSearchTerm, ...filters } = category.filters;

    const fetchInitialCards = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const responses: CategoryResponse[] = fallbackSearchTerm
          ? await Promise.all([
              apiService.getCreditCards({
                ...filters,
                page_size: PAGE_SIZE,
              }),
              apiService.getCreditCards({
                ...filters,
                searchTerm: fallbackSearchTerm,
                page_size: PAGE_SIZE,
              }),
            ])
          : [
              await apiService.getCreditCards({
                ...filters,
                page_size: PAGE_SIZE,
              }),
            ];

        if (cancelled) return;
        if (queryGenerationRef.current !== requestGeneration) return;
        const transformedCards = transformResponses(responses);
        setCards(transformedCards);
        setTotalCount(transformedCards.length);
        setQueryStreams({
          primary: {
            page: responses[0].next ? 2 : 1,
            exhausted: !responses[0].next,
          },
          alternate: {
            page: responses[1]?.next ? 2 : 1,
            exhausted: !responses[1]?.next,
          },
        });
        setHasMorePages(responses.some(response => response.next !== null));
      } catch (fetchError) {
        if (cancelled) return;
        if (queryGenerationRef.current !== requestGeneration) return;
        console.error('Failed to fetch category cards:', fetchError);
        setError(common.categoryErrorLoading);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchInitialCards();
    return () => {
      cancelled = true;
    };
  }, [category, common.categoryErrorLoading]);

  const loadMoreCards = async (): Promise<void> => {
    if (!category || !hasMorePages || isLoadingMore) return;

    const requestGeneration = queryGenerationRef.current;
    setIsLoadingMore(true);
    const { fallbackSearchTerm, ...filters } = category.filters;
    const requests: Array<{
      stream: 'primary' | 'alternate';
      page: number;
      request: Promise<CategoryResponse>;
    }> = [];

    if (!queryStreams.primary.exhausted) {
      requests.push({
        stream: 'primary',
        page: queryStreams.primary.page,
        request: apiService.getCreditCards({
          ...filters,
          page: queryStreams.primary.page,
          page_size: PAGE_SIZE,
        }),
      });
    }

    if (fallbackSearchTerm && !queryStreams.alternate.exhausted) {
      requests.push({
        stream: 'alternate',
        page: queryStreams.alternate.page,
        request: apiService.getCreditCards({
          ...filters,
          searchTerm: fallbackSearchTerm,
          page: queryStreams.alternate.page,
          page_size: PAGE_SIZE,
        }),
      });
    }

    if (requests.length === 0) {
      setHasMorePages(false);
      setIsLoadingMore(false);
      return;
    }

    try {
      const responses = await Promise.all(requests.map(request => request.request));
      if (queryGenerationRef.current !== requestGeneration) return;
      setCards(previousCards => {
        const nextCards = mergeCards([...previousCards, ...transformResponses(responses)]);
        setTotalCount(nextCards.length);
        return nextCards;
      });
      setQueryStreams(previousStreams => {
        const updatedStreams: QueryStreams = { ...previousStreams };
        requests.forEach((request, index) => {
          if (responses[index].next) {
            updatedStreams[request.stream] = {
              page: request.page + 1,
              exhausted: false,
            };
          } else {
            updatedStreams[request.stream] = { page: request.page, exhausted: true };
          }
        });
        return updatedStreams;
      });
      setHasMorePages(requests.some((request, index) => Boolean(responses[index].next)));
    } catch (fetchError) {
      if (queryGenerationRef.current !== requestGeneration) return;
      console.error('Failed to load more category cards:', fetchError);
      setError(common.categoryErrorLoadingMore);
    } finally {
      if (queryGenerationRef.current === requestGeneration) {
        setIsLoadingMore(false);
      }
    }
  };

  if (!category) {
    return (
      <div className="category-page">
        <div className="category-not-found">
          <h1>{common.categoryNotFoundTitle}</h1>
          <p>{common.categoryNotFoundDesc}</p>
          <Link to="/">{common.categoryBackHome}</Link>
        </div>
      </div>
    );
  }

  const handleCardSelect = (card: CreditCard) => {
    if (selectedCardIds.includes(card.id)) {
      setSelectionMessage('');
      setSelectedCardIds(prev => prev.filter(id => id !== card.id));
      return;
    }
    if (selectedCardIds.length >= 4) {
      setSelectionMessage(common.categorySelectionLimit);
      return;
    }
    setSelectionMessage('');
    setSelectedCardIds(prev => [...prev, card.id]);
  };

  const categoryText = getCategoryText(category, lang);

  return (
    <div className="category-page">
      <div className="category-header">
        <span className="category-badge">{categoryText.badge}</span>
        <h1>
          {category.icon} {getCategoryHeading(categoryText.name, lang)}
        </h1>
        <p>{categoryText.description}</p>
        {!isLoading && !error && (
          <span className="category-count">
            {totalCount} {common.categoryCount}
          </span>
        )}
      </div>

      {isLoading ? (
        <SkeletonCardGrid label={common.categorySkeletonLabel} />
      ) : error ? (
        <div className="error-state" role="alert">
          {error}
        </div>
      ) : (
        <>
          <CardList
            cards={cards}
            onCardSelect={handleCardSelect}
            selectedCardIds={selectedCardIds}
            maxSelections={4}
            onViewCardDetails={setViewedCard}
          />

          <AnimatePresence>
            {viewedCard && (
              <CardDetailsPopup
                key={viewedCard.id}
                card={viewedCard}
                onClose={() => setViewedCard(null)}
                onAddToCompare={handleCardSelect}
                isInCompareList={selectedCardIds.includes(viewedCard.id)}
              />
            )}
          </AnimatePresence>

          {hasMorePages && (
            <div className="load-more-container">
              <button
                type="button"
                className="load-more-button"
                onClick={loadMoreCards}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? common.categoryLoadingMore : common.categoryLoadMore}
              </button>
            </div>
          )}

          <ComparisonBar
            selectedCards={cards.filter(card => selectedCardIds.includes(card.id))}
            onRemoveCard={cardId => setSelectedCardIds(prev => prev.filter(id => id !== cardId))}
            maxSelections={4}
          />

          <Toast className="selection-message" message={selectionMessage} />
        </>
      )}

      <RelatedContent heading={common.categoryRelatedGuides} links={guideLinksFor(category)} />
      <RelatedContent
        heading={common.categoryOtherCategories}
        links={otherCategoryLinksFor(category, lang)}
      />
    </div>
  );
};

export default CategoryPage;
