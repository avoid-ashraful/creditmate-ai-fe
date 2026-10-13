/**
 * Isolated parsing for GET /api/v1/credit-cards/typeahead/?q=...
 *
 * Backend work (task-6.2-search-api) runs in parallel; this module is the
 * single place that maps the wire response to UI models so any key drift is
 * contained here. See docs/typeahead-contract.md for the agreed keys.
 *
 * The parser is deliberately defensive: the backend may omit or rename fields,
 * and the frontend should degrade gracefully rather than throw.
 */

export const MAX_SUGGESTIONS_PER_GROUP = 5;
export const MAX_FACETS = 6;
export const MAX_DID_YOU_MEAN_LENGTH = 64;

export interface TypeaheadCardSuggestion {
  id: number;
  name: string;
  bankName?: string;
}

export interface TypeaheadBankSuggestion {
  id: number;
  name: string;
  cardCount?: number;
}

export interface TypeaheadCategorySuggestion {
  slug: string;
  name: string;
  count?: number;
}

export interface TypeaheadFacet {
  slug: string;
  label: string;
  count: number;
}

export interface TypeaheadResult {
  query: string;
  cards: TypeaheadCardSuggestion[];
  banks: TypeaheadBankSuggestion[];
  categories: TypeaheadCategorySuggestion[];
  facets: TypeaheadFacet[];
  didYouMean: string | null;
}

const isString = (value: unknown): value is string => typeof value === 'string';

const isNumber = (value: unknown): value is number => typeof value === 'number';

const asString = (value: unknown): string | undefined => {
  if (!isString(value)) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const asNumberSafe = (value: unknown): number | undefined => {
  if (!isNumber(value)) return undefined;
  return Number.isFinite(value) ? value : undefined;
};

const maybe = <T>(value: unknown, defaultValue: T): T => {
  return value !== undefined && value !== null ? (value as T) : defaultValue;
};

/**
 * Wrap a possibly-single value or array into an array.
 * Also handles the case where the value is an object with card/banks/categories
 * keys (the MSW mock shape) by extracting the relevant array.
 */
const asArray = <T>(value: unknown): T[] => {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value as T[];
  // If it's an object with known keys, try to extract arrays from it
  const obj = value as Record<string, unknown>;
  if (Array.isArray(obj.cards)) return obj.cards as T[];
  if (Array.isArray(obj.banks)) return obj.banks as T[];
  if (Array.isArray(obj.categories)) return obj.categories as T[];
  if (Array.isArray(obj.suggestions)) return obj.suggestions as T[];
  return [value as T];
};

const parseCard = (item: unknown): TypeaheadCardSuggestion | null => {
  if (item === null || item === undefined) return null;
  const obj = (typeof item === 'object' && !Array.isArray(item) ? item : {}) as Record<
    string,
    unknown
  >;

  const id = asNumberSafe(obj.id);
  const name = asString(obj.name);

  if (id === undefined || name === undefined) return null;

  const bankName = asString(obj.bank_name) ?? asString(obj.bankName);

  return { id, name, bankName: bankName ?? undefined };
};

const parseBank = (item: unknown): TypeaheadBankSuggestion | null => {
  if (item === null || item === undefined) return null;
  const obj = (typeof item === 'object' && !Array.isArray(item) ? item : {}) as Record<
    string,
    unknown
  >;

  const id = asNumberSafe(obj.id);
  const name = asString(obj.name);
  const cardCount = asNumberSafe(obj.card_count) ?? asNumberSafe(obj.cardCount);

  if (id === undefined || name === undefined) return null;

  return { id, name, cardCount: cardCount ?? undefined };
};

const parseCategory = (item: unknown): TypeaheadCategorySuggestion | null => {
  if (item === null || item === undefined) return null;
  const obj = (typeof item === 'object' && !Array.isArray(item) ? item : {}) as Record<
    string,
    unknown
  >;

  const slug = asString(obj.slug);
  const name = asString(obj.name);

  if (slug === undefined || name === undefined) return null;

  const count = asNumberSafe(obj.count);

  return { slug, name, count: count ?? undefined };
};

const parseFacet = (item: unknown): TypeaheadFacet | null => {
  if (item === null || item === undefined) return null;
  const obj = (typeof item === 'object' && !Array.isArray(item) ? item : {}) as Record<
    string,
    unknown
  >;

  const slug = asString(obj.slug) ?? asString(obj.label);
  const label = asString(obj.label) ?? asString(obj.slug);
  const count = asNumberSafe(obj.count);

  if (slug === undefined || label === undefined || count === undefined) return null;

  return { slug: slug, label: label, count: count };
};

const parseDidYouMean = (raw: unknown): string | null => {
  if (raw === null || raw === undefined) return null;
  const text = asString(raw);
  if (text === undefined || text.length === 0) return null;
  if (text.length > MAX_DID_YOU_MEAN_LENGTH) return null;
  return text;
};

const highlightParts = (text: string, query: string): { text: string; matched: boolean }[] => {
  const trimmed = query.trim();
  if (!trimmed) return [{ text, matched: false }];

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();

  const parts: { text: string; matched: boolean }[] = [];
  let searchIndex = 0;

  while (searchIndex < lowerText.length) {
    const matchIndex = lowerText.indexOf(lowerQuery, searchIndex);
    if (matchIndex === -1) {
      // No more matches – remaining text is unmatched
      parts.push({ text: text.slice(searchIndex), matched: false });
      break;
    }
    if (matchIndex > searchIndex) {
      parts.push({ text: text.slice(searchIndex, matchIndex), matched: false });
    }
    parts.push({
      text: text.slice(matchIndex, matchIndex + trimmed.length),
      matched: true,
    });
    searchIndex = matchIndex + trimmed.length;
  }

  return parts;
};

export const parseTypeaheadResponse = (raw: unknown, query: string): TypeaheadResult => {
  const root = (
    typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? raw : {}
  ) as Record<string, unknown>;

  // Suggestions – determine shape:
  // 1. If root.suggestions is an object (not array),
  //    treat as MSW mock shape {cards, banks, categories}
  // 2. Otherwise (array or missing), treat as backend shape:
  //    suggestions array of flat objects with a "type" field
  const suggestionsObject =
    root.suggestions && typeof root.suggestions === 'object' && !Array.isArray(root.suggestions)
      ? (root.suggestions as Record<string, unknown>)
      : {};

  // If suggestions is an array of flat objects (backend shape), parse by type
  const suggestionsArray = Array.isArray(root.suggestions)
    ? (root.suggestions as Array<{
        type: string;
        id: number;
        label: string;
        detail?: string;
      }>)
    : undefined;

  const cards = maybe(
    asArray<unknown>(suggestionsObject.cards)
      .map(parseCard)
      .filter((c): c is TypeaheadCardSuggestion => c !== null),
    [] as TypeaheadCardSuggestion[]
  ).slice(0, MAX_SUGGESTIONS_PER_GROUP);

  // If backend flat-shape and no cards parsed from structured shape, parse from flat array
  const cardsFromBackend =
    suggestionsArray
      ?.filter(s => s.type === 'card')
      .map(s => ({
        id: s.id,
        name: s.label,
        bankName: s.detail,
      })) ?? [];

  const banks = maybe(
    asArray<unknown>(suggestionsObject.banks)
      .map(parseBank)
      .filter((b): b is TypeaheadBankSuggestion => b !== null),
    [] as TypeaheadBankSuggestion[]
  ).slice(0, MAX_SUGGESTIONS_PER_GROUP);

  const banksFromBackend =
    suggestionsArray
      ?.filter(s => s.type === 'bank')
      .map(s => ({
        id: s.id,
        name: s.label,
        cardCount: undefined,
      })) ?? [];

  const categories = maybe(
    asArray<unknown>(suggestionsObject.categories)
      .map(parseCategory)
      .filter((c): c is TypeaheadCategorySuggestion => c !== null),
    [] as TypeaheadCategorySuggestion[]
  ).slice(0, MAX_SUGGESTIONS_PER_GROUP);

  // If backend flat-shape and no categories parsed from structured shape, parse from flat array
  const categoriesFromBackend =
    suggestionsArray
      ?.filter(s => s.type === 'category')
      .map(s => {
        // Extract slug from backend (required) and name/count (optional)
        const slug = asString((s as Record<string, unknown>).slug);
        const name = asString((s as Record<string, unknown>).name) ?? asString(s.label);
        const count = asNumberSafe((s as Record<string, unknown>).count);

        // Only emit valid categories with slug
        if (!slug || !name) return null;
        return { slug, name, count: count ?? undefined } as TypeaheadCategorySuggestion;
      })
      .filter((c): c is TypeaheadCategorySuggestion => c !== null) ?? [];

  const facets = maybe(
    asArray<unknown>(root.facets ?? suggestionsObject.facets)
      .map(parseFacet)
      .filter((f): f is TypeaheadFacet => f !== null),
    [] as TypeaheadFacet[]
  ).slice(0, MAX_FACETS);

  const didYouMean = parseDidYouMean(root.did_you_mean ?? root.didYouMean);

  // Use backend-parsed arrays if they have content, otherwise fall back to structured parse
  const finalCards = cardsFromBackend.length > 0 ? cardsFromBackend : cards;
  const finalBanks = banksFromBackend.length > 0 ? banksFromBackend : banks;
  const finalCategories = categoriesFromBackend.length > 0 ? categoriesFromBackend : categories;

  return {
    query,
    cards: finalCards,
    banks: finalBanks,
    categories: finalCategories,
    facets,
    didYouMean,
  };
};

const typeaheadUtils = {
  MAX_SUGGESTIONS_PER_GROUP,
  MAX_FACETS,
  MAX_DID_YOU_MEAN_LENGTH,
  highlightParts,
};

export default typeaheadUtils;

export { highlightParts, parseDidYouMean };
