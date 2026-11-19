import { Prisma } from '@prisma/client';
import appError from '../../common/utils/appError';
import { pageMeta, paginate } from '../../common/utils/pagination';
import { toWaNumber } from '../../common/utils/phone';
import { dayRange } from '../../common/utils/timezone';
import env from '../../config/env';
import { prisma } from '../../config/postgres';
import { pricingProductInclude } from '../Catalog/catalogService';
import { priceCart } from '../Pricing/pricingEngine';
import {
  isDiscountLive,
  toPricingDiscount,
  toPricingProduct,
} from '../Pricing/pricingAdapters';
import { PricingError } from '../Pricing/pricingTypes';
import type {
  CartLine,
  PricingDiscount,
  PricingProduct,
  PricingResult,
} from '../Pricing/pricingTypes';
import { settingsService } from '../Settings/settingsService';
import {
  buildWhatsappMessage,
  canTransition,
  parseOrderNumber,
  statusTimestamps,
  toAdminOrderDto,
  toCustomerOrderDto,
  toOrderListItem,
  toQuoteDto,
  toStatusCounts,
  whatsappUrl,
} from './ordersHelpers';
import type { OrderStatusValue } from './ordersHelpers';
import type {
  CreateOrderInput,
  ListOrdersQuery,
  QuoteInput,
  UpdateOrderInput,
  UpdateStatusInput,
} from './ordersValidation';

/** أقصى عدد أوردرات لنفس رقم الموبايل في الساعة (بيمنع الأوردرات الوهمية المتكررة) */
const MAX_ORDERS_PER_PHONE_PER_HOUR = 5;

const notFound = () => new appError('الأوردر مش موجود', 404, 'ORDER_NOT_FOUND');

/** أخطاء التسعير (صنف مش متاح، كمية غلط…) بترجع 422 بكود ثابت للـ frontend */
const asHttp = (e: unknown): never => {
  if (e instanceof PricingError)
    throw new appError(
      e.message,
      422,
      e.code,
      e.productId ? { productId: e.productId } : undefined,
    );
  throw e;
};

type Db = Prisma.TransactionClient;

interface PricedCart {
  result: PricingResult;
  area: { id: string; name: string; feeMinor: number } | null;
}

/**
 * التسعير الفعلي: بيقرا من الداتابيز كل حاجة (المنتجات، البلد، الخصومات) ويشغّل نفس محرك التسعير.
 * السيرفر هو مصدر الأسعار الوحيد، الأرقام اللي في المتصفح ما بتتصدّقش.
 */
async function priceFromDb(
  db: Db,
  input: { lines: CartLine[]; areaId?: string; discountCode?: string },
  now: Date,
): Promise<PricedCart> {
  const settings = await settingsService.getRow();

  let area: PricedCart['area'] = null;
  if (input.areaId) {
    area = await db.area.findFirst({
      where: { id: input.areaId, isActive: true, archivedAt: null },
      select: { id: true, name: true, feeMinor: true },
    });
    if (!area)
      throw new appError('البلد دي مش متاحة للتوصيل', 422, 'AREA_UNAVAILABLE');
  }

  const productIds = [
    ...new Set(
      input.lines.flatMap((l) => (l.type === 'product' ? [l.productId] : [])),
    ),
  ];
  const rows = productIds.length
    ? await db.product.findMany({
        where: { id: { in: productIds } },
        include: pricingProductInclude,
      })
    : [];
  const products = new Map<string, PricingProduct>(
    rows.map((r) => [r.id, toPricingProduct(r)]),
  );

  const automatic = await db.discount.findMany({
    where: { code: null, isActive: true },
  });
  const candidates: PricingDiscount[] = automatic
    .filter((d) => isDiscountLive(d, now))
    .map(toPricingDiscount);

  let codeDiscount: PricingDiscount | null = null;
  if (input.discountCode) {
    const d = await db.discount.findFirst({
      where: { code: { equals: input.discountCode, mode: 'insensitive' } },
    });
    if (!d || !isDiscountLive(d, now))
      throw new appError(
        'كود الخصم غير صحيح أو منتهي',
        422,
        'INVALID_DISCOUNT_CODE',
      );
    codeDiscount = toPricingDiscount(d);
    candidates.push(codeDiscount);
  }

  let result: PricingResult;
  try {
    result = priceCart({
      lines: input.lines,
      products,
      settings: {
        freeDeliveryThresholdMinor: settings.freeDeliveryThresholdMinor,
      },
      discounts: candidates,
      areaFeeMinor: area?.feeMinor ?? 0,
    });
  } catch (e) {
    return asHttp(e);
  }

  if (codeDiscount && result.subtotalMinor < codeDiscount.minSubtotalMinor)
    throw new appError(
      'الكود ده بيشتغل على أوردر أكبر من كده',
      422,
      'DISCOUNT_MIN_SUBTOTAL',
      { minSubtotalMinor: codeDiscount.minSubtotalMinor },
    );

  return { result, area };
}

const orderInclude = {
  items: { orderBy: { id: 'asc' } },
} satisfies Prisma.OrderInclude;

async function customerResponse(
  order: Parameters<typeof toCustomerOrderDto>[0],
) {
  const settings = await settingsService.getRow();
  const dto = toCustomerOrderDto(order);
  const text = buildWhatsappMessage({
    storeName: settings.storeName,
    order: dto,
  });
  return {
    order: dto,
    whatsapp: {
      text,
      url: whatsappUrl(toWaNumber(settings.whatsappNumber), text),
    },
  };
}

const isUniqueViolation = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';

export const ordersService = {
  async quote(input: QuoteInput) {
    const settings = await settingsService.getRow();
    const { result } = await priceFromDb(prisma, input, new Date());
    return {
      ...toQuoteDto(result, !!input.areaId),
      acceptingOrders: settings.acceptingOrders,
    };
  },

  async create(input: CreateOrderInput) {
    const existing = await prisma.order.findUnique({
      where: { clientToken: input.clientToken },
      include: orderInclude,
    });
    if (existing)
      return { ...(await customerResponse(existing)), duplicate: true };

    const settings = await settingsService.getRow();
    if (!settings.acceptingOrders)
      throw new appError(
        'المتجر مش بيستقبل أوردرات دلوقتي',
        503,
        'ORDERS_CLOSED',
      );

    const recentFromPhone = await prisma.order.count({
      where: {
        customerPhone: input.customerPhone,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (recentFromPhone >= MAX_ORDERS_PER_PHONE_PER_HOUR)
      throw new appError(
        'الرقم ده عمل طلبات كتير في آخر ساعة، كلمنا على واتساب لو محتاج حاجة',
        429,
        'TOO_MANY_ORDERS',
      );

    try {
      const order = await prisma.$transaction(async (tx) => {
        const now = new Date();
        const { result, area } = await priceFromDb(tx, input, now);

        if (result.discountId) {
          const d = await tx.discount.findUnique({
            where: { id: result.discountId },
            select: { maxUses: true },
          });
          const used = await tx.discount.updateMany({
            where:
              d?.maxUses == null
                ? { id: result.discountId }
                : { id: result.discountId, usedCount: { lt: d.maxUses } },
            data: { usedCount: { increment: 1 } },
          });
          if (used.count === 0)
            throw new appError(
              'الخصم ده خلصت استخداماته',
              422,
              'DISCOUNT_EXHAUSTED',
            );
        }

        return tx.order.create({
          data: {
            clientToken: input.clientToken,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            areaId: area!.id,
            areaName: area!.name,
            addressDetails: input.addressDetails,
            notes: input.notes ?? null,
            subtotalMinor: result.subtotalMinor,
            invoiceDiscountMinor: result.invoiceDiscountMinor,
            serviceFeeMinor: result.serviceFeeMinor,
            discountId: result.discountId,
            discountLabel: result.discountLabel,
            deliveryFeeMinor: result.deliveryFeeMinor,
            freeDeliveryApplied: result.freeDeliveryApplied,
            totalMinor: result.totalMinor,
            isEstimated: result.isEstimated,
            needsPricing: result.needsPricing,
            items: {
              create: result.items.map((i) => ({
                productId: i.productId,
                isCustom: i.isCustom,
                name: i.name,
                unit: i.unit as Prisma.OrderItemCreateWithoutOrderInput['unit'],
                saleMode: i.saleMode,
                quantity: i.quantity,
                weightPerUnit: i.weightPerUnit,
                listUnitPriceMinor: i.listUnitPriceMinor,
                unitPriceMinor: i.unitPriceMinor,
                options: i.options.length
                  ? (i.options as unknown as Prisma.InputJsonValue)
                  : undefined,
                lineTotalMinor: i.lineTotalMinor,
                note: i.note,
                categoryName: i.categoryName,
                storeId: i.storeId,
                storeName: i.storeName,
                menuSection: i.menuSection,
                commissionBps: i.commissionBps,
                serviceFeeMinor: i.serviceFeeMinor,
              })),
            },
          },
          include: orderInclude,
        });
      });
      return { ...(await customerResponse(order)), duplicate: false };
    } catch (e) {
      if (isUniqueViolation(e)) {
        const again = await prisma.order.findUnique({
          where: { clientToken: input.clientToken },
          include: orderInclude,
        });
        if (again)
          return { ...(await customerResponse(again)), duplicate: true };
      }
      throw e;
    }
  },

  async list(q: ListOrdersQuery) {
    const where: Prisma.OrderWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.areaId) where.areaId = q.areaId;

    if (q.from || q.to) {
      const range: Prisma.DateTimeFilter = {};
      if (q.from) range.gte = dayRange(q.from, env.TIMEZONE).from;
      if (q.to) range.lt = dayRange(q.to, env.TIMEZONE).to;
      where.createdAt = range;
    }

    if (q.q) {
      const number = parseOrderNumber(q.q);
      where.OR = [
        ...(number !== null ? [{ number }] : []),
        { customerName: { contains: q.q, mode: 'insensitive' as const } },
        { customerPhone: { contains: q.q } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { items: true } } },
        ...paginate(q.page, q.limit),
      }),
      prisma.order.count({ where }),
    ]);
    return {
      orders: rows.map(toOrderListItem),
      meta: pageMeta(q.page, q.limit, total),
    };
  },

  async counts() {
    const rows = await prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    return toStatusCounts(rows);
  },

  async get(id: string) {
    const o = await prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!o) throw notFound();
    return {
      ...toAdminOrderDto(o),
      customerWhatsappUrl: `https://wa.me/${toWaNumber(o.customerPhone)}`,
    };
  },

  async updateStatus(id: string, input: UpdateStatusInput) {
    const to = input.status as OrderStatusValue;

    await prisma.$transaction(async (tx) => {
      const cur = await tx.order.findUnique({
        where: { id },
        select: { status: true, discountId: true },
      });
      if (!cur) throw notFound();
      if (!canTransition(cur.status, to))
        throw new appError(
          `مينفعش تنقل الأوردر من ${cur.status} إلى ${to}`,
          409,
          'INVALID_TRANSITION',
          { from: cur.status, to },
        );

      const upd = await tx.order.updateMany({
        where: { id, status: cur.status },
        data: {
          status: to,
          ...statusTimestamps(to, new Date()),
          ...(to === 'CANCELLED' ? { cancelReason: input.cancelReason } : {}),
        },
      });
      if (upd.count === 0)
        throw new appError(
          'الأوردر اتغيّرت حالته من حد تاني، حدّث الصفحة',
          409,
          'ORDER_CHANGED',
        );

      if (to === 'CANCELLED' && cur.discountId)
        await tx.discount.updateMany({
          where: { id: cur.discountId, usedCount: { gt: 0 } },
          data: { usedCount: { decrement: 1 } },
        });
    });

    return ordersService.get(id);
  },

  async update(id: string, patch: UpdateOrderInput) {
    const r = await prisma.order.updateMany({
      where: { id },
      data: { adminNote: patch.adminNote },
    });
    if (r.count === 0) throw notFound();
    return ordersService.get(id);
  },
};
