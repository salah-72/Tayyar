import { Plus, Check } from "lucide-react";
import type { CatalogProduct } from "@/lib/api/types";
import { cart, lineKey, quantityInCart, useCart, type CartProductLine } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { needsChoices, stepQty } from "@/lib/pricing";
import { isApproxProduct } from "@/lib/approx";
import { cn } from "@/lib/utils";
import { ApproxBadge } from "./ApproxBadge";
import { ProductImage } from "./ProductImage";
import { QtyStepper } from "./QtyStepper";
import { productSheet } from "./product-sheet-store";

export function discountLabel(p: CatalogProduct) {
  if (!p.discount) return null;
  return p.discount.kind === "PERCENT"
    ? `خصم ${p.discount.value / 100}%`
    : `وفّر ${formatMoney(p.discount.value)}`;
}

export function PriceTag({ p, className }: { p: CatalogProduct; className?: string }) {
  const per =
    p.saleMode === "WEIGHT" ? `/ ${p.unitLabel}` : p.saleMode === "UNIT" ? null : null;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-1.5", className)}>
      {p.price.startsFrom && <span className="text-[11px] text-muted-foreground">يبدأ من</span>}
      <span className="text-base font-bold text-primary-deep tabular-nums">{formatMoney(p.price.finalMinor)}</span>
      {per && <span className="text-[11px] text-muted-foreground">{per}</span>}
      {p.price.hasDiscount && (
        <span className="text-xs text-muted-foreground line-through tabular-nums">{formatMoney(p.price.listMinor)}</span>
      )}
      {isApproxProduct(p) && <ApproxBadge />}
    </div>
  );
}

export function ProductCard({
  p,
  slug,
  toneIndex,
  className,
}: {
  p: CatalogProduct;
  slug?: string;
  toneIndex?: number;
  className?: string;
}) {
  const { lines } = useCart();
  const simple = !needsChoices(p);
  const key = lineKey(p.id);
  const line = simple ? (lines.find((l) => l.key === key) as CartProductLine | undefined) : undefined;
  const inCart = quantityInCart(lines, p.id);
  const badge = discountLabel(p);

  return (
    <div className={cn("group relative flex flex-col overflow-hidden rounded-2xl bg-card p-2.5 shadow-card", className)}>
      {badge && (
        <span className="absolute start-2.5 top-2.5 z-10 rounded-full bg-sale px-2 py-0.5 text-[11px] font-bold text-sale-foreground">
          {badge}
        </span>
      )}
      <button
        type="button"
        onClick={() => productSheet.open(p.id)}
        className="block aspect-square w-full overflow-hidden rounded-xl"
        aria-label={`تفاصيل ${p.name}`}
      >
        <ProductImage
          src={p.thumbUrl ?? p.imageUrl}
          alt={p.name}
          slug={slug}
          toneIndex={toneIndex}
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </button>
      <div className="flex flex-1 flex-col px-0.5 pt-2.5">
        <button type="button" onClick={() => productSheet.open(p.id)} className="text-start">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{p.name}</h3>
        </button>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {p.saleMode === "WEIGHT" ? `بال${p.unitLabel}` : p.unitLabel}
        </p>
        <PriceTag p={p} className="mt-auto pt-2" />
        <div className="mt-2">
          {!p.available ? (
            <div className="grid h-10 place-items-center rounded-xl bg-muted text-sm text-muted-foreground">مش متاح دلوقتي</div>
          ) : line ? (
            <QtyStepper
              value={line.quantity}
              unitLabel={p.saleMode === "WEIGHT" ? p.unitLabel : undefined}
              canTrash={line.quantity - p.qtyStep < p.minQty}
              onInc={() => cart.setQuantity(key, stepQty(p, line.quantity, 1))}
              onDec={() => cart.setQuantity(key, stepQty(p, line.quantity, -1))}
            />
          ) : (
            <button
              type="button"
              onClick={() =>
                simple ? cart.addProduct({ productId: p.id, quantity: p.minQty }) : productSheet.open(p.id)
              }
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-deep active:scale-[0.98]"
            >
              {inCart > 0 ? <Check className="size-4" /> : <Plus className="size-4" />}
              {inCart > 0 ? "زوّد تاني" : "أضف"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
