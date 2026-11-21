import { ShoppingCart } from "lucide-react";
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
    : `وفّر ${formatMoney(p.discount.value, { currency: false })} ج`;
}

export function PriceTag({ p, className }: { p: CatalogProduct; className?: string }) {
  // "13 ج / كيلو": الوحدة جنب السعر علَى طول بدل سطر لوحدها
  const per = p.saleMode === "PIECE_WEIGHT" ? null : `/ ${p.unitLabel}`;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-1.5", className)}>
      {p.price.startsFrom && <span className="text-[11px] text-muted-foreground">يبدأ من</span>}
      <span data-price className="text-base font-bold text-primary-deep tabular-nums">
        {formatMoney(p.price.finalMinor, { currency: false })}
        <span className="ms-0.5 text-xs font-semibold">جـ</span>
      </span>
      {per && <span className="text-[11px] text-muted-foreground">{per}</span>}
      {p.price.hasDiscount && (
        <span className="text-[13px] text-muted-foreground tabular-nums line-through decoration-1 decoration-muted-foreground/60">
          {formatMoney(p.price.listMinor, { currency: false })}
        </span>
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
  const line = simple
    ? (lines.find((l) => l.key === key) as CartProductLine | undefined)
    : undefined;
  const inCart = quantityInCart(lines, p.id);
  const badge = discountLabel(p);

  return (
    <div
      className={cn(
        "group flex flex-col rounded-2xl border border-border bg-[oklch(0.955_0.012_145)] p-2",
        className,
      )}
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => productSheet.open(p.id)}
          className="block aspect-square w-full overflow-hidden rounded-xl bg-card"
          aria-label={`تفاصيل ${p.name}`}
        >
          <ProductImage
            src={p.thumbUrl ?? p.imageUrl}
            alt={p.name}
            slug={slug}
            toneIndex={toneIndex}
            className={cn(
              "transition-transform duration-300 group-hover:scale-105",
              !p.available && "opacity-40 grayscale",
            )}
          />
        </button>
        {badge && (
          <span className="absolute start-1.5 top-1.5 rounded-full bg-sale px-2 py-0.5 text-[11px] font-bold text-sale-foreground">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-0.5 pt-1.5">
        <button type="button" onClick={() => productSheet.open(p.id)} className="text-start">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {p.name}
          </h3>
        </button>
        <PriceTag p={p} className="mt-auto pt-1" />
      </div>
      <div className="mt-2">
        {!p.available ? (
          <div className="grid h-9 place-items-center rounded-xl bg-muted text-xs font-semibold text-muted-foreground">
            مش متاح دلوقتي
          </div>
        ) : line ? (
          <QtyStepper
            size="sm"
            className="w-full"
            value={line.quantity}
            unitLabel={p.saleMode === "WEIGHT" ? p.unitLabel : undefined}
            canTrash={line.quantity - p.qtyStep < p.minQty}
            onInc={() => cart.setQuantity(key, stepQty(p, line.quantity, 1))}
            onDec={() => cart.setQuantity(key, stepQty(p, line.quantity, -1))}
          />
        ) : (
          <button
            type="button"
            aria-label={`أضف ${p.name} للسلة`}
            onClick={() =>
              simple
                ? cart.addProduct({ productId: p.id, quantity: p.minQty })
                : productSheet.open(p.id)
            }
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-deep active:scale-[0.98]"
          >
            <ShoppingCart className="size-4" aria-hidden />
            {inCart > 0 ? "أضف تاني" : "أضف للسلة"}
          </button>
        )}
      </div>
    </div>
  );
}
