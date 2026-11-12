import appError from '../../common/utils/appError';
import { prisma } from '../../config/postgres';
import { toSettingsDto } from './settingsHelpers';
import type { UpdateSettingsInput } from './settingsValidation';

const ID = 1;

export const settingsService = {
  async getRow() {
    const row = await prisma.settings.findUnique({ where: { id: ID } });
    if (!row)
      throw new appError(
        'إعدادات المتجر لسه متضبطتش',
        503,
        'SETTINGS_NOT_INITIALIZED',
      );
    return row;
  },

  async get() {
    return toSettingsDto(await settingsService.getRow());
  },

  async update(patch: UpdateSettingsInput) {
    const existing = await prisma.settings.findUnique({
      where: { id: ID },
      select: { id: true },
    });
    if (!existing && !patch.whatsappNumber)
      throw new appError(
        'أول مرة لازم تحدد رقم الواتساب',
        422,
        'WHATSAPP_REQUIRED',
      );

    const row = existing
      ? await prisma.settings.update({ where: { id: ID }, data: patch })
      : await prisma.settings.create({
          data: { id: ID, ...patch, whatsappNumber: patch.whatsappNumber! },
        });
    return toSettingsDto(row);
  },
};
