export const UNIT_LABEL: Record<string, string> = {
  KG: 'كيلو',
  PIECE: 'قطعة',
  PACK: 'عبوة',
  BUNCH: 'ربطة',
  STRIP: 'شريط',
  BOX: 'علبة',
  INJECTION: 'حقنة',
  BOTTLE: 'زجاجة',
  SACHET: 'كيس',
  DISH: 'طبق',
  TRAY: 'كرتونة',
  LITER: 'لتر',
};

export const unitLabel = (u: string | null | undefined): string => (u ? (UNIT_LABEL[u] ?? '') : '');
