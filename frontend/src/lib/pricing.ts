import type { CatalogProduct } from "./api/types";

/** Net price per kg/unit after product/category discount (backend `finalMinor` is per min weight for PIECE_WEIGHT). */
export function netPerBase(p: CatalogProduct) {
  if (p.saleMode === "PIECE_WEIGHT" && p.weightChoices.length) {
    const w = Math.min(...p.weightChoices);
    return p.price.finalMinor / w;
  }
  return p.price.finalMinor;
}

/**
 * Local estimate of a line total (for the add-to-cart sheet). The cart page always shows the
 * backend quote, which is the source of truth.
 */
export function estimateLine(
  p: CatalogProduct,
  quantity: number,
  weightPerUnit: number | undefined,
  optionIds: string[],
) {
  const base = netPerBase(p);
  const unit = p.saleMode === "PIECE_WEIGHT" ? Math.round(base * (weightPerUnit ?? 0)) : base;
  let total = Math.round(unit * quantity);
  const opts = new Map(p.optionGroups.flatMap((g) => g.options.map((o) => [o.id, o] as const)));
  for (const id of optionIds) {
    const o = opts.get(id);
    if (!o) continue;
    if (o.pricing === "FLAT") total += o.priceMinor;
    else if (o.pricing === "PER_KG") {
      total +=
        p.saleMode === "PIECE_WEIGHT"
          ? Math.round(o.priceMinor * quantity * (weightPerUnit ?? 0))
          : Math.round(o.priceMinor * quantity);
    } else total += Math.round(o.priceMinor * quantity);
  }
  return total;
}

/** Next valid quantity step, respecting minQty and qtyStep. */
export function stepQty(p: Pick<CatalogProduct, "minQty" | "qtyStep">, q: number, dir: 1 | -1) {
  const next = Math.round((q + dir * p.qtyStep) * 1000) / 1000;
  if (next < p.minQty) return dir === -1 ? 0 : p.minQty;
  return next;
}

/** Whether a product needs the details sheet (choices) before adding. */
export function needsChoices(p: CatalogProduct) {
  return (
    p.saleMode === "PIECE_WEIGHT" ||
    p.optionGroups.some((g) => g.minSelect > 0) ||
    p.optionGroups.length > 0 ||
    (p.saleMode === "WEIGHT" && p.weightChoices.length > 0)
  );
}
