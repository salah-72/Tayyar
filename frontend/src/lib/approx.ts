import { useMemo } from "react";
import { useCatalog } from "./catalog";
import type { CatalogProduct } from "./api/types";

/**
 * "Approximate" products are the ones sold with preset weights (`weightChoices`): the price shown is an estimate
 * and the final price is set after the actual weighing. Products without `weightChoices` are never approximate.
 */
export function isApproxProduct(p: Pick<CatalogProduct, "weightChoices">) {
  return p.weightChoices.length > 0;
}

/** Look up approximate products by id from the catalog (works for quote items, cart lines and order items). */
export function useApprox() {
  const c = useCatalog();
  return useMemo(() => {
    const ids = new Set(c.products.filter(isApproxProduct).map((p) => p.id));
    const isApprox = (productId: string | null | undefined) => !!productId && ids.has(productId);
    const any = (items: { productId: string | null }[]) => items.some((i) => isApprox(i.productId));
    return { isApprox, any };
  }, [c.products]);
}
