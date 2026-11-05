import type { Language } from '../locales';

import type { CreditCardApiResponse } from './api';
import { authClient, ApiError } from './auth';

export interface SavedComparison {
  id: number;
  name: string;
  card_ids?: number[];
  notes?: string;
  cards?: Array<{ id: number; name: string; bank_name?: string }>;
  is_public: boolean;
  share_token?: string | null;
}

export interface SavedCollectionCard {
  card_id?: number;
  notes?: string;
  created?: string;
  card?: { id: number; name: string; bank_name?: string };
}

export interface SavedCollection {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  slug?: string;
  cards?: SavedCollectionCard[];
}

/** A saved Plan scenario (Phase 3) — mirrors saved/serializers.py. */
export type SavedScenarioTool = 'emi' | 'payoff' | 'rewards' | 'deposit' | 'loan' | 'account';

export interface SavedScenario {
  id: number;
  tool: SavedScenarioTool;
  name: string;
  params: Record<string, string>;
  created: string;
  modified: string;
}

export interface SharedSavedItem {
  type?: 'comparison' | 'collection';
  name: string;
  description?: string;
  notes?: string;
  card_ids?: number[];
  /**
   * Mirrors the public serializers: a shared comparison's `cards` are
   * full CreditCardListSerializer rows; a shared collection's are
   * CollectionItemSerializer rows wrapping the same card payload.
   */
  cards?: Array<CreditCardApiResponse | { card: CreditCardApiResponse; notes?: string }>;
}

// AuthClient.requestApi prefixes its configured API base URL, so keep paths
// relative here (a full URL would be appended to /api/v1 a second time).
const base = 'saved/';
const list = <T>(data: T[] | { results: T[] }): T[] => (Array.isArray(data) ? data : data.results);
const request = <T>(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown
) => authClient.requestApi<T>(`${base}${path}`, { method, body, authenticated: true });

export const savedService = {
  async getComparisons() {
    return list(await request<SavedComparison[] | { results: SavedComparison[] }>('comparisons/'));
  },
  createComparison(input: { name: string; card_ids: number[]; is_public: boolean }) {
    return request<SavedComparison>('comparisons/', 'POST', input);
  },
  updateComparison(id: number, input: Partial<Pick<SavedComparison, 'name' | 'is_public'>>) {
    return request<SavedComparison>(`comparisons/${id}/`, 'PATCH', input);
  },
  deleteComparison(id: number) {
    return request<void>(`comparisons/${id}/`, 'DELETE');
  },
  async getCollections() {
    return list(await request<SavedCollection[] | { results: SavedCollection[] }>('collections/'));
  },
  createCollection(input: { name: string; description: string; is_public: boolean }) {
    return request<SavedCollection>('collections/', 'POST', input);
  },
  getCollection(id: number) {
    return request<SavedCollection>(`collections/${id}/`);
  },
  updateCollection(
    id: number,
    input: Partial<Pick<SavedCollection, 'name' | 'description' | 'is_public'>>
  ) {
    return request<SavedCollection>(`collections/${id}/`, 'PATCH', input);
  },
  deleteCollection(id: number) {
    return request<void>(`collections/${id}/`, 'DELETE');
  },
  addCard(id: number, card_id: number, notes?: string) {
    return request<SavedCollection>(`collections/${id}/cards/`, 'POST', {
      card_id,
      ...(notes ? { notes } : {}),
    });
  },
  removeCard(id: number, card_id: number) {
    return request<void>(`collections/${id}/cards/${card_id}/`, 'DELETE');
  },
  async getScenarios() {
    const rows: SavedScenario[] = [];
    let page = 1;
    for (;;) {
      const data = await request<
        SavedScenario[] | { results: SavedScenario[]; next: string | null }
      >(page === 1 ? 'scenarios/' : `scenarios/?page=${page}`);
      if (Array.isArray(data)) return data;
      rows.push(...data.results);
      if (!data.next) return rows;
      page += 1;
    }
  },
  createScenario(input: { tool: SavedScenarioTool; name: string; params: Record<string, string> }) {
    return request<SavedScenario>('scenarios/', 'POST', input);
  },
  deleteScenario(id: number) {
    return request<void>(`scenarios/${id}/`, 'DELETE');
  },
  shared(token: string) {
    return authClient.requestApi<SharedSavedItem>(`${base}shared/${encodeURIComponent(token)}/`);
  },
  sharedCollection(slug: string) {
    return authClient.requestApi<SharedSavedItem>(
      `${base}shared/collections/${encodeURIComponent(slug)}/`
    );
  },
};

export const savedErrorMessage = (error: unknown, lang: Language = 'en'): string => {
  if (error instanceof ApiError) {
    const detail = Object.values(error.fieldErrors).flat()[0];
    if (detail) return detail;
    if (error.detail) return error.detail;
  }
  const fallback: Record<Language, string> = {
    en: 'Something went wrong. Please try again.',
    bn: 'কিছু একটা সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
  };
  return fallback[lang];
};
