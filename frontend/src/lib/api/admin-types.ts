import type { OptionPricing, OrderItem, OrderStatus, SaleMode, CustomerOrder } from "./types";

export type AdminDiscountKind = "PERCENT" | "FIXED" | "NONE" | null;

export interface OrderRow {
  id: string;
  number: number;
  status: OrderStatus;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  area: string;
  itemsCount: number;
  totalMinor: number;
  isEstimated: boolean;
  needsPricing: boolean;
  adminNote: string | null;
  nextStatuses: OrderStatus[];
}

export interface AdminOrderItem extends OrderItem {
  categoryName: string | null;
  storeId: string | null;
  storeName: string | null;
  menuSection: string | null;
  commissionBps: number | null;
  purchased: boolean;
  purchasedAt: string | null;
  actualCostMinor: number | null;
}

export interface AdminOrder extends Omit<CustomerOrder, "items"> {
  areaId: string | null;
  discountId: string | null;
  adminNote: string | null;
  cancelReason: string | null;
  timeline: {
    createdAt: string;
    confirmedAt: string | null;
    outForDeliveryAt: string | null;
    deliveredAt: string | null;
    cancelledAt: string | null;
  };
  nextStatuses: OrderStatus[];
  customerWhatsappUrl: string;
  items: AdminOrderItem[];
}

export type PurchaseState = "NONE" | "PARTIAL" | "ALL";
export interface PurchaseLine {
  key: string;
  isCustom: boolean;
  productId: string | null;
  name: string;
  unitLabel: string;
  saleMode: string;
  weightPerUnit: number | null;
  options: string[];
  categoryName: string | null;
  menuSection: string | null;
  quantity: number;
  quantityText: string;
  note: string | null;
  estimatedMinor: number;
  actualCostMinor: number | null;
  state: PurchaseState;
  itemIds: string[];
  orders: { orderId: string; number: number; customerName: string; area: string; quantity: number }[];
}
export interface PurchaseStore {
  storeId: string | null;
  storeName: string;
  lines: PurchaseLine[];
  itemsCount: number;
  purchasedCount: number;
  state: PurchaseState;
  estimatedMinor: number;
  actualCostMinor: number;
  text: string;
}
export interface ShoppingList {
  status: string;
  stores: PurchaseStore[];
  totals: { itemsCount: number; purchasedCount: number; state: PurchaseState; estimatedMinor: number; actualCostMinor: number };
}

export type SettlementState = "OPEN" | "SETTLED" | "CHANGED";
export interface Settlement {
  id: string;
  date: string;
  salesMinor: number;
  serviceFeeMinor: number;
  settledAt: string | null;
  note: string | null;
}
export interface DayRow {
  date: string;
  salesMinor: number;
  serviceFeeMinor: number;
  ordersCount: number;
  itemsCount: number;
  state: SettlementState;
  settlement: Settlement | null;
}
export interface DayAccount {
  date: string;
  stores: (DayRow & { storeId: string; storeName: string; serviceFeeBps: number })[];
  totals: { salesMinor: number; serviceFeeMinor: number; ordersCount: number; openCount: number };
}
export interface StoreRange {
  store: { id: string; name: string; serviceFeeBps: number };
  from: string;
  to: string;
  days: DayRow[];
  totals: { salesMinor: number; serviceFeeMinor: number; ordersCount: number; unsettledSalesMinor: number };
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  imageUrl: string | null;
  archivedAt: string | null;
  discountKind: AdminDiscountKind;
  discountValue: number | null;
  defaultStoreId: string | null;
}

export interface AdminStore {
  id: string;
  name: string;
  slug: string;
  type: "SUPPLIER" | "RESTAURANT";
  sortOrder: number;
  isActive: boolean;
  imageUrl: string | null;
  archivedAt: string | null;
  commissionBps: number;
  productsCount: number;
}

export interface AdminOption {
  id: string;
  groupId: string;
  name: string;
  pricing: OptionPricing;
  priceMinor: number;
  sortOrder: number;
  isActive: boolean;
}

export interface AdminOptionGroup {
  id: string;
  name: string;
  slug: string;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  isActive: boolean;
  productsCount: number;
  options: AdminOption[];
}

export interface AdminProduct {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  archivedAt: string | null;
  categoryId: string | null;
  categoryName: string | null;
  storeId: string | null;
  storeName: string | null;
  storeType: AdminStore["type"] | null;
  menuSection: string | null;
  unit: string;
  saleMode: SaleMode;
  priceMinor: number;
  minQty: number;
  qtyStep: number;
  weightChoices: number[];
  discountKind: AdminDiscountKind;
  discountValue: number | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  optionGroups: { id: string; name: string }[];
}

export interface AdminArea {
  id: string;
  name: string;
  feeMinor: number;
  sortOrder: number;
  isActive: boolean;
  archivedAt: string | null;
}

export type DiscountStatus = "LIVE" | "DISABLED" | "SCHEDULED" | "EXPIRED" | "EXHAUSTED";
export interface AdminDiscount {
  id: string;
  name: string;
  type: "CODE" | "AUTOMATIC";
  code: string | null;
  kind: "PERCENT" | "FIXED";
  value: number;
  minSubtotalMinor: number;
  maxDiscountMinor: number | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  maxUses: number | null;
  usedCount: number;
  remainingUses: number | null;
  status: DiscountStatus;
  stats?: { ordersCount: number; totalDiscountMinor: number };
}

export const UNITS: { value: string; label: string }[] = [
  { value: "KG", label: "كيلو" },
  { value: "PIECE", label: "قطعة" },
  { value: "PACK", label: "عبوة" },
  { value: "BUNCH", label: "ربطة" },
  { value: "STRIP", label: "شريط" },
  { value: "BOX", label: "علبة" },
  { value: "INJECTION", label: "حقنة" },
  { value: "BOTTLE", label: "زجاجة" },
  { value: "SACHET", label: "كيس" },
  { value: "DISH", label: "طبق" },
  { value: "TRAY", label: "كرتونة" },
  { value: "LITER", label: "لتر" },
];
export const unitLabel = (u: string) => UNITS.find((x) => x.value === u)?.label ?? u;

export const SALE_MODES: { value: SaleMode; label: string; hint: string }[] = [
  { value: "UNIT", label: "بالعدد", hint: "عبوة، طبق، قطعة… السعر للوحدة" },
  { value: "WEIGHT", label: "بالوزن", hint: "كيلو أو لتر، السعر للكيلو" },
  { value: "PIECE_WEIGHT", label: "قطعة بوزن", hint: "زي الفرخة: العميل يختار وزن القطعة، السعر للكيلو" },
];

export const PRICING_LABEL: Record<OptionPricing, string> = {
  FLAT: "سعر ثابت للبند",
  PER_UNIT: "لكل وحدة",
  PER_KG: "لكل كيلو",
};
