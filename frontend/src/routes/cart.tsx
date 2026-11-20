import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  PencilLine,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
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
  const subtotal = quote.data
    ? quote.data.pricing.subtotalMinor - quote.data.pricing.invoiceDiscountMinor
    : 0;
  const remaining = Math.max(0, threshold - subtotal);

  function removeWithUndo(line: CartLine, index: number, name: string) {
    cart.remove(line.key);
    toast(`اتشال «${name}» من السلة`, {
      action: { label: "تراجع", onClick: () => cart.restore(line, index) },
    });
  }

  if (!ready) {
    return (
      <StoreLayout>
        <Header />
        <div className="grid place-items-center py-24">
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>
      </StoreLayout>
    );
  }

  if (lines.length === 0) {
    return (
      <StoreLayout>
        <Header />
        <div className="mx-4 mt-6 flex flex-col items-center rounded-3xl border border-border/70 bg-card px-6 py-14 text-center shadow-sm md:mx-6">
          <div className="grid size-20 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ShoppingCart className="size-9" strokeWidth={1.6} />
          </div>
          <p className="mt-4 text-lg font-extrabold tracking-tight">سلتك فاضية دلوقتي</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            ابدأ ضيف منتجات من الأقسام أو اطلب أي حاجة محتاجها في طلب مخصص.
          </p>
          <Link
            to="/categories"
            className="mt-6 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
          >
            تصفح الأقسام
          </Link>
        </div>

        <div className="mx-4 mt-4 pb-8 md:mx-6">
          <CustomItemRequest />
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <Header showClear count={lines.length} />

      <div className="grid gap-5 px-4 pb-8 md:px-6 lg:grid-cols-[1fr_370px] lg:items-start">
        {/* Cart Items & Banners */}
        <div className="space-y-3.5">
          {threshold > 0 && quote.data && (
            <div className="rounded-2xl border border-highlight-foreground/15 bg-highlight-soft/90 p-4 text-highlight-foreground shadow-2xs">
              <div className="flex items-center justify-between gap-2 text-sm font-bold">
                <div className="flex items-center gap-2">
                  {remaining > 0 ? (
                    <Truck className="size-5 shrink-0 text-primary" />
                  ) : (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                  )}
                  <span>
                    {remaining > 0
                      ? `أضف ${formatMoney(remaining)} وخد التوصيل مجاني`
                      : "مبروك! التوصيل عليك مجاني"}
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-background/70 px-2.5 py-0.5 text-xs font-semibold tabular-nums">
                  {Math.min(100, Math.round((subtotal / threshold) * 100))}%
                </span>
              </div>
              <Progress
                value={Math.min(100, (subtotal / threshold) * 100)}
                className="mt-3 h-2 rounded-full bg-background/70 [&>div]:rounded-full [&>div]:bg-primary [&>div]:transition-all [&>div]:duration-300"
              />
            </div>
          )}

          {quote.error && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
              <AlertTriangle className="mt-0.5 size-4.5 shrink-0" />
              <span>{quote.error.message}</span>
            </div>
          )}

          <div className="space-y-3">
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
          </div>

          <div className="pt-1">
            <CustomItemRequest />
          </div>
        </div>

        {/* Desktop Order Summary */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
              <h2 className="text-base font-extrabold tracking-tight">ملخص الطلب</h2>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {lines.length} {lines.length === 1 ? "عنصر" : "عناصر"}
              </span>
            </div>

            <div className="mt-4">
              {quote.data ? (
                <PricingSummary
                  pricing={quote.data.pricing}
                  isEstimated={anyApprox}
                  needsPricing={quote.data.needsPricing}
                />
              ) : (
                <div className="py-8">
                  <Loader2 className="mx-auto size-6 animate-spin text-primary" />
                </div>
              )}
            </div>

            <CheckoutButton disabled={!quote.data || !!quote.error} className="mt-5 w-full" />
          </div>
        </aside>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border/70 bg-card/95 px-4 py-3 shadow-lg backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              الإجمالي ({lines.length} {lines.length === 1 ? "عنصر" : "عناصر"})
            </p>
            <p className="truncate text-lg font-extrabold tabular-nums text-primary">
              {quote.isFetching && !quote.data
                ? "..."
                : quote.data
                  ? (anyApprox ? "≈ " : "") +
                    formatMoney(
                      quote.data.pricing.subtotalMinor -
                        quote.data.pricing.invoiceDiscountMinor +
                        quote.data.pricing.serviceFeeMinor,
                    )
                  : "—"}
            </p>
          </div>
          <CheckoutButton disabled={!quote.data || !!quote.error} className="w-40 shrink-0" />
        </div>
      </div>

      <div className="h-22 lg:hidden" />
    </StoreLayout>
  );
}

function CheckoutButton({ disabled, className }: { disabled: boolean; className?: string }) {
  return disabled ? (
    <span
      aria-disabled="true"
      className={`grid h-12 cursor-not-allowed place-items-center rounded-2xl bg-muted text-sm font-bold text-muted-foreground ${className ?? ""}`}
    >
      إتمام الطلب
    </span>
  ) : (
    <Link
      to="/checkout"
      className={`grid h-12 place-items-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] ${className ?? ""}`}
    >
      إتمام الطلب
    </Link>
  );
}

function Header({ showClear, count }: { showClear?: boolean; count?: number }) {
  return (
    <div className="flex items-center justify-between px-4 pb-4 pt-6 md:px-6">
      <div className="flex items-center gap-2.5">
        <h1 className="text-2xl font-extrabold tracking-tight">سلة التسوق</h1>
        {typeof count === "number" && count > 0 && (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary tabular-nums">
            {count}
          </span>
        )}
      </div>

      {showClear && (
        <button
          type="button"
          onClick={() => {
            const snapshot = cart.get().lines;
            cart.clear();
            toast("السلة اتفضت", {
              action: {
                label: "تراجع",
                onClick: () => snapshot.forEach((l, i) => cart.restore(l, i)),
              },
            });
          }}
          className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive transition-colors hover:bg-destructive/15 active:scale-95"
        >
          <Trash2 className="size-3.5" />
          <span>إفراغ السلة</span>
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
  pending: boolean;
  invalid: boolean;
  onRemove: (name: string) => void;
}) {
  const c = useCatalog();

  if (line.type === "custom") {
    return (
      <div className="flex items-start gap-3.5 rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs transition-colors">
        <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-highlight-soft text-highlight-foreground">
          <PencilLine className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-highlight-soft px-2 py-0.5 text-[11px] font-bold text-highlight-foreground">
              طلب مخصص
            </span>
          </div>
          <p className="mt-1 font-bold text-foreground">{line.text}</p>
          {line.note && <p className="mt-0.5 text-xs text-muted-foreground">{line.note}</p>}
          <p className="mt-1.5 text-xs font-semibold text-highlight-foreground">
            السعر يتحدد بعد الشراء
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(line.text)}
          aria-label="شيل"
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
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
    <div
      className={`flex gap-3.5 rounded-2xl border bg-card p-3.5 shadow-2xs transition-all ${
        invalid ? "border-destructive ring-2 ring-destructive/20" : "border-border/70"
      }`}
    >
      <div className="size-22 shrink-0 overflow-hidden rounded-2xl border border-black/5 bg-muted/30">
        <ProductImage
          src={p?.thumbUrl ?? p?.imageUrl}
          alt={name}
          slug={p?.storeId ? "restaurant" : c.categories[catIndex]?.slug}
          toneIndex={Math.max(0, catIndex)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-bold leading-snug text-foreground sm:text-base">
            {name}
          </p>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {item?.unitPriceMinor != null && (
            <span>
              {formatMoney(item.unitPriceMinor)} /{" "}
              {p?.saleMode === "WEIGHT" ? p.unitLabel : (p?.unitLabel ?? "وحدة")}
            </span>
          )}
          {extra.map((ex) => (
            <span
              key={ex}
              className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {ex}
            </span>
          ))}
        </div>

        {!p && (
          <p className="mt-1.5 text-xs font-semibold text-destructive">المنتج ده مش متاح تاني</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
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
            <button
              type="button"
              onClick={() => onRemove(name)}
              className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive transition-colors hover:bg-destructive/15"
            >
              شيله من السلة
            </button>
          )}

          <div className={`text-end transition-opacity ${pending ? "opacity-50" : ""}`}>
            {item && item.lineDiscountMinor > 0 && item.lineTotalMinor != null && (
              <p className="text-xs font-medium text-muted-foreground line-through tabular-nums">
                {formatMoney(item.lineTotalMinor + item.lineDiscountMinor)}
              </p>
            )}
            <p className="text-sm font-extrabold tabular-nums text-primary sm:text-base">
              {item
                ? (p && isApproxProduct(p) ? "≈ " : "") + formatMoney(item.lineTotalMinor)
                : "..."}
            </p>
            {p && isApproxProduct(p) && <ApproxBadge className="mt-0.5" />}
          </div>
        </div>
      </div>
    </div>
  );
}
