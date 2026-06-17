export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

/** Error thrown for non-2xx API responses, carrying the HTTP status. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Fetch wrapper that always sends cookies (`credentials: "include"`) so the
 * HTTP-only auth cookies travel with every API call. The browser never reads
 * the tokens — it just forwards them.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, `Request to ${path} failed (${res.status})`);
  }

  // Some endpoints (204) return no body.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
