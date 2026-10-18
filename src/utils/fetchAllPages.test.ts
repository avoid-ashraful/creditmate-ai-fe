import { fetchAllPages } from './fetchAllPages';

const page = (results: number[], next: string | null) => ({
  count: 5,
  next,
  previous: null,
  results,
});

describe('fetchAllPages', () => {
  it('returns a single page untouched', async () => {
    const fetchPage = jest.fn().mockResolvedValue(page([1, 2], null));
    const all = await fetchAllPages(fetchPage);
    expect(all.results).toEqual([1, 2]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith(1);
  });

  it('follows next until exhausted', async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce(page([1, 2], 'p2'))
      .mockResolvedValueOnce(page([3, 4], 'p3'))
      .mockResolvedValueOnce(page([5], null));
    const all = await fetchAllPages(fetchPage);
    expect(all.results).toEqual([1, 2, 3, 4, 5]);
    expect(all.next).toBeNull();
    expect(fetchPage.mock.calls.map(c => c[0])).toEqual([1, 2, 3]);
  });

  it('stops at maxPages', async () => {
    const fetchPage = jest.fn().mockResolvedValue(page([1], 'more'));
    const all = await fetchAllPages(fetchPage, 3);
    expect(all.results).toEqual([1, 1, 1]);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });
});
