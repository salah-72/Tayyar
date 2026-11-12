export type Unit = string;
export type SaleMode = 'UNIT' | 'WEIGHT' | 'PIECE_WEIGHT';
export type DiscountKind = 'PERCENT' | 'FIXED' | 'NONE';
export type OptionPricing = 'PER_KG' | 'PER_UNIT' | 'FLAT';

export interface PricingOption {
  id: string;
  name: string;
  pricing: OptionPricing;
  priceMinor: number;
}

export interface PricingOptionGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  options: PricingOption[];
}

export interface PricingProduct {
  id: string;
  name: string;
  unit: Unit;
  saleMode: SaleMode;
  priceMinor: number;
  minQty: number;
  qtyStep: number;
  weightChoices: number[];
  discountKind: DiscountKind | null;
  discountValue: number | null;
  categoryDiscountKind: DiscountKind | null;
  categoryDiscountValue: number | null;
  available: boolean;
  categoryName: string | null;
  storeId: string | null;
  storeName: string | null;
  menuSection: string | null;
  commissionBps: number | null;
  optionGroups: PricingOptionGroup[];
}

export interface PricingSettings {
  freeDeliveryThresholdMinor: number;
}

export interface PricingDiscount {
  id: string;
  name: string;
  kind: 'PERCENT' | 'FIXED';
  value: number;
  minSubtotalMinor: number;
  maxDiscountMinor: number | null;
}

export interface ProductLine {
  type: 'product';
  productId: string;
  quantity: number;
  weightPerUnit?: number;
  optionIds?: string[];
}

export interface CustomLine {
  type: 'custom';
  text: string;
  note?: string;
}

export type CartLine = ProductLine | CustomLine;

export interface PricedOption {
  groupName: string;
  optionName: string;
  pricing: OptionPricing;
  priceMinor: number;
  amountMinor: number;
}

export interface PricedItem {
  productId: string | null;
  isCustom: boolean;
  name: string;
  unit: Unit | null;
  saleMode: SaleMode;
  quantity: number;
  weightPerUnit: number | null;
  listUnitPriceMinor: number | null;
  unitPriceMinor: number | null;
  options: PricedOption[];
  lineTotalMinor: number | null;
  lineDiscountMinor: number;
  note: string | null;
  categoryName: string | null;
  storeId: string | null;
  storeName: string | null;
  menuSection: string | null;
  commissionBps: number | null;
}

export interface PricingInput {
  lines: CartLine[];
  products: Map<string, PricingProduct>;
  settings: PricingSettings;
  discounts: PricingDiscount[];
  areaFeeMinor: number;
}

export interface PricingResult {
  items: PricedItem[];
  grossMinor: number;
  productDiscountMinor: number;
  subtotalMinor: number;
  invoiceDiscountMinor: number;
  discountId: string | null;
  discountLabel: string | null;
  freeDeliveryApplied: boolean;
  deliveryFeeMinor: number;
  totalMinor: number;
  isEstimated: boolean;
  needsPricing: boolean;
}

export class PricingError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly productId?: string,
  ) {
    super(message);
  }
}
