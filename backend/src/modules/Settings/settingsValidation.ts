import * as z from 'zod';
import { isValidWhatsapp, normalizeWhatsapp } from './settingsHelpers';

const whatsapp = z
  .string()
  .trim()
  .transform(normalizeWhatsapp)
  .refine(isValidWhatsapp, { message: 'رقم الواتساب غير صحيح' });

export const updateSettingsValidation = z
  .object({
    storeName: z
      .string()
      .trim()
      .min(1, { message: 'اسم المتجر مطلوب' })
      .max(80),
    tagline: z.string().trim().max(150).nullable(),
    logoUrl: z
      .string()
      .trim()
      .url({ message: 'رابط اللوجو غير صحيح' })
      .max(500)
      .nullable(),
    whatsappNumber: whatsapp,
    freeDeliveryThresholdMinor: z.number().int().min(0).max(100_000_000),
    serviceFeePerStoreMinor: z.number().int().min(0).max(1_000_000),
    acceptingOrders: z.boolean(),
  })
  .partial()
  .refine((o) => Object.keys(o).length > 0, {
    message: 'ابعت حقل واحد على الأقل للتعديل',
  });

export type UpdateSettingsInput = z.infer<typeof updateSettingsValidation>;
