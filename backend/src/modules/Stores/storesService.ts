import type { Prisma } from '@prisma/client';
import appError from '../../common/utils/appError';
import { uniqueSlug } from '../../common/utils/slug';
import { prisma } from '../../config/postgres';
import { toStoreDto } from './storesHelpers';
import type {
  CreateStoreInput,
  ListStoresQuery,
  UpdateStoreInput,
} from './storesValidation';

const withCount = {
  _count: { select: { products: { where: { archivedAt: null } } } },
} satisfies Prisma.StoreInclude;

const notFound = () => new appError('المحل مش موجود', 404, 'STORE_NOT_FOUND');

async function getOrThrow(id: string) {
  const store = await prisma.store.findUnique({ where: { id } });
  if (!store) throw notFound();
  return store;
}

async function assertNameFree(name: string, exceptId?: string) {
  const same = await prisma.store.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      archivedAt: null,
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { id: true },
  });
  if (same) throw new appError('فيه محل بنفس الاسم', 409, 'STORE_NAME_TAKEN');
}

async function assertSlugFree(slug: string, exceptId?: string) {
  const same = await prisma.store.findUnique({ where: { slug } });
  if (same && same.id !== exceptId)
    throw new appError('الـ slug مستخدم', 409, 'STORE_SLUG_TAKEN');
}

export const storesService = {
  async list(q: ListStoresQuery) {
    const stores = await prisma.store.findMany({
      where: {
        type: q.type,
        archivedAt: q.archived ? { not: null } : null,
        ...(q.q ? { name: { contains: q.q, mode: 'insensitive' } } : {}),
      },
      include: withCount,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return stores.map(toStoreDto);
  },

  async get(id: string) {
    const store = await prisma.store.findUnique({
      where: { id },
      include: withCount,
    });
    if (!store) throw notFound();
    return toStoreDto(store);
  },

  async create(b: CreateStoreInput) {
    await assertNameFree(b.name);

    let slug: string;
    if (b.slug) {
      await assertSlugFree(b.slug);
      slug = b.slug;
    } else {
      slug = await uniqueSlug(
        b.name,
        'store',
        async (s) => !!(await prisma.store.findUnique({ where: { slug: s } })),
      );
    }

    const store = await prisma.store.create({
      data: {
        name: b.name,
        slug,
        type: b.type,
        sortOrder: b.sortOrder ?? 0,
        isActive: b.isActive ?? true,
      },
      include: withCount,
    });
    return toStoreDto(store);
  },

  async update(id: string, patch: UpdateStoreInput) {
    const cur = await getOrThrow(id);
    if (cur.archivedAt)
      throw new appError('المحل مؤرشف: استرجعه الأول', 409, 'STORE_ARCHIVED');

    if (patch.name) await assertNameFree(patch.name, id);
    if (patch.slug) await assertSlugFree(patch.slug, id);

    const store = await prisma.store.update({
      where: { id },
      data: patch,
      include: withCount,
    });
    return toStoreDto(store);
  },

  async archive(id: string) {
    await getOrThrow(id);
    const [products, categories] = await Promise.all([
      prisma.product.count({ where: { storeId: id, archivedAt: null } }),
      prisma.category.count({
        where: { defaultStoreId: id, archivedAt: null },
      }),
    ]);
    if (products > 0)
      throw new appError(
        `المحل فيه ${products} منتج: أرشفهم الأول (أو اخفي المحل بـ isActive=false)`,
        409,
        'STORE_HAS_PRODUCTS',
        { productsCount: products },
      );
    if (categories > 0)
      throw new appError(
        `المحل هو "بيتجاب من" الافتراضي لـ ${categories} قسم: غيّره الأول`,
        409,
        'STORE_IN_USE',
        { categoriesCount: categories },
      );
    await prisma.store.update({
      where: { id },
      data: { archivedAt: new Date(), isActive: false },
    });
  },

  async restore(id: string) {
    const cur = await getOrThrow(id);
    await assertNameFree(cur.name, id);
    const store = await prisma.store.update({
      where: { id },
      data: { archivedAt: null, isActive: true },
      include: withCount,
    });
    return toStoreDto(store);
  },
};
