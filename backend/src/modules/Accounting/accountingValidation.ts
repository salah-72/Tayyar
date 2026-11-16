import * as z from 'zod';
import { cuid, idParams } from '../../common/utils/idParam';
import { daysBetween } from './accountingHelpers';

const MAX_RANGE_DAYS = 93;

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'التاريخ لازم يكون YYYY-MM-DD')
  .refine((s) => new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s, {
    message: 'التاريخ غير صحيح',
  });

export const dayListQuery = z.object({ date: date.optional() });

export const storeRangeQuery = z
  .object({ from: date, to: date })
  .refine((o) => o.from <= o.to, {
    message: 'تاريخ البداية بعد النهاية',
    path: ['from'],
  })
  .refine((o) => o.from > o.to || daysBetween(o.from, o.to) <= MAX_RANGE_DAYS, {
    message: `الفترة لازم تكون ${MAX_RANGE_DAYS} يوم بالكتير`,
    path: ['to'],
  });

export const storeParams = z.object({ storeId: cuid });
export const settlementParams = idParams;

export const settleValidation = z.object({
  storeId: cuid,
  date,
  note: z.string().trim().max(300).optional(),
});

export type DayListQuery = z.infer<typeof dayListQuery>;
export type StoreRangeQuery = z.infer<typeof storeRangeQuery>;
export type SettleInput = z.infer<typeof settleValidation>;
