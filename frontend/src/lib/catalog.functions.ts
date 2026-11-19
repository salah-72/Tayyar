import { createServerFn } from "@tanstack/react-start";
import type { Catalog } from "./api/types";
import { getUpstream } from "./server-env";

// The catalog is public and identical for everyone, so keep it for a short while instead of
// hitting the backend on every page view. If the backend is down we serve the last copy we have.
// (Prices are always re-checked by the backend when an order is placed.)
const TTL_MS = 30_000;
let cache: { data: Catalog; at: number } | null = null;
let inflight: Promise<Catalog> | null = null;

async function loadCatalog(): Promise<Catalog> {
  const res = await fetch(`${getUpstream()}/catalog`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("تعذّر تحميل المنتجات دلوقتي");
  const json = (await res.json()) as { data: Catalog };
  return json.data;
}

/** Public storefront catalog (no login). Runs server-side so pages render with data. */
export const getCatalog = createServerFn({ method: "GET" }).handler(async (): Promise<Catalog> => {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  inflight ??= loadCatalog().finally(() => {
    inflight = null;
  });
  try {
    const data = await inflight;
    cache = { data, at: Date.now() };
    return data;
  } catch (e) {
    if (cache) return cache.data;
    throw e;
  }
});
