/** Normalized error returned by every API client. */
export class ApiError extends TypeError {
  readonly status: number;
  readonly code: string | null;
  readonly detail: string | null;
  readonly fieldErrors: Record<string, string[]>;
  readonly retryAfter: number | null;

  constructor(
    options:
      | {
          status?: number;
          code?: string | null;
          detail?: string | null;
          fieldErrors?: Record<string, string[]>;
          retryAfter?: number | null;
        }
      | number = {},
    legacyDetail: string | null = null,
    legacyFields: Record<string, string[]> = {}
  ) {
    if (typeof options === 'number')
      options = { status: options, detail: legacyDetail, fieldErrors: legacyFields };
    const detail = options.detail ?? null;
    const firstFieldError = Object.values(options.fieldErrors ?? {}).flat()[0];
    super(
      detail ??
        firstFieldError ??
        (options.status ? `Request failed with status ${options.status}` : 'Network error')
    );
    Object.setPrototypeOf(this, ApiError.prototype);
    this.name = 'ApiError';
    this.status = options.status ?? 0;
    this.code = options.code ?? null;
    this.detail = detail;
    this.fieldErrors = options.fieldErrors ?? {};
    this.retryAfter = options.retryAfter ?? null;
  }
}

export async function responseApiError(response: Response): Promise<ApiError> {
  let body: Record<string, unknown> = {};
  try {
    const value: unknown = await response.json();
    if (value && typeof value === 'object' && !Array.isArray(value))
      body = value as Record<string, unknown>;
  } catch {
    /* Empty/non-JSON error response. */
  }
  const fieldErrors: Record<string, string[]> = {};
  Object.entries(body).forEach(([key, value]) => {
    if (key === 'detail' || key === 'code') return;
    if (typeof value === 'string') fieldErrors[key] = [value];
    else if (Array.isArray(value))
      fieldErrors[key] = value.filter((item): item is string => typeof item === 'string');
  });
  const retryHeader = response.headers?.get('Retry-After') ?? null;
  let retryAfter: number | null = null;
  if (retryHeader) {
    const seconds = Number(retryHeader);
    retryAfter = Number.isFinite(seconds)
      ? Math.max(0, seconds)
      : Math.max(0, (Date.parse(retryHeader) - Date.now()) / 1000);
  }
  const error = new ApiError({
    status: response.status,
    code: typeof body.code === 'string' ? body.code : null,
    detail: typeof body.detail === 'string' ? body.detail : null,
    fieldErrors,
    retryAfter,
  });
  if (error.status === 429 || error.status >= 500) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api-http-failure', { detail: error }));
    }
  }
  return error;
}

export function noteNetworkFailure(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('api-network-failure'));
}

/** Fetch with a per-attempt timeout and capped, abortable GET retries for 5xx/network errors. */
export async function resilientFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase();
  const retries = method === 'GET' ? 2 : 0;
  const externalSignal = init.signal;
  for (let attempt = 0; ; attempt += 1) {
    if (externalSignal?.aborted) throw new DOMException('Request aborted', 'AbortError');
    const controller = new AbortController();
    const abort = () => controller.abort();
    externalSignal?.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, 15000);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (response.status < 500 || attempt >= retries) return response;
      // Leave the response body unread; it is discarded with the response.
    } catch (error) {
      if (externalSignal?.aborted) throw error;
      if (attempt >= retries) {
        noteNetworkFailure();
        throw new ApiError({ detail: 'Network error' });
      }
      // A server response is not an offline event. The final 5xx is returned
      // to the client so it can present a retry action without retry storms.
    } finally {
      clearTimeout(timeout);
      externalSignal?.removeEventListener('abort', abort);
    }
    await new Promise<void>((resolve, reject) => {
      const wait = setTimeout(resolve, 250 * 2 ** attempt);
      externalSignal?.addEventListener(
        'abort',
        () => {
          clearTimeout(wait);
          reject(new DOMException('Request aborted', 'AbortError'));
        },
        { once: true }
      );
    });
  }
}
