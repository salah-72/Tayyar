import type { Prisma } from '@prisma/client';
import appError from '../../common/utils/appError';
import { uniqueSlug } from '../../common/utils/slug';
import { prisma } from '../../config/postgres';
import {
  discountError,
  normalizeDiscount,
  toCategoryDto,
} from './categoriesHelpers';
import type {
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput,
} from './categoriesValidation';

const include = {
  defaultStore: { select: { id: true, name: true } },
  _count: { select: { products: { where: { archivedAt: null } } } },
} satisfies Prisma.CategoryInclude;

const notFound = () =>
  new appError('القسم مش موجود', 404, 'CATEGORY_NOT_FOUND');

async function getOrThrow(id: string) {
  const c = await prisma.category.findUnique({ where: { id } });
  if (!c) throw notFound();
  return c;
}

async function assertNameFree(name: string, exceptId?: string) {
  const same = await prisma.category.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      archivedAt: null,
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { id: true },
  });
  if (same)
    throw new appError('فيه قسم بنفس الاسم', 409, 'CATEGORY_NAME_TAKEN');
}

async function assertSlugFree(slug: string, exceptId?: string) {
  const same = await prisma.category.findUnique({ where: { slug } });
  if (same && same.id !== exceptId)
    throw new appError('الـ slug مستخدم', 409, 'CATEGORY_SLUG_TAKEN');
}

async function assertDefaultStore(storeId: string | null | undefined) {
  if (!storeId) return;
  const s = await prisma.store.findUnique({ where: { id: storeId } });
  if (!s || s.archivedAt)
    throw new appError('المحل مش موجود', 422, 'STORE_NOT_FOUND');
  if (s.type !== 'SUPPLIER')
    throw new appError(
      'المحل الافتراضي لازم يكون مورّد (مش مطعم)',
      422,
      'STORE_NOT_SUPPLIER',
    );
}

function checkDiscount(
  kind: string | null | undefined,
  value: number | null | undefined,
) {
  const err = discountError(kind, value);
  if (err) throw new appError(err, 422, 'INVALID_DISCOUNT');
}

export const categoriesService = {
  async list(q: ListCategoriesQuery) {
    const rows = await prisma.category.findMany({
      where: {
        archivedAt: q.archived ? { not: null } : null,
        ...(q.q ? { name: { contains: q.q, mode: 'insensitive' } } : {}),
      },
      include,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toCategoryDto);
  },

  async get(id: string) {
    const c = await prisma.category.findUnique({ where: { id }, include });
    if (!c) throw notFound();
    return toCategoryDto(c);
  },

  async create(b: CreateCategoryInput) {
    await assertNameFree(b.name);
    checkDiscount(b.discountKind, b.discountValue);
    await assertDefaultStore(b.defaultStoreId);

    let slug: string;
    if (b.slug) {
      await assertSlugFree(b.slug);
      slug = b.slug;
    } else {
      slug = await uniqueSlug(
        b.name,
        'cat',
        async (s) =>
          !!(await prisma.category.findUnique({ where: { slug: s } })),
      );
    }

    const d = normalizeDiscount(b.discountKind, b.discountValue);
    const c = await prisma.category.create({
      data: {
        name: b.name,
        slug,
        sortOrder: b.sortOrder ?? 0,
        isActive: b.isActive ?? true,
        discountKind: d.kind,
        discountValue: d.value,
        defaultStoreId: b.defaultStoreId ?? null,
      },
      include,
    });
    return toCategoryDto(c);
  },

  async update(id: string, patch: UpdateCategoryInput) {
    const cur = await getOrThrow(id);
    if (cur.archivedAt)
      throw new appError(
        'القسم مؤرشف: استرجعه الأول',
        409,
        'CATEGORY_ARCHIVED',
      );

    if (patch.name) await assertNameFree(patch.name, id);
    if (patch.slug) await assertSlugFree(patch.slug, id);
    if (patch.defaultStoreId) await assertDefaultStore(patch.defaultStoreId);

    const { discountKind, discountValue, ...rest } = patch;
    const data: Prisma.CategoryUncheckedUpdateInput = { ...rest };
    if (discountKind !== undefined || discountValue !== undefined) {
      const kind = discountKind !== undefined ? discountKind : cur.discountKind;
      const value =
        discountValue !== undefined ? discountValue : cur.discountValue;
      checkDiscount(kind, value);
      const d = normalizeDiscount(kind, value);
      data.discountKind = d.kind;
      data.discountValue = d.value;
    }

    return toCategoryDto(
      await prisma.category.update({ where: { id }, data, include }),
    );
  },

  async archive(id: string) {
    await getOrThrow(id);
    const products = await prisma.product.count({
      where: { categoryId: id, archivedAt: null },
    });
    if (products > 0)
      throw new appError(
        `القسم فيه ${products} منتج: انقلهم أو أرشفهم الأول (أو اخفي القسم بـ isActive=false)`,
        409,
        'CATEGORY_HAS_PRODUCTS',
        { productsCount: products },
      );
    await prisma.category.update({
      where: { id },
      data: { archivedAt: new Date(), isActive: false },
    });
  },

  async restore(id: string) {
    const cur = await getOrThrow(id);
    await assertNameFree(cur.name, id);
    const store = cur.defaultStoreId
      ? await prisma.store.findUnique({ where: { id: cur.defaultStoreId } })
      : null;
    const c = await prisma.category.update({
      where: { id },
      data: {
        archivedAt: null,
        isActive: true,
        ...(store?.archivedAt ? { defaultStoreId: null } : {}),
      },
      include,
    });
    return toCategoryDto(c);
  },
};
