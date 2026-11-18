import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Home, LayoutGrid, ShoppingCart } from "lucide-react";
import { useCartCount } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { ProductSheetHost } from "./ProductSheet";

export function StoreLayout({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className="min-h-screen bg-background">
      <div className={cn("mx-auto w-full max-w-6xl", hideNav ? "pb-8" : "pb-28")}>{children}</div>
      {!hideNav && <BottomNav />}
      <ProductSheetHost />
    </div>
  );
}

const NAV = [
  { to: "/", label: "الرئيسية", icon: Home, exact: true },
  { to: "/categories", label: "الأقسام", icon: LayoutGrid, exact: false },
  { to: "/cart", label: "السلة", icon: ShoppingCart, exact: false },
] as const;

function BottomNav() {
  const count = useCartCount();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 shadow-float backdrop-blur pb-safe">
      <div className="mx-auto grid h-16 max-w-md grid-cols-3 px-4">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.exact }}
            className="group flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground"
            activeProps={{ className: "is-active text-primary" }}
          >
            <span className="relative grid h-8 w-14 place-items-center rounded-full transition-colors group-[.is-active]:bg-primary-soft">
              <item.icon className="size-5" />
              {item.to === "/cart" && count > 0 && (
                <span className="absolute -top-1 end-1.5 grid min-w-5 place-items-center rounded-full bg-sale px-1 text-[10px] font-bold leading-5 text-sale-foreground">
                  {count}
                </span>
              )}
            </span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function CartButton() {
  const count = useCartCount();
  return (
    <Link to="/cart" aria-label="السلة" className="relative grid size-11 place-items-center rounded-full bg-card shadow-card">
      <ShoppingCart className="size-5 text-foreground" />
      {count > 0 && (
        <span className="absolute -top-1 -end-1 grid min-w-5 place-items-center rounded-full bg-sale px-1 text-[10px] font-bold leading-5 text-sale-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}
