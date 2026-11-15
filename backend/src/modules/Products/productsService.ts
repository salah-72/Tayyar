import type { Prisma } from '@prisma/client';
import appError from '../../common/utils/appError';
import { pageMeta, paginate } from '../../common/utils/pagination';
import { prisma } from '../../config/postgres';
import { discountError } from '../Categories/categoriesHelpers';
import {
  normalizeProductDiscount,
  optionGroupsFitError,
  productRuleError,
  toProductDto,
} from './productsHelpers';
import type { ProductState, RuleError } from './productsHelpers';
import type {
  BulkDiscountInput,
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from './productsValidation';

const include = {
  category: { select: { id: true, name: true } },
  store: { select: { id: true, name: true, type: true } },
  optionGroups: {
    select: { id: true, name: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  },
} satisfies Prisma.ProductInclude;

const notFound = () =>
  new appError('المنتج مش موجود', 404, 'PRODUCT_NOT_FOUND');
const invalid = (e: RuleError) => new appError(e.message, 422, e.code);

async function getOrThrow(id: string) {
  const p = await prisma.product.findUnique({ where: { id }, include });
  if (!p) throw notFound();
  return p;
}

async function loadRefs(
  categoryId: string | null,
  storeId: string | null,
  rejectArchived: { category: boolean; store: boolean },
) {
  const [category, store] = await Promise.all([
    categoryId
      ? prisma.category.findUnique({ where: { id: categoryId } })
      : null,
    storeId ? prisma.store.findUnique({ where: { id: storeId } }) : null,
  ]);
  if (
    categoryId &&
    (!category || (rejectArchived.category && category.archivedAt))
  )
    throw new appError('القسم مش موجود', 422, 'CATEGORY_NOT_FOUND');
  if (storeId && (!store || (rejectArchived.store && store.archivedAt)))
    throw new appError('المحل مش موجود', 422, 'STORE_NOT_FOUND');
  return { category, store };
}

async function assertOptionGroups(
  ids: string[],
  saleMode: ProductState['saleMode'],
) {
  if (!ids.length) return;
  if (new Set(ids).size !== ids.length)
    throw new appError('مجموعة خيارات متكررة', 422, 'OPTION_GROUP_DUPLICATE');
  const groups = await prisma.optionGroup.findMany({
    where: { id: { in: ids } },
    include: { options: true },
  });
  if (groups.length !== ids.length)
    throw new appError(
      'فيه مجموعة خيارات مش موجودة',
      422,
      'OPTION_GROUP_NOT_FOUND',
    );
  const e = optionGroupsFitError(saleMode, groups);
  if (e) throw invalid(e);
}

async function assertNameFree(
  name: string,
  categoryId: string | null,
  storeId: string | null,
  exceptId?: string,
) {
  const same = await prisma.product.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      archivedAt: null,
      ...(categoryId ? { categoryId } : { storeId }),
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { id: true },
  });
  if (same)
    throw new appError('فيه منتج بنفس الاسم هنا', 409, 'PRODUCT_NAME_TAKEN');
}

export const productsService = {
  async list(q: ListProductsQuery) {
    const where: Prisma.ProductWhereInput = {
      categoryId: q.categoryId,
      storeId: q.storeId,
      saleMode: q.saleMode,
      isActive: q.active,
      isFeatured: q.featured,
      archivedAt: q.archived ? { not: null } : null,
      ...(q.q ? { name: { contains: q.q, mode: 'insensitive' } } : {}),
    };
    const [total, rows] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        ...paginate(q.page, q.limit),
      }),
    ]);
    return {
      products: rows.map(toProductDto),
      meta: pageMeta(q.page, q.limit, total),
    };
  },

  async get(id: string) {
    return toProductDto(await getOrThrow(id));
  },

  async create(b: CreateProductInput) {
    const { category, store } = await loadRefs(
      b.categoryId ?? null,
      b.storeId ?? null,
      {
        category: true,
        store: true,
      },
    );

    const d = normalizeProductDiscount(b.discountKind, b.discountValue);
    const state: ProductState = {
      saleMode: b.saleMode ?? 'UNIT',
      unit: b.unit,
      priceMinor: b.priceMinor,
      minQty: b.minQty ?? 1,
      qtyStep: b.qtyStep ?? 1,
      weightChoices: b.weightChoices ?? [],
      discountKind: d.kind,
      discountValue: b.discountValue ?? null,
      categoryId: category?.id ?? null,
      storeId: store?.id ?? null,
      storeType: store?.type ?? null,
      menuSection: b.menuSection ?? null,
    };
    const rule = productRuleError(state);
    if (rule) throw invalid(rule);

    await assertOptionGroups(b.optionGroupIds ?? [], state.saleMode);
    await assertNameFree(b.name, state.categoryId, state.storeId);

    const p = await prisma.product.create({
      data: {
        name: b.name,
        description: b.description ?? null,
        categoryId: state.categoryId,
        storeId: state.storeId,
        menuSection: state.menuSection,
        unit: b.unit,
        saleMode: state.saleMode,
        priceMinor: state.priceMinor,
        minQty: state.minQty,
        qtyStep: state.qtyStep,
        weightChoices: state.weightChoices,
        discountKind: d.kind,
        discountValue: d.value,
        isFeatured: b.isFeatured ?? false,
        isActive: b.isActive ?? true,
        sortOrder: b.sortOrder ?? 0,
        optionGroups: {
          connect: (b.optionGroupIds ?? []).map((id) => ({ id })),
        },
      },
      include,
    });
    return toProductDto(p);
  },

  async update(id: string, patch: UpdateProductInput) {
    const cur = await getOrThrow(id);
    if (cur.archivedAt)
      throw new appError(
        'المنتج مؤرشف: استرجعه الأول',
        409,
        'PRODUCT_ARCHIVED',
      );

    const categoryId =
      patch.categoryId !== undefined ? patch.categoryId : cur.categoryId;
    const storeId = patch.storeId !== undefined ? patch.storeId : cur.storeId;
    const { store } = await loadRefs(categoryId, storeId, {
      category: patch.categoryId !== undefined,
      store: patch.storeId !== undefined,
    });

    const discountTouched =
      patch.discountKind !== undefined || patch.discountValue !== undefined;
    const rawKind = (
      patch.discountKind !== undefined ? patch.discountKind : cur.discountKind
    ) as ProductState['discountKind'] | undefined;
    const kindCleared =
      patch.discountKind !== undefined &&
      (patch.discountKind === null || patch.discountKind === 'NONE');
    const rawValue =
      patch.discountValue !== undefined
        ? patch.discountValue
        : kindCleared
          ? null
          : cur.discountValue;
    const d = normalizeProductDiscount(rawKind, rawValue);

    const state: ProductState = {
      saleMode: patch.saleMode ?? cur.saleMode,
      unit: patch.unit ?? cur.unit,
      priceMinor: patch.priceMinor ?? cur.priceMinor,
      minQty: patch.minQty ?? Number(cur.minQty),
      qtyStep: patch.qtyStep ?? Number(cur.qtyStep),
      weightChoices: patch.weightChoices ?? cur.weightChoices.map(Number),
      discountKind: d.kind,
      discountValue: rawValue ?? null,
      categoryId,
      storeId,
      storeType: store?.type ?? null,
      menuSection:
        patch.menuSection !== undefined ? patch.menuSection : cur.menuSection,
    };
    const rule = productRuleError(state);
    if (rule) throw invalid(rule);

    const groupIds = patch.optionGroupIds ?? cur.optionGroups.map((g) => g.id);
    if (patch.optionGroupIds !== undefined || patch.saleMode !== undefined)
      await assertOptionGroups(groupIds, state.saleMode);

    if (
      patch.name !== undefined ||
      patch.categoryId !== undefined ||
      patch.storeId !== undefined
    )
      await assertNameFree(patch.name ?? cur.name, categoryId, storeId, id);

    const { optionGroupIds, discountKind, discountValue, ...rest } = patch;
    void discountKind;
    void discountValue;
    const data: Prisma.ProductUncheckedUpdateInput = { ...rest };
    if (discountTouched) {
      data.discountKind = d.kind;
      data.discountValue = d.value;
    }
    if (optionGroupIds !== undefined)
      data.optionGroups = { set: optionGroupIds.map((gid) => ({ id: gid })) };

    return toProductDto(
      await prisma.product.update({ where: { id }, data, include }),
    );
  },

  async archive(id: string) {
    await getOrThrow(id);
    await prisma.product.update({
      where: { id },
      data: { archivedAt: new Date(), isActive: false },
    });
  },

  async restore(id: string) {
    const cur = await getOrThrow(id);
    await loadRefs(cur.categoryId, cur.storeId, {
      category: true,
      store: true,
    });
    await assertNameFree(cur.name, cur.categoryId, cur.storeId, id);
    return toProductDto(
      await prisma.product.update({
        where: { id },
        data: { archivedAt: null, isActive: true },
        include,
      }),
    );
  },

  async bulkDiscount(b: BulkDiscountInput) {
    const d = normalizeProductDiscount(b.discountKind, b.discountValue);
    const bad = discountError(b.discountKind, b.discountValue);
    if (bad) throw new appError(bad, 422, 'INVALID_DISCOUNT');

    const r = await prisma.product.updateMany({
      where: { id: { in: b.productIds }, archivedAt: null },
      data: { discountKind: d.kind, discountValue: d.value },
    });
    return { updated: r.count };
  },
};
