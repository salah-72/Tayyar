import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Loader2, PencilLine, ShoppingCart, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { catalogQuery, useCatalog } from "@/lib/catalog";
import { cart, useCart, useCartReady, type CartLine } from "@/lib/cart";
import { badProductId, itemForLine, useQuote } from "@/lib/quote";
import { formatMoney, formatQty } from "@/lib/money";
import { stepQty } from "@/lib/pricing";
import { isApproxProduct, useApprox } from "@/lib/approx";
import { StoreLayout } from "@/components/store/StoreLayout";
import { CustomItemRequest } from "@/components/store/CustomItemRequest";
import { ProductImage } from "@/components/store/ProductImage";
import { QtyStepper } from "@/components/store/QtyStepper";
import { PricingSummary } from "@/components/store/PricingSummary";
import { ApproxBadge } from "@/components/store/ApproxBadge";
import { Progress } from "@/components/ui/progress";
import type { QuoteItem } from "@/lib/api/types";

export const Route = createFileRoute("/cart")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  head: () => ({
    meta: [
      { title: "سلة التسوق — البيه الطيار" },
      { name: "description", content: "راجع طلبك وكمّل الأوردر، والطيار يوصلك لحد البيت." },
      { property: "og:title", content: "سلة التسوق — البيه الطيار" },
      { property: "og:description", content: "راجع طلبك وكمّل الأوردر." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const c = useCatalog();
  const { lines } = useCart();
  const ready = useCartReady();
  const quote = useQuote(lines);
  const approx = useApprox();
  const anyApprox = quote.data ? approx.any(quote.data.items) : false;
  const bad = badProductId(quote.error);
  const threshold = c.settings.freeDeliveryThresholdMinor;
  const subtotal = quote.data ? quote.data.pricing.subtotalMinor - quote.data.pricing.invoiceDiscountMinor : 0;
  const remaining = Math.max(0, threshold - subtotal);

  function removeWithUndo(line: CartLine, index: number, name: string) {
    cart.remove(line.key);
    toast(`اتشال «${name}» من السلة`, { action: { label: "تراجع", onClick: () => cart.restore(line, index) } });
  }

  // Until the saved cart is read from localStorage, don't claim it is empty.
  if (!ready) {
    return (
      <StoreLayout>
        <Header />
        <div className="grid place-items-center py-24">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      </StoreLayout>
    );
  }

  if (lines.length === 0) {
    return (
      <StoreLayout>
        <Header />
        <div className="mx-4 mt-10 flex flex-col items-center rounded-3xl bg-card px-6 py-14 text-center shadow-card md:mx-6">
          <div className="grid size-20 place-items-center rounded-full bg-primary-soft text-primary">
            <ShoppingCart className="size-9" />
          </div>
          <p className="mt-4 text-lg font-bold">سلتك فاضية</p>
          <p className="mt-1 text-sm text-muted-foreground">ابدأ ضيف منتجات من الأقسام</p>
          <Link to="/categories" className="mt-5 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
            تصفح الأقسام
          </Link>
        </div>
        <div className="mx-4 mt-4 md:mx-6">
          <CustomItemRequest />
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <Header showClear />
      <div className="grid gap-4 px-4 md:px-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {threshold > 0 && quote.data && (
            <div className="rounded-2xl bg-highlight-soft p-4 text-highlight-foreground">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Truck className="size-5 shrink-0" />
                {remaining > 0 ? `أضف ${formatMoney(remaining)} وخد التوصيل مجاني` : "مبروك! التوصيل عليك مجاني 🎉"}
              </div>
              <Progress value={Math.min(100, (subtotal / threshold) * 100)} className="mt-3 h-2 bg-card [&>div]:bg-primary" />
            </div>
          )}

          {quote.error && (
            <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-3.5 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{quote.error.message}</span>
            </div>
          )}

          {lines.map((line, i) => (
            <CartRow
              key={line.key}
              line={line}
              item={itemForLine(quote.data, line)}
              pending={quote.isPlaceholderData}
              invalid={line.type === "product" && line.productId === bad}
              onRemove={(name) => removeWithUndo(line, i, name)}
            />
          ))}

          <CustomItemRequest />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-2xl bg-card p-5 shadow-card">
            <h2 className="mb-4 font-bold">ملخص الطلب</h2>
            {quote.data ? <PricingSummary pricing={quote.data.pricing} isEstimated={anyApprox} needsPricing={quote.data.needsPricing} /> : <Loader2 className="mx-auto animate-spin text-muted-foreground" />}
            <CheckoutButton disabled={!quote.data || !!quote.error} className="mt-5 w-full" />
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t bg-card/95 px-4 py-3 shadow-float backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{lines.length} منتجات</p>
            <p className="text-lg font-bold tabular-nums text-primary-deep">
              {quote.isFetching && !quote.data ? "..." : quote.data ? (anyApprox ? "≈ " : "") + formatMoney(quote.data.pricing.subtotalMinor - quote.data.pricing.invoiceDiscountMinor + quote.data.pricing.serviceFeeMinor) : "—"}
            </p>
          </div>
          <CheckoutButton disabled={!quote.data || !!quote.error} className="flex-1" />
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </StoreLayout>
  );
}

function CheckoutButton({ disabled, className }: { disabled: boolean; className?: string }) {
  return disabled ? (
    <span className={`grid h-12 place-items-center rounded-xl bg-muted font-semibold text-muted-foreground ${className}`}>إتمام الطلب</span>
  ) : (
    <Link to="/checkout" className={`grid h-12 place-items-center rounded-xl bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary-deep ${className}`}>
      إتمام الطلب
    </Link>
  );
}

function Header({ showClear }: { showClear?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 pb-4 pt-6 md:px-6">
      <h1 className="text-2xl font-bold">سلة التسوق</h1>
      {showClear && (
        <button
          onClick={() => {
            const snapshot = cart.get().lines;
            cart.clear();
            toast("السلة اتفضت", { action: { label: "تراجع", onClick: () => snapshot.forEach((l, i) => cart.restore(l, i)) } });
          }}
          className="flex items-center gap-1.5 text-sm font-semibold text-sale"
        >
          <Trash2 className="size-4" /> إفراغ السلة
        </button>
      )}
    </div>
  );
}

function CartRow({
  line,
  item,
  pending,
  invalid,
  onRemove,
}: {
  line: CartLine;
  item?: QuoteItem;
  /** the item may be from before the latest cart change; dim the numbers until the new quote lands */
  pending: boolean;
  invalid: boolean;
  onRemove: (name: string) => void;
}) {
  const c = useCatalog();
  if (line.type === "custom") {
    return (
      <div className="flex gap-3 rounded-2xl bg-card p-3 shadow-card">
        <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-highlight-soft text-highlight-foreground">
          <PencilLine className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{line.text}</p>
          {line.note && <p className="text-xs text-muted-foreground">{line.note}</p>}
          <p className="mt-1 text-xs text-highlight-foreground">السعر بعد الشراء</p>
        </div>
        <button onClick={() => onRemove(line.text)} aria-label="شيل" className="self-start p-1 text-sale">
          <Trash2 className="size-4" />
        </button>
      </div>
    );
  }
  const p = c.products.find((x) => x.id === line.productId);
  const name = p?.name ?? item?.name ?? "منتج";
  const catIndex = p ? c.categories.findIndex((x) => x.id === p.categoryId) : 0;
  const extra = [
    line.weightPerUnit ? `${formatQty(line.weightPerUnit)} كيلو للقطعة` : null,
    ...(item?.options.map((o) => o.optionName) ?? []),
  ].filter(Boolean);

  return (
    <div className={`flex gap-3 rounded-2xl bg-card p-3 shadow-card ${invalid ? "ring-2 ring-destructive" : ""}`}>
      <div className="size-20 shrink-0 overflow-hidden rounded-xl">
        <ProductImage src={p?.thumbUrl ?? p?.imageUrl} alt={name} slug={p?.storeId ? "restaurant" : c.categories[catIndex]?.slug} toneIndex={Math.max(0, catIndex)} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="line-clamp-2 font-semibold leading-snug">{name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {item?.unitPriceMinor != null ? `${formatMoney(item.unitPriceMinor)} / ${p?.saleMode === "WEIGHT" ? p.unitLabel : p?.unitLabel ?? "وحدة"}` : null}
          {extra.length ? ` · ${extra.join("، ")}` : ""}
        </p>
        {!p && <p className="mt-1 text-xs text-destructive">المنتج ده مش متاح تاني</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          {p ? (
            <QtyStepper
              size="sm"
              value={line.quantity}
              unitLabel={p.saleMode === "WEIGHT" ? p.unitLabel : undefined}
              canTrash={line.quantity - p.qtyStep < p.minQty}
              onInc={() => cart.setQuantity(line.key, stepQty(p, line.quantity, 1))}
              onDec={() => {
                const next = stepQty(p, line.quantity, -1);
                if (next <= 0) onRemove(name);
                else cart.setQuantity(line.key, next);
              }}
              className="w-32"
            />
          ) : (
            <button onClick={() => onRemove(name)} className="text-sm font-semibold text-sale">شيله</button>
          )}
          <div className={`text-end transition-opacity ${pending ? "opacity-50" : ""}`}>
            {item && item.lineDiscountMinor > 0 && item.lineTotalMinor != null && (
              <p className="text-xs text-muted-foreground line-through tabular-nums">{formatMoney(item.lineTotalMinor + item.lineDiscountMinor)}</p>
            )}
            <p className="font-bold tabular-nums text-primary-deep">{item ? (p && isApproxProduct(p) ? "≈ " : "") + formatMoney(item.lineTotalMinor) : "..."}</p>
            {p && isApproxProduct(p) && <ApproxBadge className="mt-0.5" />}
          </div>
        </div>
      </div>
    </div>
  );
}
