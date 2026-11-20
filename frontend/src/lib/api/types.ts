// Shapes returned by the Tayyar backend (see /api-docs). Money = integer piasters.

export type SaleMode = "UNIT" | "WEIGHT" | "PIECE_WEIGHT";
export type OptionPricing = "PER_KG" | "PER_UNIT" | "FLAT";
export type DiscountKind = "PERCENT" | "FIXED" | "NONE";
/** Kinds that actually reduce a price. NONE only means "this item/category opts out of discounts". */
export type ActiveDiscountKind = Exclude<DiscountKind, "NONE">;
export type OrderStatus = "PENDING" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

export interface StoreSettings {
  storeName: string;
  tagline: string | null;
  logoUrl: string | null;
  whatsappNumber: string;
  freeDeliveryThresholdMinor: number;
  /** رسوم الخدمة: مبلغ ثابت (بالقرش) على كل محل مختلف في الأوردر. 0 = متعطّلة */
  serviceFeePerStoreMinor: number;
  acceptingOrders: boolean;
}

export interface CatalogArea {
  id: string;
  name: string;
  feeMinor: number;
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  thumbUrl: string | null;
  discountKind: DiscountKind | null;
  discountValue: number | null;
}

export interface CatalogStore {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  thumbUrl: string | null;
  sections: string[];
}

export interface CatalogOption {
  id: string;
  name: string;
  pricing: OptionPricing;
  priceMinor: number;
}

export interface CatalogOptionGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  options: CatalogOption[];
}

export interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  thumbUrl: string | null;
  categoryId: string | null;
  storeId: string | null;
  menuSection: string | null;
  unit: string;
  unitLabel: string;
  saleMode: SaleMode;
  minQty: number;
  qtyStep: number;
  weightChoices: number[];
  price: { listMinor: number; finalMinor: number; hasDiscount: boolean; startsFrom: boolean };
  discount: { kind: ActiveDiscountKind; value: number; source: "product" | "category" } | null;
  isFeatured: boolean;
  available: boolean;
  optionGroups: CatalogOptionGroup[];
}

export interface CatalogDiscount {
  name: string;
  kind: ActiveDiscountKind;
  value: number;
  minSubtotalMinor: number;
  maxDiscountMinor: number | null;
}

export interface Catalog {
  settings: StoreSettings;
  areas: CatalogArea[];
  categories: CatalogCategory[];
  stores: CatalogStore[];
  products: CatalogProduct[];
  discounts: CatalogDiscount[];
  generatedAt: string;
}

export type CartLinePayload =
  | { type: "product"; productId: string; quantity: number; weightPerUnit?: number; optionIds?: string[] }
  | { type: "custom"; text: string; note?: string };

export interface OrderOption {
  groupName: string;
  optionName: string;
  pricing: OptionPricing;
  priceMinor: number;
  amountMinor: number;
}

export interface OrderPricing {
  grossMinor: number;
  productDiscountMinor: number;
  subtotalMinor: number;
  invoiceDiscountMinor: number;
  discountLabel: string | null;
  serviceFeeMinor: number;
  /** اسم بند الرسوم من السيرفر، مثلًا «رسوم الخدمة (3 × 10 ج)» */
  serviceFeeLabel?: string;
  deliveryFeeMinor: number | null;
  freeDeliveryApplied: boolean;
  totalMinor: number;
}

export interface QuoteItem {
  productId: string | null;
  isCustom: boolean;
  name: string;
  quantity: number;
  listUnitPriceMinor: number | null;
  unitPriceMinor: number | null;
  options: OrderOption[];
  lineTotalMinor: number | null;
  lineDiscountMinor: number;
  serviceFeeMinor: number;
}

export interface Quote {
  items: QuoteItem[];
  pricing: OrderPricing;
  isEstimated: boolean;
  needsPricing: boolean;
  acceptingOrders: boolean;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  isCustom: boolean;
  name: string;
  unit: string | null;
  unitLabel: string;
  saleMode: string;
  quantity: number;
  weightPerUnit: number | null;
  listUnitPriceMinor: number | null;
  unitPriceMinor: number | null;
  options: OrderOption[];
  lineTotalMinor: number | null;
  serviceFeeMinor: number;
  serviceFeeBps: number | null;
  note: string | null;
}

export interface CustomerOrder {
  id: string;
  number: number;
  status: OrderStatus;
  createdAt: string;
  customer: { name: string; phone: string };
  area: string;
  addressDetails: string;
  notes: string | null;
  items: OrderItem[];
  pricing: OrderPricing;
  isEstimated: boolean;
  needsPricing: boolean;
}

export interface CreateOrderResult {
  order: CustomerOrder;
  whatsapp: { text: string; url: string };
  duplicate: boolean;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AdminUser {
  id: number;
  username: string;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "جديد",
  PREPARING: "بيتجهّز",
  OUT_FOR_DELIVERY: "في الطريق",
  DELIVERED: "اتسلّم",
  CANCELLED: "ملغي",
};
