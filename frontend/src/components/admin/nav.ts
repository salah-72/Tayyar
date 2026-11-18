import {
  BadgePercent,
  Calculator,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  MapPin,
  Package,
  ReceiptText,
  Settings,
  ShoppingBasket,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  to:
    | "/admin"
    | "/admin/orders"
    | "/admin/purchases"
    | "/admin/accounting"
    | "/admin/products"
    | "/admin/categories"
    | "/admin/stores"
    | "/admin/option-groups"
    | "/admin/areas"
    | "/admin/discounts"
    | "/admin/settings"
    | "/admin/admins";
  label: string;
  icon: LucideIcon;
};

export const ADMIN_NAV: { title: string; items: AdminNavItem[] }[] = [
  {
    title: "التشغيل",
    items: [
      { to: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
      { to: "/admin/orders", label: "الأوردرات", icon: ReceiptText },
      { to: "/admin/purchases", label: "قايمة الشراء", icon: ShoppingBasket },
      { to: "/admin/accounting", label: "حسابات المطاعم", icon: Calculator },
    ],
  },
  {
    title: "الكتالوج",
    items: [
      { to: "/admin/products", label: "المنتجات", icon: Package },
      { to: "/admin/categories", label: "الأقسام", icon: LayoutGrid },
      { to: "/admin/stores", label: "المحلات والمطاعم", icon: Store },
      { to: "/admin/option-groups", label: "خيارات التجهيز", icon: ListChecks },
    ],
  },
  {
    title: "الإعدادات",
    items: [
      { to: "/admin/areas", label: "البلاد والتوصيل", icon: MapPin },
      { to: "/admin/discounts", label: "خصومات الفاتورة", icon: BadgePercent },
      { to: "/admin/settings", label: "إعدادات المتجر", icon: Settings },
      { to: "/admin/admins", label: "المشرفين", icon: Users },
    ],
  },
];
