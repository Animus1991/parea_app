/**
 * Typed HTTP client with timeout + normalized errors (CoFounderBay pattern).
 */
import { appEnv } from './config/env';
import { createLogger } from './logger';

const log = createLogger('api');

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }

  get isRetryable(): boolean {
    return this.status === 0 || this.status === 408 || this.status === 429 || this.status >= 500;
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  json?: unknown;
  body?: BodyInit;
  query?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
}

function resolveUrl(path: string, query?: RequestOptions['query']): string {
  const base = appEnv.apiBaseUrl.replace(/\/$/, '');
  const url = /^https?:\/\//.test(path) ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}${url.includes('?') ? '&' : '?'}${qs}` : url;
}

export async function apiRequest<T = unknown>(
  path: string,
  method: string,
  options: RequestOptions = {},
): Promise<T> {
  const { json, body, query, timeoutMs = 15_000, headers, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(resolveUrl(path, query), {
      ...rest,
      method,
      signal: controller.signal,
      headers: {
        ...(json ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : body,
    });

    const contentType = res.headers.get('content-type') ?? '';
    const parsed = contentType.includes('application/json')
      ? await res.json().catch(() => null)
      : await res.text().catch(() => null);

    if (!res.ok) {
      throw new ApiError(
        typeof parsed === 'object' && parsed && 'error' in parsed
          ? String((parsed as { error: unknown }).error)
          : res.statusText || 'Request failed',
        res.status,
        parsed,
      );
    }

    return parsed as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    log.error('request failed', { path, err });
    throw new ApiError(err instanceof Error ? err.message : 'Network error', 0);
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => apiRequest<T>(path, 'GET', opts),
  post: <T>(path: string, opts?: RequestOptions) => apiRequest<T>(path, 'POST', opts),
  put: <T>(path: string, opts?: RequestOptions) => apiRequest<T>(path, 'PUT', opts),
  delete: <T>(path: string, opts?: RequestOptions) => apiRequest<T>(path, 'DELETE', opts),
};
