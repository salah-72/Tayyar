import { toMilli } from '../../common/utils/money';
import { unitLabel } from '../../common/utils/units';
import { formatQuantity } from '../Orders/ordersHelpers';

type DecLike = number | string | { toString(): string };

export interface PurchaseItemRow {
  id: string;
  productId: string | null;
  isCustom: boolean;
  name: string;
  unit: string | null;
  saleMode: string;
  quantity: DecLike;
  weightPerUnit: DecLike | null;
  options: unknown;
  lineTotalMinor: number | null;
  note: string | null;
  categoryName: string | null;
  storeId: string | null;
  storeName: string | null;
  menuSection: string | null;
  purchased: boolean;
  purchasedAt: Date | null;
  actualCostMinor: number | null;
  order: { id: string; number: number; customerName: string; areaName: string };
}

export type PurchaseState = 'NONE' | 'PARTIAL' | 'ALL';

const stateOf = (purchased: number, total: number): PurchaseState =>
  purchased === 0 ? 'NONE' : purchased === total ? 'ALL' : 'PARTIAL';

const optionNames = (raw: unknown): string[] =>
  Array.isArray(raw)
    ? raw
        .map((o) =>
          o && typeof o === 'object'
            ? (o as { optionName?: unknown }).optionName
            : null,
        )
        .filter((n): n is string => typeof n === 'string')
    : [];

const milliOf = (q: DecLike) => toMilli(Number(q));

export const aggregationKey = (i: {
  productId: string | null;
  weightPerUnit: DecLike | null;
  options: unknown;
}): string =>
  [
    i.productId ?? '',
    i.weightPerUnit == null ? '' : String(Number(i.weightPerUnit)),
    [...optionNames(i.options)].sort().join('+'),
  ].join('|');

export interface PurchaseLine {
  key: string;
  isCustom: boolean;
  productId: string | null;
  name: string;
  unit: string | null;
  unitLabel: string;
  saleMode: string;
  weightPerUnit: number | null;
  options: string[];
  categoryName: string | null;
  menuSection: string | null;
  quantity: number;
  quantityText: string;
  note: string | null;
  estimatedMinor: number;
  actualCostMinor: number | null;
  state: PurchaseState;
  itemIds: string[];
  orders: {
    orderId: string;
    number: number;
    customerName: string;
    area: string;
    quantity: number;
  }[];
}

export interface PurchaseStoreGroup {
  storeId: string | null;
  storeName: string;
  lines: PurchaseLine[];
  itemsCount: number;
  purchasedCount: number;
  state: PurchaseState;
  estimatedMinor: number;
  actualCostMinor: number;
  text: string;
}

export const NO_STORE_NAME = 'من غير محل محدد';

function toLine(key: string, rows: PurchaseItemRow[]): PurchaseLine {
  const f = rows[0];
  const qMilli = rows.reduce((s, r) => s + milliOf(r.quantity), 0);
  const quantity = qMilli / 1000;
  const bought = rows.filter((r) => r.purchased).length;
  const costs = rows
    .map((r) => r.actualCostMinor)
    .filter((c): c is number => c !== null);
  return {
    key,
    isCustom: f.isCustom,
    productId: f.productId,
    name: f.name,
    unit: f.unit,
    unitLabel: unitLabel(f.unit),
    saleMode: f.saleMode,
    weightPerUnit: f.weightPerUnit == null ? null : Number(f.weightPerUnit),
    options: optionNames(f.options),
    categoryName: f.categoryName,
    menuSection: f.menuSection,
    quantity,
    quantityText: f.isCustom
      ? ''
      : formatQuantity(quantity, f.unit, f.saleMode),
    note: f.isCustom ? f.note : null,
    estimatedMinor: rows.reduce((s, r) => s + (r.lineTotalMinor ?? 0), 0),
    actualCostMinor: costs.length ? costs.reduce((s, c) => s + c, 0) : null,
    state: stateOf(bought, rows.length),
    itemIds: rows.map((r) => r.id),
    orders: rows.map((r) => ({
      orderId: r.order.id,
      number: r.order.number,
      customerName: r.order.customerName,
      area: r.order.areaName,
      quantity: Number(r.quantity),
    })),
  };
}

const byName = (a: string, b: string) => a.localeCompare(b, 'ar');

export function buildStoreText(
  storeName: string,
  lines: PurchaseLine[],
): string {
  const pending = lines.filter((l) => l.state !== 'ALL');
  if (!pending.length) return '';
  const L = [`🛒 مطلوب من ${storeName}`, ''];
  pending.forEach((l, idx) => {
    if (l.isCustom) {
      L.push(`${idx + 1}) ${l.name}${l.note ? ` - ${l.note}` : ''}`);
      return;
    }
    let s = `${idx + 1}) ${l.name} × ${l.quantityText}`;
    if (l.weightPerUnit != null) s += ` (وزن ${l.weightPerUnit} كجم)`;
    L.push(s);
    for (const o of l.options) L.push(`   + ${o}`);
  });
  return L.join('\n');
}

export function buildShoppingList(items: PurchaseItemRow[]) {
  const byStore = new Map<string, PurchaseItemRow[]>();
  for (const it of items) {
    const k = it.storeId ?? 'none';
    byStore.set(k, [...(byStore.get(k) ?? []), it]);
  }

  const stores: PurchaseStoreGroup[] = [...byStore.entries()].map(
    ([sid, rows]) => {
      const groups = new Map<string, PurchaseItemRow[]>();
      for (const r of rows) {
        const k = r.isCustom ? `custom|${r.id}` : aggregationKey(r);
        groups.set(k, [...(groups.get(k) ?? []), r]);
      }
      const lines = [...groups.entries()]
        .map(([k, g]) => toLine(k, g))
        .sort(
          (a, b) =>
            Number(a.isCustom) - Number(b.isCustom) ||
            byName(a.categoryName ?? '￿', b.categoryName ?? '￿') ||
            byName(a.name, b.name),
        );
      const storeName =
        rows.find((r) => r.storeName)?.storeName ?? NO_STORE_NAME;
      const purchasedCount = rows.filter((r) => r.purchased).length;
      return {
        storeId: sid === 'none' ? null : sid,
        storeName,
        lines,
        itemsCount: rows.length,
        purchasedCount,
        state: stateOf(purchasedCount, rows.length),
        estimatedMinor: lines.reduce((s, l) => s + l.estimatedMinor, 0),
        actualCostMinor: lines.reduce(
          (s, l) => s + (l.actualCostMinor ?? 0),
          0,
        ),
        text: buildStoreText(storeName, lines),
      };
    },
  );

  stores.sort((a, b) =>
    a.storeId === null
      ? 1
      : b.storeId === null
        ? -1
        : byName(a.storeName, b.storeName),
  );

  const purchasedCount = items.filter((i) => i.purchased).length;
  return {
    stores,
    totals: {
      itemsCount: items.length,
      purchasedCount,
      state: stateOf(purchasedCount, items.length),
      estimatedMinor: stores.reduce((s, g) => s + g.estimatedMinor, 0),
      actualCostMinor: stores.reduce((s, g) => s + g.actualCostMinor, 0),
    },
  };
}

export function distributeCost(
  totalMinor: number,
  weights: number[],
): number[] {
  const n = weights.length;
  if (n === 0) return [];
  const w = weights.map((x) => Math.max(0, x));
  const sum = w.reduce((s, x) => s + x, 0);
  const base = sum === 0 ? w.map(() => 1) : w;
  const baseSum = sum === 0 ? n : sum;

  const shares = base.map((x) => Math.floor((totalMinor * x) / baseSum));
  let rest = totalMinor - shares.reduce((s, x) => s + x, 0);
  const order = base
    .map((x, i) => ({ i, rem: (totalMinor * x) % baseSum }))
    .sort((a, b) => b.rem - a.rem || a.i - b.i);
  for (let k = 0; rest > 0; k = (k + 1) % n, rest--) shares[order[k].i] += 1;
  return shares;
}
