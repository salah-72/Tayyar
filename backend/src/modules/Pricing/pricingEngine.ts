import {
  bpsOf,
  formatMinor,
  hasMaxThreeDecimals,
  mulDivRound,
  toMilli,
} from '../../common/utils/money';
import { unitLabel } from '../../common/utils/units';
import { PricingError } from './pricingTypes';
import type {
  CartLine,
  PricedItem,
  PricedOption,
  PricingDiscount,
  PricingInput,
  PricingProduct,
  PricingResult,
  ProductLine,
} from './pricingTypes';

export interface EffectiveDiscount {
  kind: 'PERCENT' | 'FIXED';
  value: number;
  source: 'product' | 'category';
}

export const effectiveDiscount = (
  p: PricingProduct,
): EffectiveDiscount | null => {
  if (p.discountKind !== null) {
    if (p.discountKind === 'NONE' || !p.discountValue || p.discountValue <= 0)
      return null;
    return { kind: p.discountKind, value: p.discountValue, source: 'product' };
  }
  const k = p.categoryDiscountKind;
  if (
    !k ||
    k === 'NONE' ||
    !p.categoryDiscountValue ||
    p.categoryDiscountValue <= 0
  )
    return null;
  return { kind: k, value: p.categoryDiscountValue, source: 'category' };
};

const discountOn = (
  priceMinor: number,
  d: EffectiveDiscount | null,
): number => {
  if (!d) return 0;
  const raw = d.kind === 'PERCENT' ? bpsOf(priceMinor, d.value) : d.value;
  return Math.min(priceMinor, raw);
};

export const cardPrice = (p: PricingProduct) => {
  const disc = discountOn(p.priceMinor, effectiveDiscount(p));
  const netKg = p.priceMinor - disc;
  if (p.saleMode === 'PIECE_WEIGHT' && p.weightChoices.length) {
    const w = toMilli(Math.min(...p.weightChoices));
    return {
      listMinor: mulDivRound([p.priceMinor, w], 1000),
      finalMinor: mulDivRound([netKg, w], 1000),
      hasDiscount: disc > 0,
      startsFrom: p.weightChoices.length > 1,
    };
  }
  return {
    listMinor: p.priceMinor,
    finalMinor: netKg,
    hasDiscount: disc > 0,
    startsFrom: false,
  };
};

function priceProductLine(line: ProductLine, p: PricingProduct): PricedItem {
  const fail = (code: string, msg: string): never => {
    throw new PricingError(code, msg, p.id);
  };
  if (!p.available) fail('PRODUCT_UNAVAILABLE', `«${p.name}» مش متاح دلوقتي`);

  const q = line.quantity;
  if (!Number.isFinite(q) || q <= 0)
    fail('BAD_QUANTITY', `كمية «${p.name}» غلط`);
  if (!hasMaxThreeDecimals(q))
    fail('BAD_QUANTITY', `كمية «${p.name}» فيها كسور كتير`);
  const qMilli = toMilli(q);
  const minMilli = toMilli(p.minQty);
  const stepMilli = toMilli(p.qtyStep);
  const u = unitLabel(p.unit);
  if (qMilli < minMilli)
    fail('BELOW_MIN_QTY', `أقل كمية من «${p.name}» ${p.minQty} ${u}`.trim());
  if (qMilli % stepMilli !== 0)
    fail(
      'BAD_STEP',
      `كمية «${p.name}» لازم تكون من مضاعفات ${p.qtyStep} ${u}`.trim(),
    );
  if (p.saleMode === 'PIECE_WEIGHT' && qMilli % 1000 !== 0)
    fail('BAD_QUANTITY', `عدد «${p.name}» لازم يكون رقم صحيح`);

  let wMilli: number | null = null;
  if (p.saleMode === 'PIECE_WEIGHT') {
    const w = line.weightPerUnit;
    if (w == null || !p.weightChoices.some((c) => toMilli(c) === toMilli(w)))
      fail('BAD_WEIGHT', `اختار وزن صحيح لـ «${p.name}»`);
    wMilli = toMilli(w!);
  } else if (line.weightPerUnit != null) {
    fail('WEIGHT_NOT_ALLOWED', `«${p.name}» مفيهوش اختيار وزن`);
  }

  const disc = effectiveDiscount(p);
  const discPerKgOrUnit = discountOn(p.priceMinor, disc);
  const netPrice = p.priceMinor - discPerKgOrUnit;
  const unitList =
    wMilli != null ? mulDivRound([p.priceMinor, wMilli], 1000) : p.priceMinor;
  const unitNet =
    wMilli != null ? mulDivRound([netPrice, wMilli], 1000) : netPrice;
  const lineNet = mulDivRound([unitNet, qMilli], 1000);
  const lineDiscount = mulDivRound([unitList - unitNet, qMilli], 1000);

  const ids = line.optionIds ?? [];
  if (new Set(ids).size !== ids.length)
    fail('BAD_OPTIONS', `فيه خيار متكرر في «${p.name}»`);
  const byId = new Map<
    string,
    {
      group: string;
      opt: PricingProduct['optionGroups'][number]['options'][number];
    }
  >();
  for (const g of p.optionGroups)
    for (const o of g.options) byId.set(o.id, { group: g.id, opt: o });
  const perGroup = new Map<string, number>();
  const options: PricedOption[] = [];
  let optionsTotal = 0;
  for (const id of ids) {
    const hit = byId.get(id);
    if (!hit)
      return fail('OPTION_NOT_FOUND', `خيار تجهيز مش متاح لـ «${p.name}»`);
    perGroup.set(hit.group, (perGroup.get(hit.group) ?? 0) + 1);
    const g = p.optionGroups.find((x) => x.id === hit.group)!;
    const o = hit.opt;
    let amount: number;
    if (o.pricing === 'FLAT') amount = o.priceMinor;
    else if (o.pricing === 'PER_KG') {
      if (p.saleMode === 'WEIGHT')
        amount = mulDivRound([o.priceMinor, qMilli], 1000);
      else if (p.saleMode === 'PIECE_WEIGHT')
        amount = mulDivRound([o.priceMinor, qMilli, wMilli!], 1_000_000);
      else
        return fail(
          'OPTION_NOT_APPLICABLE',
          `«${o.name}» بالكيلو ومينفعش مع «${p.name}»`,
        );
    } else {
      if (p.saleMode === 'WEIGHT')
        return fail(
          'OPTION_NOT_APPLICABLE',
          `«${o.name}» بالعدد ومينفعش مع «${p.name}»`,
        );
      amount = mulDivRound([o.priceMinor, qMilli], 1000);
    }
    optionsTotal += amount;
    options.push({
      groupName: g.name,
      optionName: o.name,
      pricing: o.pricing,
      priceMinor: o.priceMinor,
      amountMinor: amount,
    });
  }
  for (const g of p.optionGroups) {
    const n = perGroup.get(g.id) ?? 0;
    if (n < g.minSelect)
      fail('OPTION_REQUIRED', `اختار «${g.name}» لـ «${p.name}»`);
    if (n > g.maxSelect)
      fail(
        'TOO_MANY_OPTIONS',
        `«${g.name}» في «${p.name}»: أقصى عدد اختيارات ${g.maxSelect}`,
      );
  }

  return {
    productId: p.id,
    isCustom: false,
    name: p.name,
    unit: p.unit,
    saleMode: p.saleMode,
    quantity: q,
    weightPerUnit: wMilli != null ? wMilli / 1000 : null,
    listUnitPriceMinor: unitList,
    unitPriceMinor: unitNet,
    options,
    lineTotalMinor: lineNet + optionsTotal,
    lineDiscountMinor: lineDiscount,
    note: null,
    categoryName: p.categoryName,
    storeId: p.storeId,
    storeName: p.storeName,
    menuSection: p.menuSection,
    serviceFeeMinor: 0,
  };
}

export function pickBestDiscount(
  subtotalMinor: number,
  candidates: PricingDiscount[],
) {
  let best: { discount: PricingDiscount; amount: number } | null = null;
  for (const d of candidates) {
    if (d.value <= 0 || subtotalMinor < d.minSubtotalMinor) continue;
    let amount = d.kind === 'PERCENT' ? bpsOf(subtotalMinor, d.value) : d.value;
    if (d.maxDiscountMinor != null)
      amount = Math.min(amount, d.maxDiscountMinor);
    amount = Math.min(amount, subtotalMinor);
    if (amount > 0 && (!best || amount > best.amount))
      best = { discount: d, amount };
  }
  return best;
}

export function priceCart(input: PricingInput): PricingResult {
  const { lines, products, settings } = input;
  if (!lines.length) throw new PricingError('EMPTY_CART', 'السلة فاضية');

  const items: PricedItem[] = lines.map((line: CartLine) => {
    if (line.type === 'custom') {
      return {
        productId: null,
        isCustom: true,
        name: line.text,
        unit: null,
        saleMode: 'UNIT' as const,
        quantity: 1,
        weightPerUnit: null,
        listUnitPriceMinor: null,
        unitPriceMinor: null,
        options: [],
        lineTotalMinor: null,
        lineDiscountMinor: 0,
        note: line.note ?? null,
        categoryName: null,
        storeId: null,
        storeName: null,
        menuSection: null,
        serviceFeeMinor: 0,
      };
    }
    const p = products.get(line.productId);
    if (!p)
      throw new PricingError(
        'PRODUCT_NOT_FOUND',
        'فيه صنف في السلة مش موجود',
        line.productId,
      );
    return priceProductLine(line, p);
  });

  // رسوم الخدمة: مبلغ ثابت على كل محل/مصدر مختلف في الأوردر (مش نسبة).
  // بنحطها على أول صنف من كل محل، فالمحاسبة بتجمعها مع المحل ده من غير أي تغيير.
  // الأصناف المكتوبة بإيد العميل (من غير محل) مالهاش رسوم.
  let serviceFeeStores = 0;
  const perStore = settings.serviceFeePerStoreMinor;
  if (perStore > 0) {
    const charged = new Set<string>();
    for (const it of items) {
      if (it.isCustom || !it.storeId || charged.has(it.storeId)) continue;
      charged.add(it.storeId);
      it.serviceFeeMinor = perStore;
      serviceFeeStores++;
    }
  }

  let subtotal = 0;
  let productDiscount = 0;
  let serviceFee = 0;
  for (const it of items) {
    if (it.lineTotalMinor == null) continue;
    subtotal += it.lineTotalMinor;
    productDiscount += it.lineDiscountMinor;
    serviceFee += it.serviceFeeMinor;
  }

  const best = pickBestDiscount(subtotal, input.discounts);
  const invoiceDiscount = best?.amount ?? 0;
  const afterDiscount = subtotal - invoiceDiscount;

  const t = settings.freeDeliveryThresholdMinor;
  const freeDelivery = t > 0 && subtotal > 0 && afterDiscount >= t;
  const deliveryFee = freeDelivery ? 0 : input.areaFeeMinor;

  return {
    items,
    grossMinor: subtotal + productDiscount,
    productDiscountMinor: productDiscount,
    subtotalMinor: subtotal,
    invoiceDiscountMinor: invoiceDiscount,
    serviceFeeMinor: serviceFee,
    serviceFeeStores,
    discountId: best?.discount.id ?? null,
    discountLabel: best?.discount.name ?? null,
    freeDeliveryApplied: freeDelivery,
    deliveryFeeMinor: deliveryFee,
    totalMinor: afterDiscount + serviceFee + deliveryFee,
    isEstimated: items.some((i) => i.saleMode !== 'UNIT'),
    needsPricing: items.some((i) => i.isCustom),
  };
}

export { formatMinor };
