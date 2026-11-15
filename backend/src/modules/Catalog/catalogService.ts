import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/postgres';
import { isDiscountLive, isHidden } from '../Pricing/pricingAdapters';
import { settingsService } from '../Settings/settingsService';
import {
  menuSections,
  toCatalogCategory,
  toCatalogProduct,
  toCatalogStore,
} from './catalogHelpers';

const storeSelect = {
  id: true,
  name: true,
  type: true,
  commissionBps: true,
  isActive: true,
  archivedAt: true,
} satisfies Prisma.StoreSelect;

export const pricingProductInclude = {
  category: {
    select: {
      name: true,
      isActive: true,
      archivedAt: true,
      discountKind: true,
      discountValue: true,
      defaultStore: { select: storeSelect },
    },
  },
  store: { select: storeSelect },
  optionGroups: {
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      minSelect: true,
      maxSelect: true,
      isActive: true,
      sortOrder: true,
      options: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          pricing: true,
          priceMinor: true,
          isActive: true,
          sortOrder: true,
        },
      },
    },
  },
} satisfies Prisma.ProductInclude;

export const catalogService = {
  async get(now: Date = new Date()) {
    const [settings, areas, categories, restaurants, rows, discounts] =
      await Promise.all([
        settingsService.get(),
        prisma.area.findMany({
          where: { isActive: true, archivedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: { id: true, name: true, feeMinor: true },
        }),
        prisma.category.findMany({
          where: { isActive: true, archivedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        }),
        prisma.store.findMany({
          where: { type: 'RESTAURANT', isActive: true, archivedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        }),
        prisma.product.findMany({
          where: { archivedAt: null },
          include: pricingProductInclude,
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        }),
        prisma.discount.findMany({ where: { code: null, isActive: true } }),
      ]);

    const products = rows.filter((p) => !isHidden(p)).map(toCatalogProduct);

    return {
      settings,
      areas,
      categories: categories.map(toCatalogCategory),
      stores: restaurants.map((s) =>
        toCatalogStore(
          s,
          menuSections(products.filter((p) => p.storeId === s.id)),
        ),
      ),
      products,
      discounts: discounts
        .filter((d) => isDiscountLive(d, now))
        .map((d) => ({
          name: d.name,
          kind: d.kind,
          value: d.value,
          minSubtotalMinor: d.minSubtotalMinor,
          maxDiscountMinor: d.maxDiscountMinor,
        })),
      generatedAt: now.toISOString(),
    };
  },
};
