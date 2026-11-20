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
    <div className={cn("group flex flex-col rounded-2xl border bg-card p-2", className)}>
      <div className="relative">
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
            className={cn("transition-transform duration-300 group-hover:scale-105", !p.available && "opacity-40 grayscale")}
          />
        </button>
        {badge && (
          <span className="absolute start-1.5 top-1.5 rounded-full bg-sale px-2 py-0.5 text-[11px] font-bold text-sale-foreground">
            {badge}
          </span>
        )}
        {!p.available ? (
          <span className="absolute inset-x-1.5 bottom-1.5 rounded-lg bg-card/90 py-1 text-center text-xs font-semibold text-muted-foreground">
            مش متاح دلوقتي
          </span>
        ) : line ? (
          <QtyStepper
            size="sm"
            className="absolute bottom-1.5 end-1.5 shadow-card"
            value={line.quantity}
            unitLabel={p.saleMode === "WEIGHT" ? p.unitLabel : undefined}
            canTrash={line.quantity - p.qtyStep < p.minQty}
            onInc={() => cart.setQuantity(key, stepQty(p, line.quantity, 1))}
            onDec={() => cart.setQuantity(key, stepQty(p, line.quantity, -1))}
          />
        ) : (
          <button
            type="button"
            aria-label={inCart > 0 ? `زوّد ${p.name} تاني` : `أضف ${p.name}`}
            onClick={() => (simple ? cart.addProduct({ productId: p.id, quantity: p.minQty }) : productSheet.open(p.id))}
            className="absolute bottom-1.5 end-1.5 grid size-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-card transition-colors hover:bg-primary-deep active:scale-95"
          >
            {inCart > 0 ? <Check className="size-5" /> : <Plus className="size-5" />}
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col px-0.5 pt-2">
        <button type="button" onClick={() => productSheet.open(p.id)} className="text-start">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-foreground">{p.name}</h3>
        </button>
        <p className="text-xs text-muted-foreground">{p.saleMode === "WEIGHT" ? `بال${p.unitLabel}` : p.unitLabel}</p>
        <PriceTag p={p} className="mt-auto pt-1.5" />
      </div>
    </div>
  );
}
