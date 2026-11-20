import { toWaNumber } from '../../common/utils/phone';

export const normalizeWhatsapp = (raw: string): string => toWaNumber(raw);

export const isValidWhatsapp = (n: string): boolean => /^\d{11,15}$/.test(n);

interface SettingsRow {
  storeName: string;
  tagline: string | null;
  logoUrl: string | null;
  whatsappNumber: string;
  freeDeliveryThresholdMinor: number;
  serviceFeePerStoreMinor: number;
  acceptingOrders: boolean;
}

export const toSettingsDto = (s: SettingsRow) => ({
  storeName: s.storeName,
  tagline: s.tagline,
  logoUrl: s.logoUrl,
  whatsappNumber: s.whatsappNumber,
  freeDeliveryThresholdMinor: s.freeDeliveryThresholdMinor,
  serviceFeePerStoreMinor: s.serviceFeePerStoreMinor,
  acceptingOrders: s.acceptingOrders,
});
