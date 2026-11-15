import { unitLabel } from '../../common/utils/units';
import { cardPrice, effectiveDiscount } from '../Pricing/pricingEngine';
import {
  effectiveStore,
  isHidden,
  isOrderable,
  toPricingProduct,
} from '../Pricing/pricingAdapters';
import type { ProductForPricing } from '../Pricing/pricingAdapters';
import { imageVariant } from '../Uploads/uploadsHelpers';

type ProductRow = ProductForPricing & {
  description: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  isFeatured: boolean;
  sortOrder: number;
};

export function toCatalogProduct(row: ProductRow) {
  const p = toPricingProduct(row);
  const price = cardPrice(p);
  const d = effectiveDiscount(p);
  const store = effectiveStore(row);
  return {
    id: p.id,
    name: p.name,
    description: row.description,
    imageUrl: row.imageUrl,
    thumbUrl: imageVariant(row.imageUrl, { width: 400, height: 400 }),
    categoryId: row.categoryId,
    storeId: store?.type === 'RESTAURANT' ? store.id : null,
    serviceFeeBps:
      p.commissionBps && p.commissionBps > 0 ? p.commissionBps : null,
    menuSection: p.menuSection,
    unit: p.unit,
    unitLabel: unitLabel(p.unit),
    saleMode: p.saleMode,
    minQty: p.minQty,
    qtyStep: p.qtyStep,
    weightChoices: p.weightChoices,
    price,
    discount: d ? { kind: d.kind, value: d.value, source: d.source } : null,
    isFeatured: row.isFeatured,
    available: p.available,
    optionGroups: p.optionGroups,
  };
}

export { isHidden, isOrderable };

export function menuSections(
  products: { menuSection: string | null }[],
): string[] {
  const seen: string[] = [];
  for (const p of products)
    if (p.menuSection && !seen.includes(p.menuSection))
      seen.push(p.menuSection);
  return seen;
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  discountKind: string | null;
  discountValue: number | null;
}

export const toCatalogCategory = (c: CategoryRow) => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  imageUrl: c.imageUrl,
  thumbUrl: imageVariant(c.imageUrl, { width: 300, height: 300 }),
  discountKind: c.discountKind,
  discountValue: c.discountValue,
});

interface StoreRow {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  commissionBps: number;
}

export const toCatalogStore = (s: StoreRow, sections: string[]) => ({
  id: s.id,
  name: s.name,
  slug: s.slug,
  imageUrl: s.imageUrl,
  thumbUrl: imageVariant(s.imageUrl, { width: 300, height: 300 }),
  serviceFeeBps: s.commissionBps > 0 ? s.commissionBps : null,
  sections,
});
