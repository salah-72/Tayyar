import { createServerFn } from "@tanstack/react-start";
import type { Catalog } from "./api/types";

const UPSTREAM = "https://tayyar-production-85650ef5.up.railway.app";

/** Public storefront catalog (no login). Runs server-side so pages render with data. */
export const getCatalog = createServerFn({ method: "GET" }).handler(async (): Promise<Catalog> => {
  const res = await fetch(`${UPSTREAM}/catalog`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error("تعذّر تحميل المنتجات دلوقتي");
  const json = (await res.json()) as { data: Catalog };
  return json.data;
});
