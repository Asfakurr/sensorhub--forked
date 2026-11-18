import 'server-only';

/** Base URL of the NestJS API from the Next.js server's point of view. */
export const API_URL = process.env.API_URL ?? `http://localhost:${process.env.API_PORT ?? 4000}`;

/**
 * Server-side GET against the API. Use only in Server Components / route handlers.
 * Client Components call `/api/...` directly; Next.js rewrites proxy it.
 */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`GET ${path} failed: HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** Like apiGet, but returns null on 404 so pages can call notFound(). */
export async function apiGetOrNull<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_URL}/api${path}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${path} failed: HTTP ${res.status}`);
  return (await res.json()) as T;
}
