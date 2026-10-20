import { ApiError, responseApiError, resilientFetch } from './apiError';

describe('shared API failure handling', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('normalizes detail, code, field errors and Retry-After', async () => {
    const error = await responseApiError(
      new Response(
        JSON.stringify({ detail: 'Slow down', code: 'rate_limited', email: ['Invalid'] }),
        { status: 429, headers: { 'Retry-After': '3' } }
      )
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 429,
      code: 'rate_limited',
      detail: 'Slow down',
      fieldErrors: { email: ['Invalid'] },
      retryAfter: 3,
    });
  });

  it('retries GET server failures with exponential backoff, at most twice', async () => {
    jest.useFakeTimers({ legacyFakeTimers: true });
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));
    const request = resilientFetch('/test');
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
    jest.advanceTimersByTime(250);
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
    jest.advanceTimersByTime(500);
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
    expect((await request).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry writes', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('', { status: 500 }));
    expect((await resilientFetch('/test', { method: 'POST' })).status).toBe(500);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not retry rate limits and preserves Retry-After for the UI', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('', { status: 429, headers: { 'Retry-After': '4' } }));
    const response = await resilientFetch('/limited');
    const error = await responseApiError(response);
    expect(error).toMatchObject({ status: 429, retryAfter: 4 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns the final 5xx after two GET retries', async () => {
    jest.useFakeTimers({ legacyFakeTimers: true });
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('', { status: 503 }));
    const request = resilientFetch('/unavailable');
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
    jest.advanceTimersByTime(250);
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
    jest.advanceTimersByTime(500);
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
    expect((await request).status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('stops a pending backoff when the caller aborts', async () => {
    jest.useFakeTimers({ legacyFakeTimers: true });
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('', { status: 503 }));
    const controller = new AbortController();
    const request = resilientFetch('/unavailable', { signal: controller.signal });
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
    controller.abort();
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
