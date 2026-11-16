import appError from '../../common/utils/appError';
import { dayRange, todayIn } from '../../common/utils/timezone';
import env from '../../config/env';
import { prisma } from '../../config/postgres';
import {
  buildDayList,
  buildStoreRange,
  dayKeyToDate,
  summarizeItems,
  toSettlementDto,
} from './accountingHelpers';
import type { AccItem } from './accountingHelpers';
import type {
  DayListQuery,
  SettleInput,
  StoreRangeQuery,
} from './accountingValidation';

async function fetchItems(
  from: string,
  to: string,
  storeId?: string | { in: string[] },
) {
  const range = {
    gte: dayRange(from, env.TIMEZONE).from,
    lt: dayRange(to, env.TIMEZONE).to,
  };
  const rows = await prisma.orderItem.findMany({
    where: {
      storeId,
      order: { status: { not: 'CANCELLED' }, createdAt: range },
    },
    select: {
      orderId: true,
      storeId: true,
      lineTotalMinor: true,
      serviceFeeMinor: true,
      order: { select: { createdAt: true } },
    },
  });
  return rows
    .filter((r) => r.storeId !== null)
    .map(
      (r): AccItem => ({
        orderId: r.orderId,
        storeId: r.storeId as string,
        lineTotalMinor: r.lineTotalMinor,
        serviceFeeMinor: r.serviceFeeMinor,
        createdAt: r.order.createdAt,
      }),
    );
}

async function getRestaurant(storeId: string) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, name: true, type: true, commissionBps: true },
  });
  if (!store) throw new appError('المحل مش موجود', 404, 'STORE_NOT_FOUND');
  if (store.type !== 'RESTAURANT')
    throw new appError('الحسابات للمطاعم بس', 422, 'NOT_A_RESTAURANT');
  return store;
}

export const accountingService = {
  async dayList(q: DayListQuery) {
    const date = q.date ?? todayIn(env.TIMEZONE);
    const items = await fetchItems(date, date);
    const restaurantIds = new Set(
      (
        await prisma.store.findMany({
          where: { type: 'RESTAURANT' },
          select: { id: true },
        })
      ).map((s) => s.id),
    );
    const restaurantItems = items.filter((i) => restaurantIds.has(i.storeId));

    const stores = await prisma.store.findMany({
      where: {
        type: 'RESTAURANT',
        OR: [
          { isActive: true, archivedAt: null },
          { id: { in: [...new Set(restaurantItems.map((i) => i.storeId))] } },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, commissionBps: true },
    });
    const settlements = await prisma.storeSettlement.findMany({
      where: { date: dayKeyToDate(date) },
    });
    return buildDayList(date, stores, restaurantItems, settlements);
  },

  async storeRange(storeId: string, q: StoreRangeQuery) {
    const store = await getRestaurant(storeId);
    const [items, settlements] = await Promise.all([
      fetchItems(q.from, q.to, storeId),
      prisma.storeSettlement.findMany({
        where: {
          storeId,
          date: { gte: dayKeyToDate(q.from), lte: dayKeyToDate(q.to) },
        },
      }),
    ]);
    return {
      store: {
        id: store.id,
        name: store.name,
        serviceFeeBps: store.commissionBps,
      },
      ...buildStoreRange(q.from, q.to, env.TIMEZONE, items, settlements),
    };
  },

  async settle(input: SettleInput) {
    const store = await getRestaurant(input.storeId);
    if (input.date > todayIn(env.TIMEZONE))
      throw new appError('مينفعش تحاسب يوم لسه ما جاش', 422, 'FUTURE_DATE');

    const existing = await prisma.storeSettlement.findUnique({
      where: {
        storeId_date: { storeId: store.id, date: dayKeyToDate(input.date) },
      },
    });
    if (existing)
      throw new appError(
        'اليوم ده اتحاسب قبل كده، الغي المحاسبة الأول لو عايز تعيدها',
        409,
        'ALREADY_SETTLED',
        { id: existing.id },
      );

    const live = summarizeItems(
      await fetchItems(input.date, input.date, store.id),
    );
    if (live.salesMinor === 0)
      throw new appError('مفيش مبيعات في اليوم ده', 422, 'NOTHING_TO_SETTLE');

    const s = await prisma.storeSettlement.create({
      data: {
        storeId: store.id,
        date: dayKeyToDate(input.date),
        salesMinor: live.salesMinor,
        serviceFeeMinor: live.serviceFeeMinor,
        settledAt: new Date(),
        note: input.note ?? null,
      },
    });
    return toSettlementDto(s);
  },

  async unsettle(id: string) {
    const r = await prisma.storeSettlement.deleteMany({ where: { id } });
    if (r.count === 0)
      throw new appError('المحاسبة مش موجودة', 404, 'SETTLEMENT_NOT_FOUND');
  },
};
