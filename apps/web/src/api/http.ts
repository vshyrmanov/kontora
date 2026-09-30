import type { ApiErrorBody } from '@kontora/contracts';

const BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const TOKEN_KEY = 'kontora-token';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Повідомлення валідації zod для конкретного поля (flatten().fieldErrors). */
  fieldError(field: string): string | undefined {
    const details = this.details as { fieldErrors?: Record<string, string[]> } | undefined;
    return details?.fieldErrors?.[field]?.[0];
  }
}

/* ---------- Токен ---------- */
const unauthorizedListeners = new Set<() => void>();

export const session = {
  get token(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
  onUnauthorized(listener: () => void) {
    unauthorizedListeners.add(listener);
    return () => unauthorizedListeners.delete(listener);
  },
};

/* ---------- Запит ---------- */
type QueryValue = string | number | boolean | undefined | null;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
}

const buildUrl = (path: string, query?: Record<string, QueryValue>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return `${BASE_URL}${path}${qs ? `?${qs}` : ''}`;
};

export async function http<T>(path: string, { method = 'GET', body, query, signal }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = session.token;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiError(0, 'NETWORK_ERROR', 'Немає зʼєднання з сервером. Перевірте мережу й спробуйте ще раз');
  }

  if (response.status === 401 && token) {
    session.clear();
    unauthorizedListeners.forEach((l) => l());
  }
  if (response.status === 204) return undefined as T;

  const data = (await response.json().catch(() => null)) as T | ApiErrorBody | null;
  if (!response.ok) {
    const err = (data as ApiErrorBody | null)?.error;
    throw new ApiError(response.status, err?.code ?? 'HTTP_ERROR', err?.message ?? `Помилка сервера (${response.status})`, err?.details);
  }
  return data as T;
}
