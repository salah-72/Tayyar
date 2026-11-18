import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getCatalog } from "./catalog.functions";
import type { Catalog, CatalogProduct } from "./api/types";

export const catalogQuery = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => getCatalog(),
  staleTime: 60_000,
});

export function useCatalog() {
  return useSuspenseQuery(catalogQuery).data;
}

export function productsById(c: Catalog) {
  return new Map(c.products.map((p) => [p.id, p] as const));
}

export function isRestaurantItem(p: CatalogProduct) {
  return p.storeId != null;
}

export function normalizeArabic(s: string) {
  return s
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();
}
