export type OptionPricing = 'PER_KG' | 'PER_UNIT' | 'FLAT';
export type SaleMode = 'UNIT' | 'WEIGHT' | 'PIECE_WEIGHT';

export const groupRuleError = (
  minSelect: number,
  maxSelect: number,
  activeOptions: number,
  groupActive = true,
): string | null => {
  if (maxSelect < 1 || maxSelect > 20)
    return 'أقصى عدد اختيارات لازم يكون من 1 لـ 20';
  if (minSelect < 0) return 'أقل عدد اختيارات مينفعش يكون سالب';
  if (minSelect > maxSelect) return 'أقل عدد اختيارات أكبر من الأقصى';
  if (groupActive && minSelect > activeOptions)
    return `المجموعة محتاجة ${minSelect} خيار نشط على الأقل (الموجود ${activeOptions})`;
  return null;
};

export const optionFitsSaleMode = (
  pricing: OptionPricing,
  mode: SaleMode,
): boolean => {
  if (pricing === 'FLAT') return true;
  if (pricing === 'PER_KG') return mode === 'WEIGHT' || mode === 'PIECE_WEIGHT';
  return mode === 'UNIT' || mode === 'PIECE_WEIGHT';
};

export const hasDuplicateNames = (names: string[]): boolean => {
  const seen = new Set<string>();
  for (const n of names) {
    const k = n.trim().toLowerCase();
    if (seen.has(k)) return true;
    seen.add(k);
  }
  return false;
};

interface OptionRow {
  id: string;
  groupId: string;
  name: string;
  pricing: OptionPricing;
  priceMinor: number;
  sortOrder: number;
  isActive: boolean;
}

interface GroupRow {
  id: string;
  name: string;
  slug: string;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  isActive: boolean;
  options?: OptionRow[];
  _count?: { products: number };
}

export const toOptionDto = (o: OptionRow) => ({
  id: o.id,
  groupId: o.groupId,
  name: o.name,
  pricing: o.pricing,
  priceMinor: o.priceMinor,
  sortOrder: o.sortOrder,
  isActive: o.isActive,
});

export const toGroupDto = (g: GroupRow) => ({
  id: g.id,
  name: g.name,
  slug: g.slug,
  minSelect: g.minSelect,
  maxSelect: g.maxSelect,
  sortOrder: g.sortOrder,
  isActive: g.isActive,
  productsCount: g._count?.products ?? 0,
  options: (g.options ?? []).map(toOptionDto),
});
