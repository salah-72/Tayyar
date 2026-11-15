import { hasMaxThreeDecimals, toMilli } from '../../common/utils/money';
import { discountError } from '../Categories/categoriesHelpers';
import { optionFitsSaleMode } from '../OptionGroups/optionGroupsHelpers';
import type {
  OptionPricing,
  SaleMode,
} from '../OptionGroups/optionGroupsHelpers';

export type StoreType = 'SUPPLIER' | 'RESTAURANT';
export type ProductDiscountKind = 'PERCENT' | 'FIXED' | 'NONE';

export interface ProductState {
  saleMode: SaleMode;
  unit: string;
  priceMinor: number;
  minQty: number;
  qtyStep: number;
  weightChoices: number[];
  discountKind: ProductDiscountKind | null;
  discountValue: number | null;
  categoryId: string | null;
  storeId: string | null;
  storeType: StoreType | null;
  menuSection: string | null;
}

export interface RuleError {
  code: string;
  message: string;
}

const err = (code: string, message: string): RuleError => ({ code, message });

export function productRuleError(s: ProductState): RuleError | null {
  if (!s.categoryId && !s.storeId)
    return err(
      'OWNER_REQUIRED',
      'لازم تحدد قسم (أو محل لو ده صنف في منيو مطعم)',
    );
  if (s.storeType === 'RESTAURANT') {
    if (s.categoryId)
      return err(
        'RESTAURANT_ITEM_NO_CATEGORY',
        'صنف المطعم مينفعش يتحط في قسم: شيل القسم',
      );
  } else {
    if (!s.categoryId) return err('CATEGORY_REQUIRED', 'لازم تحدد القسم');
    if (s.menuSection)
      return err('MENU_SECTION_NOT_ALLOWED', 'قسم المنيو لأصناف المطاعم بس');
  }

  if (s.saleMode === 'WEIGHT' && s.unit !== 'KG' && s.unit !== 'LITER')
    return err(
      'UNIT_MISMATCH',
      'المنتج اللي بيتباع بالوزن وحدته كيلو (أو لتر)',
    );
  if (s.saleMode === 'PIECE_WEIGHT' && s.unit !== 'PIECE')
    return err('UNIT_MISMATCH', 'منتج الوزن بالقطعة (زي الفرخة) وحدته قطعة');
  if (s.saleMode === 'UNIT' && s.unit === 'KG')
    return err(
      'UNIT_MISMATCH',
      'الكيلو للمنتجات اللي بتتباع بالوزن: غيّر نوع البيع',
    );

  if (!Number.isInteger(s.priceMinor) || s.priceMinor < 0)
    return err('INVALID_PRICE', 'السعر لازم يكون رقم صحيح بالقروش');

  if (!(s.minQty > 0) || !(s.qtyStep > 0))
    return err('INVALID_QTY', 'أقل كمية والزيادة لازم يكونوا أكبر من صفر');
  if (!hasMaxThreeDecimals(s.minQty) || !hasMaxThreeDecimals(s.qtyStep))
    return err('INVALID_QTY', 'الكميات بحد أقصى 3 خانات عشرية');
  const min = toMilli(s.minQty);
  const step = toMilli(s.qtyStep);
  if (min < step || min % step !== 0)
    return err(
      'MIN_STEP_MISMATCH',
      'أقل كمية لازم تكون من مضاعفات الزيادة (مثلًا أقل كمية 0.5 وزيادة 0.25)',
    );
  if (s.saleMode !== 'WEIGHT' && (min % 1000 !== 0 || step % 1000 !== 0))
    return err('INVALID_QTY', 'المنتج اللي بيتباع بالعدد كمياته أعداد صحيحة');

  if (s.saleMode === 'PIECE_WEIGHT') {
    if (!s.weightChoices.length)
      return err(
        'WEIGHTS_REQUIRED',
        'لازم تحدد الأوزان المتاحة (مثلًا 1.5 و2 و2.5)',
      );
    if (s.weightChoices.some((w) => !(w > 0) || !hasMaxThreeDecimals(w)))
      return err(
        'INVALID_WEIGHTS',
        'الأوزان لازم تكون أرقام موجبة بحد أقصى 3 خانات عشرية',
      );
    if (new Set(s.weightChoices.map(toMilli)).size !== s.weightChoices.length)
      return err('WEIGHTS_DUPLICATE', 'الأوزان فيها تكرار');
  } else if (s.weightChoices.length) {
    return err('WEIGHTS_NOT_ALLOWED', 'الأوزان لمنتجات الوزن بالقطعة بس');
  }

  const d = discountError(s.discountKind, s.discountValue);
  if (d) return err('INVALID_DISCOUNT', d);
  if ((s.discountKind == null || s.discountKind === 'NONE') && s.discountValue)
    return err(
      'DISCOUNT_KIND_REQUIRED',
      'حدد نوع الخصم (PERCENT أو FIXED) مع القيمة',
    );

  return null;
}

export const normalizeProductDiscount = (
  kind: ProductDiscountKind | null | undefined,
  value: number | null | undefined,
): { kind: ProductDiscountKind | null; value: number | null } =>
  kind == null || kind === 'NONE'
    ? { kind: kind ?? null, value: null }
    : { kind, value: value ?? null };

interface GroupForFit {
  name: string;
  isActive: boolean;
  options: { name: string; pricing: OptionPricing; isActive: boolean }[];
}

export function optionGroupsFitError(
  mode: SaleMode,
  groups: GroupForFit[],
): RuleError | null {
  for (const g of groups) {
    if (!g.isActive)
      return err('OPTION_GROUP_INACTIVE', `مجموعة «${g.name}» معطّلة`);
    const bad = g.options.find(
      (o) => o.isActive && !optionFitsSaleMode(o.pricing, mode),
    );
    if (bad)
      return err(
        'OPTION_NOT_APPLICABLE',
        `خيار «${bad.name}» في «${g.name}» مينفعش مع المنتج ده (طريقة حسابه ${bad.pricing === 'PER_KG' ? 'بالكيلو' : 'بالعدد'})`,
      );
  }
  return null;
}

type DecLike = number | string | { toString(): string };
const n = (d: DecLike): number => Number(d);

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  category?: { id: string; name: string } | null;
  storeId: string | null;
  store?: { id: string; name: string; type: StoreType } | null;
  menuSection: string | null;
  unit: string;
  saleMode: SaleMode;
  priceMinor: number;
  minQty: DecLike;
  qtyStep: DecLike;
  weightChoices: DecLike[];
  discountKind: string | null;
  discountValue: number | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  archivedAt: Date | null;
  createdAt: Date;
  optionGroups?: { id: string; name: string }[];
}

export const toProductDto = (p: ProductRow) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  imageUrl: p.imageUrl,
  categoryId: p.categoryId,
  categoryName: p.category?.name ?? null,
  storeId: p.storeId,
  storeName: p.store?.name ?? null,
  storeType: p.store?.type ?? null,
  menuSection: p.menuSection,
  unit: p.unit,
  saleMode: p.saleMode,
  priceMinor: p.priceMinor,
  minQty: n(p.minQty),
  qtyStep: n(p.qtyStep),
  weightChoices: p.weightChoices.map(n),
  discountKind: p.discountKind,
  discountValue: p.discountValue,
  isFeatured: p.isFeatured,
  isActive: p.isActive,
  sortOrder: p.sortOrder,
  archivedAt: p.archivedAt ? p.archivedAt.toISOString() : null,
  createdAt: p.createdAt.toISOString(),
  optionGroups: (p.optionGroups ?? []).map((g) => ({ id: g.id, name: g.name })),
});
