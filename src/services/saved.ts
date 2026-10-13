import { ENV } from '../config/env';

import { authClient, ApiError } from './auth';

export interface SavedComparison {
  id: number;
  name: string;
  card_ids: number[];
  is_public: boolean;
  share_token?: string | null;
}

export interface SavedCollectionCard {
  card_id: number;
  notes?: string;
  card?: { id: number; name: string; bank_name?: string };
}

export interface SavedCollection {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  share_token?: string | null;
  cards?: SavedCollectionCard[];
}

export interface SharedSavedItem {
  type?: 'comparison' | 'collection';
  name: string;
  description?: string;
  card_ids?: number[];
  cards?: SavedCollectionCard[];
}

const base = `${ENV.API_BASE_URL.replace(/\/$/, '')}/saved/`;
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
    return request<SavedCollection>(`collections/${id}/add_card/`, 'POST', {
      card_id,
      ...(notes ? { notes } : {}),
    });
  },
  removeCard(id: number, card_id: number) {
    return request<SavedCollection>(`collections/${id}/remove_card/`, 'POST', { card_id });
  },
  shared(token: string) {
    return authClient.requestApi<SharedSavedItem>(`${base}shared/${encodeURIComponent(token)}/`);
  },
};

export const savedErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    const detail = Object.values(error.fieldErrors).flat()[0];
    if (detail) return detail;
    if (error.detail) return error.detail;
  }
  return 'Something went wrong. Please try again.';
};
