interface StoreRow {
  id: string;
  name: string;
  slug: string;
  type: 'SUPPLIER' | 'RESTAURANT';
  imageUrl: string | null;
  commissionBps: number;
  sortOrder: number;
  isActive: boolean;
  archivedAt: Date | null;
  _count?: { products: number };
}

export const toStoreDto = (s: StoreRow) => ({
  id: s.id,
  name: s.name,
  slug: s.slug,
  type: s.type,
  imageUrl: s.imageUrl,
  commissionBps: s.commissionBps,
  sortOrder: s.sortOrder,
  isActive: s.isActive,
  archivedAt: s.archivedAt ? s.archivedAt.toISOString() : null,
  productsCount: s._count?.products ?? 0,
});

export const DEFAULT_RESTAURANT_BPS = 500;

export const commissionAllowed = (
  type: 'SUPPLIER' | 'RESTAURANT',
  bps: number,
): boolean => type === 'RESTAURANT' || bps === 0;
