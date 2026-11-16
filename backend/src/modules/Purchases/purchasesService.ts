import appError from '../../common/utils/appError';
import { prisma } from '../../config/postgres';
import { buildShoppingList, distributeCost } from './purchasesHelpers';
import type { PurchaseItemRow } from './purchasesHelpers';
import type {
  MarkPurchasedInput,
  ShoppingListQuery,
} from './purchasesValidation';

export const purchasesService = {
  async shoppingList(q: ShoppingListQuery) {
    const rows = await prisma.orderItem.findMany({
      where: {
        order: { status: q.status },
        ...(q.storeId
          ? { storeId: q.storeId === 'none' ? null : q.storeId }
          : {}),
      },
      include: {
        order: {
          select: {
            id: true,
            number: true,
            customerName: true,
            areaName: true,
          },
        },
      },
      orderBy: [{ order: { number: 'asc' } }, { id: 'asc' }],
    });
    const list = buildShoppingList(rows as unknown as PurchaseItemRow[]);
    if (!q.hidePurchased) return { status: q.status, ...list };

    const stores = list.stores
      .map((s) => ({ ...s, lines: s.lines.filter((l) => l.state !== 'ALL') }))
      .filter((s) => s.lines.length > 0);
    return { status: q.status, stores, totals: list.totals };
  },

  async mark(input: MarkPurchasedInput) {
    const ids = [...new Set(input.itemIds)];
    const items = await prisma.orderItem.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        lineTotalMinor: true,
        order: { select: { status: true } },
      },
      orderBy: { id: 'asc' },
    });
    if (items.length !== ids.length)
      throw new appError('فيه بنود مش موجودة', 404, 'ITEM_NOT_FOUND');
    if (items.some((i) => i.order.status === 'CANCELLED'))
      throw new appError('فيه بنود تابعة لأوردر ملغي', 422, 'ORDER_CANCELLED');

    const now = new Date();
    const costs =
      input.purchased && input.actualCostMinor != null
        ? distributeCost(
            input.actualCostMinor,
            items.map((i) => i.lineTotalMinor ?? 0),
          )
        : null;

    await prisma.$transaction(
      items.map((it, idx) =>
        prisma.orderItem.update({
          where: { id: it.id },
          data: input.purchased
            ? {
                purchased: true,
                purchasedAt: now,
                ...(costs ? { actualCostMinor: costs[idx] } : {}),
              }
            : { purchased: false, purchasedAt: null, actualCostMinor: null },
        }),
      ),
    );
    return { updated: items.length };
  },
};
