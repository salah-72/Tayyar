import * as z from 'zod';
import { idParams } from '../../common/utils/idParam';

const fields = z.object({
  name: z.string().trim().min(2, { message: 'اسم البلد قصير' }).max(60),
  feeMinor: z.number().int().min(0).max(10_000_00),
  sortOrder: z.number().int().min(0).max(100_000),
  isActive: z.boolean(),
});

export const createAreaValidation = fields
  .pick({ name: true, feeMinor: true })
  .extend({
    sortOrder: fields.shape.sortOrder.optional(),
    isActive: fields.shape.isActive.optional(),
  });

export const updateAreaValidation = fields
  .partial()
  .refine((o) => Object.keys(o).length > 0, {
    message: 'ابعت حقل واحد على الأقل للتعديل',
  });

export const listAreasQuery = z.object({
  archived: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export const areaIdParams = idParams;

export type CreateAreaInput = z.infer<typeof createAreaValidation>;
export type UpdateAreaInput = z.infer<typeof updateAreaValidation>;
export type ListAreasQuery = z.infer<typeof listAreasQuery>;
