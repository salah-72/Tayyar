// Browser-side client for the Tayyar backend, via the same-origin bridge at /api/public/tayyar.
// Admin auth: short-lived access token in localStorage + httpOnly refresh cookie.

export const API_BASE = "/api/public/tayyar";
const TOKEN_KEY = "tayyar_admin_token";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();
let memToken: string | null = null;

export const tokenStore = {
  get(): string | null {
    if (memToken) return memToken;
    if (typeof window === "undefined") return null;
    memToken = window.localStorage.getItem(TOKEN_KEY);
    return memToken;
  },
  set(token: string | null) {
    memToken = token;
    if (typeof window !== "undefined") {
      if (token) window.localStorage.setItem(TOKEN_KEY, token);
      else window.localStorage.removeItem(TOKEN_KEY);
    }
    listeners.forEach((l) => l());
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** multipart upload (e.g. images). Overrides body. */
  form?: FormData;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** attach the admin bearer token (default true for admin calls) */
  auth?: boolean;
}

let refreshing: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: "{}",
        });
        if (!res.ok) return null;
        const json = (await res.json()) as { accessToken?: string };
        const t = json.accessToken ?? null;
        tokenStore.set(t);
        return t;
      } catch {
        return null;
      } finally {
        setTimeout(() => (refreshing = null), 0);
      }
    })();
  }
  return refreshing;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const qs = new URLSearchParams();
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    }
  }
  const s = qs.toString();
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}${s ? `?${s}` : ""}`;
}

async function send(path: string, opts: RequestOptions, token: string | null) {
  const headers: Record<string, string> = { accept: "application/json" };
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  if (token) headers.authorization = `Bearer ${token}`;
  return fetch(buildUrl(path, opts.query), {
    method: opts.method ?? (body ? "POST" : "GET"),
    headers,
    body,
    credentials: "same-origin",
  });
}

/** Returns the parsed JSON body (the whole envelope). Throws ApiError on failure. */
export async function apiRaw<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const useAuth = opts.auth ?? true;
  let res = await send(path, opts, useAuth ? tokenStore.get() : null);
  if (res.status === 401 && useAuth) {
    const t = await refreshAccessToken();
    if (t) res = await send(path, opts, t);
    else tokenStore.set(null);
  }
  if (res.status === 204) return undefined as T;
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok || json?.success === false) {
    if (res.status === 401 && useAuth) tokenStore.set(null);
    throw new ApiError(
      translateError(json?.message, res.status),
      res.status,
      json?.code,
      json?.details,
    );
  }
  return json as T;
}

/** Returns `data` from the { success, data } envelope. */
export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const json = await apiRaw<{ data: T }>(path, opts);
  return json?.data as T;
}

/** For paginated lists: returns { data, meta }. */
export async function apiPage<T = unknown>(path: string, opts: RequestOptions = {}) {
  const json = await apiRaw<{ data: T; meta?: import("./types").PageMeta }>(path, opts);
  return { data: json.data, meta: json.meta };
}

const EN_TO_AR: Array<[RegExp, string]> = [
  [/Invalid username or password/i, "اسم المستخدم أو كلمة السر غلط"],
  [/no token provided|Invalid or expired token|log in again/i, "انتهت الجلسة، سجّل دخول تاني"],
  [/too many requests/i, "طلبات كتير ورا بعض، استنى دقيقة"],
  [/already exists/i, "فيه عنصر بنفس القيمة موجود قبل كده"],
  [/used by other records/i, "العنصر ده مستخدم في حاجات تانية"],
  [/Record not found/i, "العنصر مش موجود"],
  [/Old password is wrong/i, "كلمة السر القديمة غلط"],
  [/this username is used/i, "اسم المستخدم ده مستخدم"],
  [/Something went wrong/i, "حصلت مشكلة في السيرفر"],
];

function translateError(message: string | undefined, status: number) {
  if (!message) return status >= 500 ? "حصلت مشكلة في السيرفر" : "حصل خطأ، جرّب تاني";
  for (const [re, ar] of EN_TO_AR) if (re.test(message)) return ar;
  return message;
}

export function errorMessage(e: unknown) {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "حصل خطأ، جرّب تاني";
}
