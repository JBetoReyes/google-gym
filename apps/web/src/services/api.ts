/**
 * FastAPI client.
 * All requests include the Supabase JWT in the Authorization header.
 * Auth token is injected lazily via `setTokenGetter`.
 */

let getToken: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: () => Promise<string | null>): void {
  getToken = fn;
}

const BASE = import.meta.env['VITE_API_URL'] ?? '/api';

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken ? await getToken() : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts: RequestInit = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);

  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, detail.detail ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  get:    <T>(path: string)              => request<T>('GET', path),
  post:   <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put:    <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string)              => request<T>('DELETE', path),
};
