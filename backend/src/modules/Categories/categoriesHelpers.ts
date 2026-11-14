export type CatDiscountKind = 'PERCENT' | 'FIXED';

export const discountError = (
  kind: string | null | undefined,
  value: number | null | undefined,
): string | null => {
  if (kind == null || kind === 'NONE') return null;
  if (value == null || !Number.isInteger(value) || value <= 0)
    return 'قيمة الخصم لازم تكون أكبر من صفر';
  if (kind === 'PERCENT' && value > 10000)
    return 'نسبة الخصم لازم تكون بين 0.01% و100%';
  return null;
};

export const normalizeDiscount = (
  kind: string | null | undefined,
  value: number | null | undefined,
): { kind: CatDiscountKind | null; value: number | null } =>
  kind == null || kind === 'NONE'
    ? { kind: null, value: null }
    : { kind: kind as CatDiscountKind, value: value ?? null };

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  archivedAt: Date | null;
  discountKind: string | null;
  discountValue: number | null;
  defaultStoreId: string | null;
  defaultStore?: { id: string; name: string } | null;
  _count?: { products: number };
}

export const toCategoryDto = (c: CategoryRow) => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  imageUrl: c.imageUrl,
  sortOrder: c.sortOrder,
  isActive: c.isActive,
  archivedAt: c.archivedAt ? c.archivedAt.toISOString() : null,
  discountKind: c.discountKind,
  discountValue: c.discountValue,
  defaultStoreId: c.defaultStoreId,
  defaultStoreName: c.defaultStore?.name ?? null,
  productsCount: c._count?.products ?? 0,
});
