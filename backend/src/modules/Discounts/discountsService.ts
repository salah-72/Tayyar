import { Prisma } from '@prisma/client';
import appError from '../../common/utils/appError';
import { prisma } from '../../config/postgres';
import {
  discountRuleError,
  normalizeDiscountState,
  toDiscountDto,
} from './discountsHelpers';
import type { DiscountState, RuleError } from './discountsHelpers';
import type {
  CreateDiscountInput,
  ListDiscountsQuery,
  UpdateDiscountInput,
} from './discountsValidation';

const notFound = () =>
  new appError('الخصم مش موجود', 404, 'DISCOUNT_NOT_FOUND');
const invalid = (e: RuleError) => new appError(e.message, 422, e.code);

async function getOrThrow(id: string) {
  const d = await prisma.discount.findUnique({ where: { id } });
  if (!d) throw notFound();
  return d;
}

async function assertCodeFree(code: string, exceptId?: string) {
  const same = await prisma.discount.findUnique({ where: { code } });
  if (same && same.id !== exceptId)
    throw new appError(
      'الكود ده مستخدم في خصم تاني',
      409,
      'DISCOUNT_CODE_TAKEN',
    );
}

const isUniqueViolation = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';

export const discountsService = {
  async list(q: ListDiscountsQuery) {
    const now = new Date();
    const rows = await prisma.discount.findMany({
      where: q.type
        ? { code: q.type === 'CODE' ? { not: null } : null }
        : undefined,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
    const dtos = rows.map((r) => toDiscountDto(r, now));
    return q.status ? dtos.filter((d) => d.status === q.status) : dtos;
  },

  async get(id: string) {
    const d = await getOrThrow(id);
    const agg = await prisma.order.aggregate({
      where: { discountId: id, status: { not: 'CANCELLED' } },
      _count: { _all: true },
      _sum: { invoiceDiscountMinor: true },
    });
    return {
      ...toDiscountDto(d, new Date()),
      stats: {
        ordersCount: agg._count._all,
        totalDiscountMinor: agg._sum.invoiceDiscountMinor ?? 0,
      },
    };
  },

  async create(b: CreateDiscountInput) {
    const state = normalizeDiscountState<DiscountState>({
      kind: b.kind,
      value: b.value,
      minSubtotalMinor: b.minSubtotalMinor ?? 0,
      maxDiscountMinor: b.maxDiscountMinor ?? null,
      startsAt: b.startsAt ?? null,
      endsAt: b.endsAt ?? null,
      maxUses: b.maxUses ?? null,
    });
    const err = discountRuleError(state);
    if (err) throw invalid(err);
    if (b.code) await assertCodeFree(b.code);

    try {
      const d = await prisma.discount.create({
        data: {
          name: b.name,
          code: b.code ?? null,
          isActive: b.isActive ?? true,
          ...state,
        },
      });
      return toDiscountDto(d, new Date());
    } catch (e) {
      if (isUniqueViolation(e))
        throw new appError(
          'الكود ده مستخدم في خصم تاني',
          409,
          'DISCOUNT_CODE_TAKEN',
        );
      throw e;
    }
  },

  async update(id: string, patch: UpdateDiscountInput) {
    const cur = await getOrThrow(id);
    const state = normalizeDiscountState<DiscountState>({
      kind: patch.kind ?? (cur.kind as 'PERCENT' | 'FIXED'),
      value: patch.value ?? cur.value,
      minSubtotalMinor: patch.minSubtotalMinor ?? cur.minSubtotalMinor,
      maxDiscountMinor:
        patch.maxDiscountMinor !== undefined
          ? patch.maxDiscountMinor
          : cur.maxDiscountMinor,
      startsAt: patch.startsAt !== undefined ? patch.startsAt : cur.startsAt,
      endsAt: patch.endsAt !== undefined ? patch.endsAt : cur.endsAt,
      maxUses: patch.maxUses !== undefined ? patch.maxUses : cur.maxUses,
    });
    const err = discountRuleError(state, cur.usedCount);
    if (err) throw invalid(err);
    if (patch.code) await assertCodeFree(patch.code, id);

    try {
      const d = await prisma.discount.update({
        where: { id },
        data: {
          ...(patch.name !== undefined && { name: patch.name }),
          ...(patch.code !== undefined && { code: patch.code }),
          ...(patch.isActive !== undefined && { isActive: patch.isActive }),
          ...state,
        },
      });
      return toDiscountDto(d, new Date());
    } catch (e) {
      if (isUniqueViolation(e))
        throw new appError(
          'الكود ده مستخدم في خصم تاني',
          409,
          'DISCOUNT_CODE_TAKEN',
        );
      throw e;
    }
  },

  async remove(id: string) {
    await getOrThrow(id);
    const used = await prisma.order.count({ where: { discountId: id } });
    if (used > 0)
      throw new appError(
        `الخصم اتستخدم في ${used} أوردر، مينفعش يتحذف. أوقفه بدل الحذف`,
        409,
        'DISCOUNT_IN_USE',
        { ordersCount: used },
      );
    await prisma.discount.delete({ where: { id } });
  },
};
