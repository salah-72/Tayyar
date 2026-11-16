import * as z from 'zod';
import { idParams } from '../../common/utils/idParam';

const kindEnum = z.enum(['PERCENT', 'FIXED']);

const code = z
  .string()
  .trim()
  .transform((v) => v.toUpperCase())
  .refine((v) => /^[A-Z0-9_-]{3,20}$/.test(v), {
    message: 'الكود 3-20 حرف إنجليزي أو رقم (يسمح بـ - و _)',
  });

const dateTime = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), { message: 'التاريخ غير صحيح' })
  .transform((s) => new Date(s));

const fields = z.object({
  name: z.string().trim().min(2, { message: 'اسم الخصم قصير' }).max(80),
  code: code.nullable(),
  kind: kindEnum,
  value: z.number().int().min(1).max(100_000_000),
  minSubtotalMinor: z.number().int().min(0).max(100_000_000),
  maxDiscountMinor: z.number().int().min(1).max(100_000_000).nullable(),
  isActive: z.boolean(),
  startsAt: dateTime.nullable(),
  endsAt: dateTime.nullable(),
  maxUses: z.number().int().min(1).max(10_000_000).nullable(),
});

export const createDiscountValidation = fields
  .pick({ name: true, kind: true, value: true })
  .extend(fields.omit({ name: true, kind: true, value: true }).partial().shape);

export const updateDiscountValidation = fields
  .partial()
  .refine((o) => Object.keys(o).length > 0, {
    message: 'ابعت حقل واحد على الأقل للتعديل',
  });

export const listDiscountsQuery = z.object({
  type: z.enum(['CODE', 'AUTOMATIC']).optional(),
  status: z
    .enum(['LIVE', 'DISABLED', 'SCHEDULED', 'EXPIRED', 'EXHAUSTED'])
    .optional(),
});

export const discountIdParams = idParams;

export type CreateDiscountInput = z.infer<typeof createDiscountValidation>;
export type UpdateDiscountInput = z.infer<typeof updateDiscountValidation>;
export type ListDiscountsQuery = z.infer<typeof listDiscountsQuery>;
