import { formatMinor, mulDivRound, toMilli } from '../../common/utils/money';
import { unitLabel } from '../../common/utils/units';
import type {
  PricedItem,
  PricedOption,
  PricingResult,
} from '../Pricing/pricingTypes';

type DecLike = number | string | { toString(): string };

export const isEgyptianMobile = (p: string): boolean =>
  /^01[0125]\d{8}$/.test(p);

export interface OrderItemRow {
  id: string;
  productId: string | null;
  isCustom: boolean;
  name: string;
  unit: string | null;
  saleMode: string;
  quantity: DecLike;
  weightPerUnit: DecLike | null;
  listUnitPriceMinor: number | null;
  unitPriceMinor: number | null;
  options: unknown;
  lineTotalMinor: number | null;
  note: string | null;
  commissionBps: number | null;
  serviceFeeMinor: number;
}

export interface OrderRow {
  id: string;
  number: number;
  status: string;
  createdAt: Date;
  customerName: string;
  customerPhone: string;
  areaName: string;
  addressDetails: string;
  notes: string | null;
  subtotalMinor: number;
  invoiceDiscountMinor: number;
  serviceFeeMinor: number;
  discountLabel: string | null;
  deliveryFeeMinor: number;
  freeDeliveryApplied: boolean;
  totalMinor: number;
  isEstimated: boolean;
  needsPricing: boolean;
  items: OrderItemRow[];
}

const parseOptions = (raw: unknown): PricedOption[] =>
  Array.isArray(raw)
    ? raw.filter(
        (o): o is PricedOption =>
          !!o &&
          typeof o === 'object' &&
          typeof (o as PricedOption).optionName === 'string',
      )
    : [];

export const lineSavingsMinor = (i: {
  listUnitPriceMinor: number | null;
  unitPriceMinor: number | null;
  quantity: DecLike;
}): number =>
  i.listUnitPriceMinor == null || i.unitPriceMinor == null
    ? 0
    : mulDivRound(
        [
          Math.max(0, i.listUnitPriceMinor - i.unitPriceMinor),
          toMilli(Number(i.quantity)),
        ],
        1000,
      );

export const toCustomerOrderDto = (o: OrderRow) => {
  const items = o.items.map((i) => ({
    id: i.id,
    productId: i.productId,
    isCustom: i.isCustom,
    name: i.name,
    unit: i.unit,
    unitLabel: unitLabel(i.unit),
    saleMode: i.saleMode,
    quantity: Number(i.quantity),
    weightPerUnit: i.weightPerUnit == null ? null : Number(i.weightPerUnit),
    listUnitPriceMinor: i.listUnitPriceMinor,
    unitPriceMinor: i.unitPriceMinor,
    options: parseOptions(i.options),
    lineTotalMinor: i.lineTotalMinor,
    serviceFeeMinor: i.serviceFeeMinor,
    serviceFeeBps: i.serviceFeeMinor > 0 ? i.commissionBps : null,
    note: i.note,
  }));
  const productDiscountMinor = o.items.reduce(
    (s, i) => s + lineSavingsMinor(i),
    0,
  );
  return {
    id: o.id,
    number: o.number,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    customer: { name: o.customerName, phone: o.customerPhone },
    area: o.areaName,
    addressDetails: o.addressDetails,
    notes: o.notes,
    items,
    pricing: {
      grossMinor: o.subtotalMinor + productDiscountMinor,
      productDiscountMinor,
      subtotalMinor: o.subtotalMinor,
      invoiceDiscountMinor: o.invoiceDiscountMinor,
      discountLabel: o.discountLabel,
      serviceFeeMinor: o.serviceFeeMinor,
      serviceFeeLabel: serviceFeeLabel(items),
      deliveryFeeMinor: o.deliveryFeeMinor,
      freeDeliveryApplied: o.freeDeliveryApplied,
      totalMinor: o.totalMinor,
    },
    isEstimated: o.isEstimated,
    needsPricing: o.needsPricing,
  };
};

export type CustomerOrderDto = ReturnType<typeof toCustomerOrderDto>;

const toPricedItemDto = (i: PricedItem) => ({
  productId: i.productId,
  isCustom: i.isCustom,
  name: i.name,
  unit: i.unit,
  unitLabel: unitLabel(i.unit),
  saleMode: i.saleMode,
  quantity: i.quantity,
  weightPerUnit: i.weightPerUnit,
  listUnitPriceMinor: i.listUnitPriceMinor,
  unitPriceMinor: i.unitPriceMinor,
  options: i.options,
  lineTotalMinor: i.lineTotalMinor,
  lineDiscountMinor: i.lineDiscountMinor,
  serviceFeeMinor: i.serviceFeeMinor,
  note: i.note,
});

export const toQuoteDto = (r: PricingResult, areaSelected: boolean) => ({
  items: r.items.map(toPricedItemDto),
  pricing: {
    grossMinor: r.grossMinor,
    productDiscountMinor: r.productDiscountMinor,
    subtotalMinor: r.subtotalMinor,
    invoiceDiscountMinor: r.invoiceDiscountMinor,
    discountLabel: r.discountLabel,
    serviceFeeMinor: r.serviceFeeMinor,
    serviceFeeLabel: serviceFeeLabel(
      r.items.map((i) => ({
        serviceFeeMinor: i.serviceFeeMinor,
        serviceFeeBps: null,
      })),
    ),
    freeDeliveryApplied: r.freeDeliveryApplied,
    deliveryFeeMinor: areaSelected ? r.deliveryFeeMinor : null,
    totalMinor: r.totalMinor,
  },
  isEstimated: r.isEstimated,
  needsPricing: r.needsPricing,
});

const FRACTIONS: Record<number, { alone: string; after: string }> = {
  250: { alone: 'ربع', after: 'وربع' },
  500: { alone: 'نص', after: 'ونص' },
  750: { alone: 'تلات أرباع', after: 'وتلات أرباع' },
};

const spokenQty = (q: number, label: string): string => {
  const milli = toMilli(q);
  const whole = Math.floor(milli / 1000);
  const frac = milli % 1000;
  const f = FRACTIONS[frac];
  if (frac === 0) return `${whole} ${label}`;
  if (!f) return `${q} ${label}`;
  if (whole === 0) return `${f.alone} ${label}`;
  if (whole === 1) return `${label} ${f.after}`;
  return `${whole} ${label} ${f.after}`;
};

export const formatQuantity = (
  quantity: number,
  unit: string | null,
  saleMode: string,
): string => {
  const label = unitLabel(unit);
  if (saleMode === 'WEIGHT') return spokenQty(quantity, label || 'كيلو');
  return `${quantity} ${label}`.trim();
};

export const formatPercent = (bps: number): string => String(bps / 100);

export const serviceFeeLabel = (
  items: { serviceFeeMinor: number; serviceFeeBps: number | null }[],
): string => {
  const charged = items.filter((i) => i.serviceFeeMinor > 0);
  if (!charged.length) return 'رسوم الخدمة';

  if (charged.every((i) => i.serviceFeeBps)) {
    const rates = new Set(charged.map((i) => i.serviceFeeBps as number));
    return rates.size === 1
      ? `خدمة المطاعم (${formatPercent([...rates][0])}%)`
      : 'خدمة المطاعم';
  }

  const amounts = new Set(charged.map((i) => i.serviceFeeMinor));
  return charged.length > 1 && amounts.size === 1
    ? `رسوم الخدمة (${charged.length} × ${formatMinor([...amounts][0])} ج)`
    : 'رسوم الخدمة';
};

export interface WhatsappInput {
  storeName: string;
  order: CustomerOrderDto;
}

export function buildWhatsappMessage({
  storeName,
  order: o,
}: WhatsappInput): string {
  const L: string[] = [];
  L.push(`🛒 أوردر جديد #${o.number} - ${storeName}`);
  L.push('');
  L.push(`👤 ${o.customer.name}`);
  L.push(`📞 ${o.customer.phone}`);
  L.push(`📍 ${o.area} - ${o.addressDetails}`);
  L.push('━━━━━━━━━━');

  o.items.forEach((i, idx) => {
    if (i.isCustom) {
      L.push(`${idx + 1}) ${i.name}`);
      if (i.note) L.push(`   ${i.note}`);
      L.push('   (السعر بعد الشراء)');
      return;
    }
    let head = `${idx + 1}) ${i.name} × ${formatQuantity(i.quantity, i.unit, i.saleMode)}`;
    if (i.weightPerUnit != null) head += ` (وزن تقريبي ${i.weightPerUnit} كجم)`;
    L.push(head);
    for (const opt of i.options) L.push(`   + ${opt.optionName}`);
    const approx = i.saleMode !== 'UNIT' ? ' (تقريبي)' : '';
    L.push(`   ${formatMinor(i.lineTotalMinor ?? 0)} ج${approx}`);
  });

  L.push('━━━━━━━━━━');
  const p = o.pricing;
  L.push(`المجموع: ${formatMinor(p.grossMinor)} ج`);
  if (p.productDiscountMinor > 0)
    L.push(`خصم المنتجات: -${formatMinor(p.productDiscountMinor)} ج`);
  if (p.invoiceDiscountMinor > 0)
    L.push(
      `خصم الفاتورة${p.discountLabel ? ` (${p.discountLabel})` : ''}: -${formatMinor(p.invoiceDiscountMinor)} ج`,
    );
  if (p.serviceFeeMinor > 0)
    L.push(`${serviceFeeLabel(o.items)}: ${formatMinor(p.serviceFeeMinor)} ج`);
  L.push(
    `التوصيل: ${p.freeDeliveryApplied ? 'مجاني' : `${formatMinor(p.deliveryFeeMinor)} ج`}`,
  );
  L.push(`💰 الإجمالي: ${formatMinor(p.totalMinor)} ج`);

  if (o.isEstimated)
    L.push('⚠️ الأوزان تقريبية (±100 جم) والسعر النهائي بعد الوزن');
  if (o.needsPricing)
    L.push('⚠️ فيه بنود سعرها بعد الشراء (مش محسوبة في الإجمالي)');
  if (o.notes) {
    L.push('');
    L.push(`📝 ${o.notes}`);
  }
  return L.join('\n');
}

export const whatsappUrl = (number: string, text: string): string =>
  `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

export const ORDER_STATUSES = [
  'PENDING',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

const NEXT: Record<OrderStatusValue, OrderStatusValue[]> = {
  PENDING: ['PREPARING', 'CANCELLED'],
  PREPARING: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const nextStatuses = (from: string): OrderStatusValue[] =>
  NEXT[from as OrderStatusValue] ?? [];

export const canTransition = (from: string, to: string): boolean =>
  nextStatuses(from).includes(to as OrderStatusValue);

export const isFinalStatus = (s: string): boolean =>
  nextStatuses(s).length === 0;

export const statusTimestamps = (to: OrderStatusValue, now: Date) => {
  switch (to) {
    case 'PREPARING':
      return { confirmedAt: now };
    case 'OUT_FOR_DELIVERY':
      return { outForDeliveryAt: now };
    case 'DELIVERED':
      return { deliveredAt: now };
    case 'CANCELLED':
      return { cancelledAt: now };
    default:
      return {};
  }
};

export interface AdminOrderItemRow extends OrderItemRow {
  categoryName: string | null;
  storeId: string | null;
  storeName: string | null;
  menuSection: string | null;
  purchased: boolean;
  purchasedAt: Date | null;
  actualCostMinor: number | null;
}

export interface AdminOrderRow extends Omit<OrderRow, 'items'> {
  areaId: string | null;
  discountId: string | null;
  adminNote: string | null;
  cancelReason: string | null;
  confirmedAt: Date | null;
  outForDeliveryAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  items: AdminOrderItemRow[];
}

const iso = (d: Date | null) => (d ? d.toISOString() : null);

export const toAdminOrderDto = (o: AdminOrderRow) => {
  const base = toCustomerOrderDto(o);
  return {
    ...base,
    areaId: o.areaId,
    discountId: o.discountId,
    adminNote: o.adminNote,
    cancelReason: o.cancelReason,
    timeline: {
      createdAt: base.createdAt,
      confirmedAt: iso(o.confirmedAt),
      outForDeliveryAt: iso(o.outForDeliveryAt),
      deliveredAt: iso(o.deliveredAt),
      cancelledAt: iso(o.cancelledAt),
    },
    nextStatuses: nextStatuses(o.status),
    items: base.items.map((it, idx) => {
      const r = o.items[idx];
      return {
        ...it,
        categoryName: r.categoryName,
        storeId: r.storeId,
        storeName: r.storeName,
        menuSection: r.menuSection,
        commissionBps: r.commissionBps,
        purchased: r.purchased,
        purchasedAt: iso(r.purchasedAt),
        actualCostMinor: r.actualCostMinor,
      };
    }),
  };
};

export type AdminOrderDto = ReturnType<typeof toAdminOrderDto>;

export interface OrderListRow extends Omit<AdminOrderRow, 'items'> {
  _count: { items: number };
}

export const toOrderListItem = (o: OrderListRow) => ({
  id: o.id,
  number: o.number,
  status: o.status,
  createdAt: o.createdAt.toISOString(),
  customerName: o.customerName,
  customerPhone: o.customerPhone,
  area: o.areaName,
  itemsCount: o._count.items,
  totalMinor: o.totalMinor,
  isEstimated: o.isEstimated,
  needsPricing: o.needsPricing,
  adminNote: o.adminNote,
  nextStatuses: nextStatuses(o.status),
});

export const toStatusCounts = (
  rows: { status: string; _count: { _all: number } }[],
) => {
  const counts = Object.fromEntries(
    ORDER_STATUSES.map((s) => [s, 0]),
  ) as Record<OrderStatusValue, number>;
  for (const r of rows)
    if (r.status in counts)
      counts[r.status as OrderStatusValue] = r._count._all;
  return counts;
};

export const parseOrderNumber = (q: string): number | null => {
  const m = /^#?(\d{1,9})$/.exec(q.trim());
  return m ? Number(m[1]) : null;
};
