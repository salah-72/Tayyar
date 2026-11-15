import * as z from 'zod';
import { cuid, idParams } from '../../common/utils/idParam';
import { paginationQuery } from '../../common/utils/pagination';
import { normalizePhone } from '../../common/utils/phone';
import { ORDER_STATUSES, isEgyptianMobile } from './ordersHelpers';

const statusEnum = z.enum(ORDER_STATUSES);

const productLine = z.object({
  type: z.literal('product'),
  productId: cuid,
  quantity: z.number().positive().max(1000),
  weightPerUnit: z.number().positive().max(20).optional(),
  optionIds: z.array(cuid).max(20).optional(),
});

const customLine = z.object({
  type: z.literal('custom'),
  text: z.string().trim().min(2, { message: 'اكتب اسم الصنف' }).max(200),
  note: z.string().trim().max(200).optional(),
});

const lines = z
  .array(z.discriminatedUnion('type', [productLine, customLine]))
  .min(1, { message: 'السلة فاضية' })
  .max(60, { message: 'السلة كبيرة أوي' });

const discountCode = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .transform((v) => v.toUpperCase());

export const quoteValidation = z.object({
  lines,
  areaId: cuid.optional(),
  discountCode: discountCode.optional(),
});

const phone = z
  .string()
  .transform(normalizePhone)
  .refine(isEgyptianMobile, {
    message: 'رقم الموبايل غير صحيح (مثال: 01012345678)',
  });

export const createOrderValidation = z.object({
  clientToken: z
    .string()
    .regex(/^[A-Za-z0-9_-]{16,64}$/, 'clientToken غير صحيح'),
  customerName: z.string().trim().min(2, { message: 'اكتب الاسم' }).max(80),
  customerPhone: phone,
  areaId: cuid,
  addressDetails: z
    .string()
    .trim()
    .min(5, { message: 'اكتب العنوان بالتفصيل' })
    .max(300),
  notes: z.string().trim().max(500).optional(),
  lines,
  discountCode: discountCode.optional(),
});

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'التاريخ لازم يكون YYYY-MM-DD');

export const listOrdersQuery = paginationQuery.extend({
  status: statusEnum.optional(),
  q: z.string().trim().max(80).optional(),
  areaId: cuid.optional(),
  from: date.optional(),
  to: date.optional(),
});

export const orderIdParams = idParams;

export const updateStatusValidation = z
  .object({
    status: statusEnum,
    cancelReason: z.string().trim().min(2).max(300).optional(),
  })
  .refine((o) => o.status !== 'CANCELLED' || !!o.cancelReason, {
    message: 'اكتب سبب الإلغاء',
    path: ['cancelReason'],
  });

export const updateOrderValidation = z.object({
  adminNote: z.string().trim().max(500).nullable(),
});

export type QuoteInput = z.infer<typeof quoteValidation>;
export type CreateOrderInput = z.infer<typeof createOrderValidation>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuery>;
export type UpdateStatusInput = z.infer<typeof updateStatusValidation>;
export type UpdateOrderInput = z.infer<typeof updateOrderValidation>;
