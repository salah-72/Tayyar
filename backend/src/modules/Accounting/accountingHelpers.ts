import { todayIn } from '../../common/utils/timezone';

export interface AccItem {
  orderId: string;
  storeId: string;
  lineTotalMinor: number | null;
  serviceFeeMinor: number;
  createdAt: Date;
}

export interface SettlementRow {
  id: string;
  storeId: string;
  date: Date;
  salesMinor: number;
  serviceFeeMinor: number;
  settledAt: Date | null;
  note: string | null;
}

export interface DaySummary {
  salesMinor: number;
  serviceFeeMinor: number;
  ordersCount: number;
  itemsCount: number;
}

export function summarizeItems(items: AccItem[]): DaySummary {
  let sales = 0;
  let fee = 0;
  for (const it of items) {
    sales += it.lineTotalMinor ?? 0;
    fee += it.serviceFeeMinor;
  }
  return {
    salesMinor: sales,
    serviceFeeMinor: fee,
    ordersCount: new Set(items.map((i) => i.orderId)).size,
    itemsCount: items.length,
  };
}

export const dayKeyOf = (d: Date, tz: string): string => todayIn(tz, d);

export const settlementDayKey = (d: Date): string =>
  d.toISOString().slice(0, 10);

export const dayKeyToDate = (key: string): Date =>
  new Date(`${key}T00:00:00.000Z`);

export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  const end = dayKeyToDate(to).getTime();
  for (let t = dayKeyToDate(from).getTime(); t <= end; t += 86_400_000)
    out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}

export const daysBetween = (from: string, to: string): number =>
  Math.round(
    (dayKeyToDate(to).getTime() - dayKeyToDate(from).getTime()) / 86_400_000,
  ) + 1;

export type SettlementState = 'OPEN' | 'SETTLED' | 'CHANGED';

export function settlementState(
  live: DaySummary,
  s: SettlementRow | null,
): SettlementState {
  if (!s || !s.settledAt) return 'OPEN';
  return s.salesMinor === live.salesMinor &&
    s.serviceFeeMinor === live.serviceFeeMinor
    ? 'SETTLED'
    : 'CHANGED';
}

export const toSettlementDto = (s: SettlementRow) => ({
  id: s.id,
  date: settlementDayKey(s.date),
  salesMinor: s.salesMinor,
  serviceFeeMinor: s.serviceFeeMinor,
  settledAt: s.settledAt ? s.settledAt.toISOString() : null,
  note: s.note,
});

const ZERO: DaySummary = {
  salesMinor: 0,
  serviceFeeMinor: 0,
  ordersCount: 0,
  itemsCount: 0,
};

const dayRow = (date: string, live: DaySummary, s: SettlementRow | null) => ({
  date,
  ...live,
  state: settlementState(live, s),
  settlement: s ? toSettlementDto(s) : null,
});

export interface StoreInfo {
  id: string;
  name: string;
  commissionBps: number;
}

export function buildDayList(
  date: string,
  stores: StoreInfo[],
  items: AccItem[],
  settlements: SettlementRow[],
) {
  const rows = stores.map((st) => {
    const live = summarizeItems(items.filter((i) => i.storeId === st.id));
    const s = settlements.find((x) => x.storeId === st.id) ?? null;
    return {
      storeId: st.id,
      storeName: st.name,
      serviceFeeBps: st.commissionBps,
      ...dayRow(date, live, s),
    };
  });
  const all = summarizeItems(items);
  return {
    date,
    stores: rows,
    totals: {
      salesMinor: rows.reduce((a, r) => a + r.salesMinor, 0),
      serviceFeeMinor: rows.reduce((a, r) => a + r.serviceFeeMinor, 0),
      ordersCount: all.ordersCount,
      openCount: rows.filter((r) => r.salesMinor > 0 && r.state !== 'SETTLED')
        .length,
    },
  };
}

export function buildStoreRange(
  from: string,
  to: string,
  tz: string,
  items: AccItem[],
  settlements: SettlementRow[],
) {
  const byDay = new Map<string, AccItem[]>();
  for (const it of items) {
    const k = dayKeyOf(it.createdAt, tz);
    byDay.set(k, [...(byDay.get(k) ?? []), it]);
  }
  const sByDay = new Map(settlements.map((s) => [settlementDayKey(s.date), s]));

  const days = eachDay(from, to)
    .map((d) => {
      const live = byDay.has(d) ? summarizeItems(byDay.get(d)!) : ZERO;
      return dayRow(d, live, sByDay.get(d) ?? null);
    })
    .filter((r) => r.salesMinor > 0 || r.settlement !== null);

  return {
    from,
    to,
    days,
    totals: {
      salesMinor: days.reduce((a, r) => a + r.salesMinor, 0),
      serviceFeeMinor: days.reduce((a, r) => a + r.serviceFeeMinor, 0),
      ordersCount: days.reduce((a, r) => a + r.ordersCount, 0),
      unsettledSalesMinor: days
        .filter((r) => r.state !== 'SETTLED')
        .reduce((a, r) => a + r.salesMinor, 0),
    },
  };
}
