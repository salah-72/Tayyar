import type {
  DiscountKind,
  OptionPricing,
  PricingDiscount,
  PricingProduct,
  SaleMode,
} from './pricingTypes';

type DecLike = number | string | { toString(): string };

export interface StoreForPricing {
  id: string;
  name: string;
  type: 'SUPPLIER' | 'RESTAURANT';
  isActive: boolean;
  archivedAt: Date | null;
}

export interface ProductForPricing {
  id: string;
  name: string;
  unit: string;
  saleMode: SaleMode;
  priceMinor: number;
  minQty: DecLike;
  qtyStep: DecLike;
  weightChoices: DecLike[];
  discountKind: string | null;
  discountValue: number | null;
  isActive: boolean;
  archivedAt: Date | null;
  menuSection: string | null;
  category: {
    name: string;
    isActive: boolean;
    archivedAt: Date | null;
    discountKind: string | null;
    discountValue: number | null;
    defaultStore: StoreForPricing | null;
  } | null;
  store: StoreForPricing | null;
  optionGroups: {
    id: string;
    name: string;
    minSelect: number;
    maxSelect: number;
    isActive: boolean;
    sortOrder?: number;
    options: {
      id: string;
      name: string;
      pricing: OptionPricing;
      priceMinor: number;
      isActive: boolean;
      sortOrder?: number;
    }[];
  }[];
}

export const isHidden = (p: ProductForPricing): boolean =>
  !!p.archivedAt ||
  (p.category !== null && (!p.category.isActive || !!p.category.archivedAt)) ||
  (p.store !== null &&
    p.store.type === 'RESTAURANT' &&
    (!p.store.isActive || !!p.store.archivedAt));

export const isOrderable = (p: ProductForPricing): boolean =>
  !isHidden(p) && p.isActive;

export const effectiveStore = (p: ProductForPricing): StoreForPricing | null =>
  p.store ?? p.category?.defaultStore ?? null;

const kind = (k: string | null): DiscountKind | null =>
  k === null ? null : (k as DiscountKind);

export function toPricingProduct(p: ProductForPricing): PricingProduct {
  const store = effectiveStore(p);
  const bySort = <T extends { sortOrder?: number; name: string }>(a: T, b: T) =>
    (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
    a.name.localeCompare(b.name, 'ar');

  return {
    id: p.id,
    name: p.name,
    unit: p.unit,
    saleMode: p.saleMode,
    priceMinor: p.priceMinor,
    minQty: Number(p.minQty),
    qtyStep: Number(p.qtyStep),
    weightChoices: p.weightChoices.map(Number),
    discountKind: kind(p.discountKind),
    discountValue: p.discountValue,
    categoryDiscountKind: kind(p.category?.discountKind ?? null),
    categoryDiscountValue: p.category?.discountValue ?? null,
    available: isOrderable(p),
    categoryName: p.category?.name ?? null,
    storeId: store?.id ?? null,
    storeName: store?.name ?? null,
    menuSection: p.menuSection,
    optionGroups: p.optionGroups
      .filter((g) => g.isActive)
      .sort(bySort)
      .map((g) => ({
        id: g.id,
        name: g.name,
        minSelect: g.minSelect,
        maxSelect: g.maxSelect,
        options: g.options
          .filter((o) => o.isActive)
          .sort(bySort)
          .map((o) => ({
            id: o.id,
            name: o.name,
            pricing: o.pricing,
            priceMinor: o.priceMinor,
          })),
      })),
  };
}

export interface DiscountRow {
  id: string;
  name: string;
  code: string | null;
  kind: string;
  value: number;
  minSubtotalMinor: number;
  maxDiscountMinor: number | null;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  maxUses: number | null;
  usedCount: number;
}

export const isDiscountLive = (d: DiscountRow, now: Date): boolean =>
  d.isActive &&
  (d.kind === 'PERCENT' || d.kind === 'FIXED') &&
  d.value > 0 &&
  (d.startsAt === null || d.startsAt <= now) &&
  (d.endsAt === null || d.endsAt > now) &&
  (d.maxUses === null || d.usedCount < d.maxUses);

export const toPricingDiscount = (d: DiscountRow): PricingDiscount => ({
  id: d.id,
  name: d.name,
  kind: d.kind as 'PERCENT' | 'FIXED',
  value: d.value,
  minSubtotalMinor: d.minSubtotalMinor,
  maxDiscountMinor: d.maxDiscountMinor,
});
