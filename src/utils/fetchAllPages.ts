import type { ApiResponse } from '../services/api';

/**
 * Collect every page of a paginated list endpoint.
 *
 * The API caps `page_size` at 100, so a single request silently drops the rest of a
 * larger catalogue. Page 1 is requested first; further pages follow `next`.
 *
 * @param fetchPage Loads one page (1-based).
 * @param maxPages Safety cap against a runaway `next` chain.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<ApiResponse<T>>,
  maxPages = 10
): Promise<ApiResponse<T>> {
  const first = await fetchPage(1);
  const results = [...first.results];
  let next = first.next;
  for (let page = 2; next && page <= maxPages; page += 1) {
    const response = await fetchPage(page);
    results.push(...response.results);
    next = response.next;
  }
  return { ...first, results, next: null };
}
