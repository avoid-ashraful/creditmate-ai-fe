import { ENV } from '../config/env';

/**
 * Typed client for the `/api/v1/auth/` endpoints.
 *
 * Token storage trade-off:
 * - The access token lives only in memory. It is never written to any storage,
 *   so a script that reads storage cannot take it, and it disappears on reload.
 * - The refresh token is kept in `sessionStorage`. It survives reloads in the
 *   same tab but is cleared when the tab closes, which limits how long a copy
 *   can sit on disk. `localStorage` would keep users signed in across tabs and
 *   restarts, at the cost of a longer-lived token. Any script running on the
 *   page (an XSS bug, for example) can still read `sessionStorage`; only an
 *   httpOnly cookie set by the backend would keep the refresh token away from
 *   page scripts, and that needs backend support.
 */

/** sessionStorage key for the refresh token. */
export const REFRESH_TOKEN_STORAGE_KEY = 'creditmate.auth.refresh';

const HTTP_METHOD = { get: 'GET', post: 'POST', patch: 'PATCH' } as const;
type HttpMethod = (typeof HTTP_METHOD)[keyof typeof HTTP_METHOD];

export interface AuthUser {
  id?: number;
  email: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  passwordConfirm?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ConfirmPasswordResetInput {
  /** Optional: only sent when the reset link carries a uid. */
  uid?: string;
  token: string;
  newPassword: string;
}

export interface AuthSessionResponse {
  user: AuthUser;
  access: string;
  refresh: string;
}

interface TokenRefreshResponse {
  access: string;
  /** Present only when the backend rotates refresh tokens. */
  refresh?: string;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type AuthSessionListener = (active: boolean) => void;

/**
 * An error response from the backend. `fieldErrors` holds DRF's
 * `{field: [messages]}` shape (including `non_field_errors`); `detail` holds
 * DRF's `{detail: "..."}` shape. Either or both may be empty.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly detail: string | null;
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    status: number,
    detail: string | null = null,
    fieldErrors: Record<string, string[]> = {}
  ) {
    super(detail ?? `Request failed with status ${status}`);
    // Keep instanceof working when compiled to ES5.
    Object.setPrototypeOf(this, ApiError.prototype);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
  }
}

const readJsonBody = async (response: Response): Promise<Record<string, unknown> | null> => {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
};

const toApiError = async (response: Response): Promise<ApiError> => {
  const body = await readJsonBody(response);
  if (!body) return new ApiError(response.status);

  const detail = typeof body.detail === 'string' ? body.detail : null;
  const fieldErrors: Record<string, string[]> = {};
  Object.keys(body).forEach(key => {
    if (key === 'detail') return;
    const value = body[key];
    if (typeof value === 'string') {
      fieldErrors[key] = [value];
    } else if (Array.isArray(value)) {
      const messages = value.filter((item): item is string => typeof item === 'string');
      if (messages.length > 0) fieldErrors[key] = messages;
    }
  });
  return new ApiError(response.status, detail, fieldErrors);
};

const getSessionStorage = (): StorageLike | null => {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    // Accessing sessionStorage can throw when storage is disabled.
    return null;
  }
};

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  /** Attach the access token and retry once after a silent refresh on 401. */
  authenticated?: boolean;
}

export class AuthClient {
  private readonly baseUrl: string;
  private readonly storage: StorageLike | null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshInFlight: Promise<string> | null = null;
  private readonly listeners = new Set<AuthSessionListener>();

  constructor(baseUrl: string, storage: StorageLike | null = getSessionStorage()) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.storage = storage;
    this.refreshToken = this.readStoredRefreshToken();
  }

  /** True when a refresh token is held, so a session can be restored or refreshed. */
  hasSession(): boolean {
    return this.refreshToken !== null || this.accessToken !== null;
  }

  /** Listen for the session becoming active (`true`) or ending (`false`). */
  subscribe(listener: AuthSessionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async register(input: RegisterInput): Promise<AuthSessionResponse> {
    const body: Record<string, string> = { email: input.email, password: input.password };
    if (input.passwordConfirm !== undefined) body.password_confirm = input.passwordConfirm;
    const session = await this.request<AuthSessionResponse>('register/', {
      method: HTTP_METHOD.post,
      body,
    });
    this.storeSession(session.access, session.refresh);
    return session;
  }

  async login(input: LoginInput): Promise<AuthSessionResponse> {
    const session = await this.request<AuthSessionResponse>('login/', {
      method: HTTP_METHOD.post,
      body: { email: input.email, password: input.password },
    });
    this.storeSession(session.access, session.refresh);
    return session;
  }

  /**
   * Revoke the refresh token on the server, then clear local state. Local
   * state is cleared even when the server call fails, so a user can always
   * sign out on this device.
   */
  async logout(): Promise<void> {
    const refresh = this.refreshToken;
    try {
      if (refresh) {
        await this.send(
          'logout/',
          { method: HTTP_METHOD.post, body: { refresh } },
          this.accessToken
        );
      }
    } catch {
      // Network failure: the local session is still cleared below.
    } finally {
      this.clearLocalSession();
    }
  }

  /**
   * Restore the session on page load. Resolves with the current user, or null
   * when there is no usable session. A network failure keeps the stored refresh
   * token so a later load can try again.
   */
  async restoreSession(): Promise<AuthUser | null> {
    if (!this.refreshToken) return null;
    try {
      if (!this.accessToken) await this.refreshAccessToken();
      return await this.getMe();
    } catch {
      return null;
    }
  }

  /** Return a usable access token for an authenticated API request. */
  async getAccessToken(): Promise<string | null> {
    if (!this.hasSession()) return null;
    try {
      return this.accessToken ?? (await this.refreshAccessToken());
    } catch {
      return null;
    }
  }

  /**
   * Exchange the refresh token for a new access token. Concurrent callers share
   * one in-flight request, so a burst of 401s causes a single refresh call.
   */
  refreshAccessToken(): Promise<string> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.requestRefresh().finally(() => {
        this.refreshInFlight = null;
      });
    }
    return this.refreshInFlight;
  }

  async getMe(): Promise<AuthUser> {
    return this.request<AuthUser>('me/', { authenticated: true });
  }

  async updateMe(patch: Partial<AuthUser>): Promise<AuthUser> {
    return this.request<AuthUser>('me/', {
      method: HTTP_METHOD.patch,
      body: patch,
      authenticated: true,
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.request<unknown>('password-reset/request/', {
      method: HTTP_METHOD.post,
      body: { email },
    });
  }

  async confirmPasswordReset(input: ConfirmPasswordResetInput): Promise<void> {
    const body: Record<string, string> = { token: input.token, new_password: input.newPassword };
    if (input.uid) body.uid = input.uid;
    await this.request<unknown>('password-reset/confirm/', { method: HTTP_METHOD.post, body });
  }

  async verifyEmail(token: string): Promise<void> {
    await this.request<unknown>('verify-email/', { method: HTTP_METHOD.post, body: { token } });
  }

  /** Forget the session on this device without calling the server. */
  clearLocalSession(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.writeStoredRefreshToken(null);
    this.notify(false);
  }

  private async requestRefresh(): Promise<string> {
    const refresh = this.refreshToken;
    if (!refresh) throw new ApiError(401, 'No refresh token');

    const response = await this.send(
      'token/refresh/',
      { method: HTTP_METHOD.post, body: { refresh } },
      null
    );
    if (!response.ok) {
      // An explicit rejection ends the session. Other failures keep the token.
      if (response.status === 400 || response.status === 401) this.clearLocalSession();
      throw await toApiError(response);
    }

    const data = (await response.json()) as TokenRefreshResponse;
    this.accessToken = data.access;
    if (data.refresh) {
      this.refreshToken = data.refresh;
      this.writeStoredRefreshToken(data.refresh);
    }
    return data.access;
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    if (!options.authenticated) {
      return this.parse<T>(await this.send(path, options, null));
    }

    const token = this.accessToken ?? (await this.refreshAccessToken());
    let response = await this.send(path, options, token);

    if (response.status === 401 && this.refreshToken) {
      // If another request already refreshed past the token we sent, reuse it.
      const retryToken =
        this.accessToken && this.accessToken !== token
          ? this.accessToken
          : await this.refreshAccessToken();
      response = await this.send(path, options, retryToken);
    }
    return this.parse<T>(response);
  }

  private send(path: string, options: RequestOptions, token: string | null): Promise<Response> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    return fetch(`${this.baseUrl}/auth/${path}`, {
      method: options.method ?? HTTP_METHOD.get,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  }

  private async parse<T>(response: Response): Promise<T> {
    if (!response.ok) throw await toApiError(response);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  private storeSession(access: string, refresh: string): void {
    this.accessToken = access;
    this.refreshToken = refresh;
    this.writeStoredRefreshToken(refresh);
    this.notify(true);
  }

  private notify(active: boolean): void {
    this.listeners.forEach(listener => listener(active));
  }

  private readStoredRefreshToken(): string | null {
    try {
      return this.storage?.getItem(REFRESH_TOKEN_STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }

  private writeStoredRefreshToken(value: string | null): void {
    try {
      if (!this.storage) return;
      if (value === null) {
        this.storage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      } else {
        this.storage.setItem(REFRESH_TOKEN_STORAGE_KEY, value);
      }
    } catch {
      // Storage unavailable: the session still works for this page load.
    }
  }
}

/** Shared client for the app. Base URL comes from the same config as the content API. */
export const authClient = new AuthClient(ENV.API_BASE_URL);
