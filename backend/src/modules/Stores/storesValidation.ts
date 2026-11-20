import * as z from 'zod';
import { idParams } from '../../common/utils/idParam';
import { SLUG_REGEX } from '../../common/utils/slug';

const typeEnum = z.enum(['SUPPLIER', 'RESTAURANT']);

const fields = z.object({
  name: z.string().trim().min(2, { message: 'اسم المحل قصير' }).max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(60)
    .regex(SLUG_REGEX, {
      message: 'الـ slug حروف إنجليزي صغيرة وأرقام وشرطات بس',
    }),
  sortOrder: z.number().int().min(0).max(100_000),
  isActive: z.boolean(),
});

export const createStoreValidation = fields.pick({ name: true }).extend({
  type: typeEnum,
  slug: fields.shape.slug.optional(),
  sortOrder: fields.shape.sortOrder.optional(),
  isActive: fields.shape.isActive.optional(),
});

export const updateStoreValidation = fields
  .partial()
  .refine((o) => Object.keys(o).length > 0, {
    message: 'ابعت حقل واحد على الأقل للتعديل',
  });

const bool = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true')
  .optional();

export const listStoresQuery = z.object({
  type: typeEnum.optional(),
  archived: bool,
  q: z.string().trim().max(80).optional(),
});

export const storeIdParams = idParams;

export type CreateStoreInput = z.infer<typeof createStoreValidation>;
export type UpdateStoreInput = z.infer<typeof updateStoreValidation>;
export type ListStoresQuery = z.infer<typeof listStoresQuery>;
