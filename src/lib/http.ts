// src/lib/http.ts
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpErrorShape = {
  status: number;
  message: string;
  details?: unknown;
};

export class HttpError extends Error {
  status: number;
  details?: unknown;
  constructor(data: HttpErrorShape) {
    super(data.message);
    this.status = data.status;
    this.details = data.details;
  }
}

export type HttpClientOptions = {
  baseUrl?: string;
  getToken?: () => string | null | undefined;
  timeoutMs?: number;
  /** Set to "include" if your API uses cookies. Default is "omit". */
  credentials?: RequestCredentials;
};

const DEFAULT_TIMEOUT = 15000;

function stripTrailingSlash(u: string) {
  return u.endsWith("/") ? u.slice(0, -1) : u;
}

function joinUrl(base: string, path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export class HttpClient {
  private baseUrl: string;
  private getToken?: () => string | null | undefined;
  private timeoutMs: number;
  private credentials: RequestCredentials;

  constructor(opts: HttpClientOptions = {}) {
    const envBase =
      typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL
        ? String(process.env.NEXT_PUBLIC_API_BASE_URL)
        : undefined;

    const base = opts.baseUrl || envBase || "http://localhost:4000";
    this.baseUrl = stripTrailingSlash(base);
    this.getToken = opts.getToken;
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT;
    this.credentials = opts.credentials ?? "omit";
  }

  /** Build headers. If body is FormData we do not set Content-Type. */
  private buildHeaders(extra?: HeadersInit, body?: unknown): HeadersInit {
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;

    const headers: HeadersInit = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Accept: "application/json",
      ...extra,
    };

    const token = this.getToken?.();
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  private async parseOk<T>(res: Response): Promise<T> {
    if (res.status === 204) {
      return (undefined as unknown) as T;
    }

    const ct = res.headers.get("content-type") || "";
    const isJson = ct.includes("application/json");

    if (!isJson) {
      // Read a small preview and throw a proper HttpError
      const preview = (await res.text()).slice(0, 300);
      throw new HttpError({
        status: res.status,
        message: `Expected JSON but got ${ct || "unknown content-type"}`,
        details: preview,
      });
    }

    const text = await res.text();
    if (!text) return (undefined as unknown) as T;
    return JSON.parse(text) as T;
  }

  private async parseError(res: Response): Promise<never> {
    const ct = res.headers.get("content-type") || "";
    const isJson = ct.includes("application/json");
    let message = `HTTP ${res.status}`;
    let details: unknown;

    try {
      if (isJson) {
        const body = await res.json();
        message = body?.message || body?.error || message;
        details = body;
      } else {
        const text = await res.text();
        message = text || message;
      }
    } catch {
      // ignore parsing failures and fall back to default message
    }

    throw new HttpError({ status: res.status, message, details });
  }

  async request<T>(method: HttpMethod, path: string, body?: unknown, init?: RequestInit): Promise<T> {
    const url = path.startsWith("http") ? path : joinUrl(this.baseUrl, path);
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        headers: this.buildHeaders(init?.headers, body),
        body: body != null ? (isFormData ? (body as BodyInit) : JSON.stringify(body)) : undefined,
        signal: ctrl.signal,
        credentials: init?.credentials ?? this.credentials,
        cache: "no-store",                // add this
        ...init,
      });

      if (!res.ok) {
        return this.parseError(res);
      }
      return this.parseOk<T>(res);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        throw new HttpError({
          status: 408,
          message: "Request timed out",
          details: { url, method, timeoutMs: this.timeoutMs },
        });
      }
      if (err instanceof HttpError) throw err;
      throw new HttpError({
        status: 0,
        message: err?.message || "Network error",
        details: { url, method },
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  get<T>(path: string, init?: RequestInit) {
    return this.request<T>("GET", path, undefined, init);
  }
  post<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>("POST", path, body, init);
  }
  put<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>("PUT", path, body, init);
  }
  patch<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>("PATCH", path, body, init);
  }
  delete<T>(path: string, init?: RequestInit) {
    return this.request<T>("DELETE", path, undefined, init);
  }
}

// Singleton instance used by the app
export const http = new HttpClient({
  getToken: () => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem("token");
    } catch {
      return null;
    }
  },
  // Set to "include" only if your API uses cookie auth.
  credentials: "omit",
});
