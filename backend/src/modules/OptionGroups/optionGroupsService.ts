import type { Prisma } from '@prisma/client';
import appError from '../../common/utils/appError';
import { uniqueSlug } from '../../common/utils/slug';
import { prisma } from '../../config/postgres';
import {
  groupRuleError,
  hasDuplicateNames,
  toGroupDto,
  toOptionDto,
} from './optionGroupsHelpers';
import type {
  CreateGroupInput,
  CreateOptionInput,
  ListGroupsQuery,
  UpdateGroupInput,
  UpdateOptionInput,
} from './optionGroupsValidation';

const include = {
  options: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
  _count: { select: { products: true } },
} satisfies Prisma.OptionGroupInclude;

const groupNotFound = () =>
  new appError('مجموعة الخيارات مش موجودة', 404, 'OPTION_GROUP_NOT_FOUND');
const optionNotFound = () =>
  new appError('الخيار مش موجود', 404, 'OPTION_NOT_FOUND');

async function getGroupOrThrow(id: string) {
  const g = await prisma.optionGroup.findUnique({ where: { id } });
  if (!g) throw groupNotFound();
  return g;
}

async function getOptionOrThrow(groupId: string, optionId: string) {
  const o = await prisma.option.findFirst({ where: { id: optionId, groupId } });
  if (!o) throw optionNotFound();
  return o;
}

async function assertGroupNameFree(name: string, exceptId?: string) {
  const same = await prisma.optionGroup.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { id: true },
  });
  if (same)
    throw new appError('فيه مجموعة بنفس الاسم', 409, 'OPTION_GROUP_NAME_TAKEN');
}

async function assertSlugFree(slug: string, exceptId?: string) {
  const same = await prisma.optionGroup.findUnique({ where: { slug } });
  if (same && same.id !== exceptId)
    throw new appError('الـ slug مستخدم', 409, 'OPTION_GROUP_SLUG_TAKEN');
}

async function assertOptionNameFree(
  groupId: string,
  name: string,
  exceptId?: string,
) {
  const same = await prisma.option.findFirst({
    where: {
      groupId,
      name: { equals: name, mode: 'insensitive' },
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { id: true },
  });
  if (same)
    throw new appError(
      'فيه خيار بنفس الاسم في المجموعة',
      409,
      'OPTION_NAME_TAKEN',
    );
}

const ruleError = (msg: string) =>
  new appError(msg, 422, 'INVALID_OPTION_GROUP');

async function assertStillSatisfiable(
  group: { minSelect: number; maxSelect: number; isActive: boolean },
  activeAfter: number,
) {
  const err = groupRuleError(
    group.minSelect,
    group.maxSelect,
    activeAfter,
    group.isActive,
  );
  if (err) throw new appError(err, 409, 'OPTIONS_BELOW_MIN');
}

export const optionGroupsService = {
  async list(q: ListGroupsQuery) {
    const rows = await prisma.optionGroup.findMany({
      where: {
        isActive: q.active,
        ...(q.q ? { name: { contains: q.q, mode: 'insensitive' } } : {}),
      },
      include,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toGroupDto);
  },

  async get(id: string) {
    const g = await prisma.optionGroup.findUnique({ where: { id }, include });
    if (!g) throw groupNotFound();
    return toGroupDto(g);
  },

  async create(b: CreateGroupInput) {
    await assertGroupNameFree(b.name);

    const options = b.options ?? [];
    if (hasDuplicateNames(options.map((o) => o.name)))
      throw ruleError('فيه خيارات بنفس الاسم');

    const minSelect = b.minSelect ?? 0;
    const maxSelect = b.maxSelect ?? 1;
    const activeCount = options.filter((o) => o.isActive !== false).length;
    const err = groupRuleError(
      minSelect,
      maxSelect,
      activeCount,
      b.isActive ?? true,
    );
    if (err) throw ruleError(err);

    let slug: string;
    if (b.slug) {
      await assertSlugFree(b.slug);
      slug = b.slug;
    } else {
      slug = await uniqueSlug(
        b.name,
        'opt',
        async (s) =>
          !!(await prisma.optionGroup.findUnique({ where: { slug: s } })),
      );
    }

    const g = await prisma.optionGroup.create({
      data: {
        name: b.name,
        slug,
        minSelect,
        maxSelect,
        sortOrder: b.sortOrder ?? 0,
        isActive: b.isActive ?? true,
        options: {
          create: options.map((o, i) => ({
            name: o.name,
            pricing: o.pricing,
            priceMinor: o.priceMinor,
            sortOrder: o.sortOrder ?? i,
            isActive: o.isActive ?? true,
          })),
        },
      },
      include,
    });
    return toGroupDto(g);
  },

  async update(id: string, patch: UpdateGroupInput) {
    const cur = await getGroupOrThrow(id);
    if (patch.name) await assertGroupNameFree(patch.name, id);
    if (patch.slug) await assertSlugFree(patch.slug, id);

    const touchesRules =
      patch.minSelect !== undefined ||
      patch.maxSelect !== undefined ||
      patch.isActive !== undefined;
    if (touchesRules) {
      const activeCount = await prisma.option.count({
        where: { groupId: id, isActive: true },
      });
      const err = groupRuleError(
        patch.minSelect ?? cur.minSelect,
        patch.maxSelect ?? cur.maxSelect,
        activeCount,
        patch.isActive ?? cur.isActive,
      );
      if (err) throw ruleError(err);
    }

    const g = await prisma.optionGroup.update({
      where: { id },
      data: patch,
      include,
    });
    return toGroupDto(g);
  },

  async remove(id: string) {
    await getGroupOrThrow(id);
    const products = await prisma.product.count({
      where: { optionGroups: { some: { id } } },
    });
    if (products > 0)
      throw new appError(
        `المجموعة مربوطة بـ ${products} منتج: فكّها منهم الأول (أو عطّلها بـ isActive=false)`,
        409,
        'OPTION_GROUP_IN_USE',
        { productsCount: products },
      );
    await prisma.optionGroup.delete({ where: { id } });
  },

  async addOption(groupId: string, b: CreateOptionInput) {
    await getGroupOrThrow(groupId);
    await assertOptionNameFree(groupId, b.name);
    const sortOrder =
      b.sortOrder ?? (await prisma.option.count({ where: { groupId } }));
    const o = await prisma.option.create({
      data: {
        groupId,
        name: b.name,
        pricing: b.pricing,
        priceMinor: b.priceMinor,
        sortOrder,
        isActive: b.isActive ?? true,
      },
    });
    return toOptionDto(o);
  },

  async updateOption(
    groupId: string,
    optionId: string,
    patch: UpdateOptionInput,
  ) {
    const group = await getGroupOrThrow(groupId);
    const cur = await getOptionOrThrow(groupId, optionId);
    if (patch.name) await assertOptionNameFree(groupId, patch.name, optionId);

    if (patch.isActive === false && cur.isActive) {
      const active = await prisma.option.count({
        where: { groupId, isActive: true },
      });
      await assertStillSatisfiable(group, active - 1);
    }
    return toOptionDto(
      await prisma.option.update({ where: { id: optionId }, data: patch }),
    );
  },

  async removeOption(groupId: string, optionId: string) {
    const group = await getGroupOrThrow(groupId);
    const cur = await getOptionOrThrow(groupId, optionId);
    if (cur.isActive) {
      const active = await prisma.option.count({
        where: { groupId, isActive: true },
      });
      await assertStillSatisfiable(group, active - 1);
    }
    await prisma.option.delete({ where: { id: optionId } });
  },
};
