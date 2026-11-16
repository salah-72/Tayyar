import * as z from 'zod';
import { cuid } from '../../common/utils/idParam';

const bool = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true')
  .optional();

export const shoppingListQuery = z.object({
  status: z
    .enum(['PENDING', 'PREPARING', 'OUT_FOR_DELIVERY'])
    .default('PREPARING'),
  storeId: z.union([cuid, z.literal('none')]).optional(),
  hidePurchased: bool,
});

export const markPurchasedValidation = z
  .object({
    itemIds: z.array(cuid).min(1).max(200),
    purchased: z.boolean(),
    actualCostMinor: z
      .number()
      .int()
      .min(0)
      .max(100_000_000)
      .nullable()
      .optional(),
  })
  .refine((o) => o.purchased || o.actualCostMinor == null, {
    message: 'التكلفة بتتسجّل مع "اشتريت" بس',
    path: ['actualCostMinor'],
  });

export type ShoppingListQuery = z.infer<typeof shoppingListQuery>;
export type MarkPurchasedInput = z.infer<typeof markPurchasedValidation>;
