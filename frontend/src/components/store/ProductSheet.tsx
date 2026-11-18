import { useEffect, useMemo, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useCatalog } from "@/lib/catalog";
import { cart } from "@/lib/cart";
import { formatMoney, formatQty } from "@/lib/money";
import { estimateLine, stepQty } from "@/lib/pricing";
import type { CatalogOptionGroup, CatalogProduct } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { ProductImage } from "./ProductImage";
import { PriceTag, discountLabel } from "./ProductCard";
import { productSheet, useOpenProductId } from "./product-sheet-store";

export function ProductSheetHost() {
  const id = useOpenProductId();
  const catalog = useCatalog();
  const product = id ? catalog.products.find((p) => p.id === id) : undefined;
  const catIndex = product ? catalog.categories.findIndex((c) => c.id === product.categoryId) : -1;
  const slug = product?.storeId ? "restaurant" : catalog.categories[catIndex]?.slug;
  return (
    <Drawer open={!!product} onOpenChange={(o) => !o && productSheet.close()} shouldScaleBackground={false}>
      <DrawerContent className="mx-auto max-h-[92vh] max-w-lg rounded-t-3xl border-0">
        {product && <SheetBody key={product.id} p={product} slug={slug} toneIndex={Math.max(catIndex, 0)} />}
      </DrawerContent>
    </Drawer>
  );
}

function optionPriceLabel(pricing: string, priceMinor: number) {
  if (priceMinor === 0) return "مجانًا";
  const suffix = pricing === "PER_KG" ? " / كيلو" : pricing === "PER_UNIT" ? " / وحدة" : "";
  return `+ ${formatMoney(priceMinor)}${suffix}`;
}

function SheetBody({ p, slug, toneIndex }: { p: CatalogProduct; slug?: string; toneIndex: number }) {
  const [qty, setQty] = useState(p.saleMode === "WEIGHT" && p.weightChoices.length ? p.weightChoices.find((w) => w >= p.minQty) ?? p.minQty : p.minQty);
  const [weight, setWeight] = useState<number | undefined>(
    p.saleMode === "PIECE_WEIGHT" ? p.weightChoices[0] : undefined,
  );
  const [selected, setSelected] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(p.optionGroups.map((g) => [g.id, []])),
  );
  useEffect(() => setQty((q) => Math.max(q, p.minQty)), [p.minQty]);

  const optionIds = useMemo(() => Object.values(selected).flat(), [selected]);
  const missing = p.optionGroups.find((g) => (selected[g.id]?.length ?? 0) < g.minSelect);
  const total = estimateLine(p, qty, weight, optionIds);
  const badge = discountLabel(p);

  function toggle(g: CatalogOptionGroup, optId: string) {
    setSelected((s) => {
      const cur = s[g.id] ?? [];
      if (cur.includes(optId)) return { ...s, [g.id]: cur.filter((x) => x !== optId) };
      if (g.maxSelect === 1) return { ...s, [g.id]: [optId] };
      if (cur.length >= g.maxSelect) {
        toast.message(`تقدر تختار ${g.maxSelect} بس من «${g.name}»`);
        return s;
      }
      return { ...s, [g.id]: [...cur, optId] };
    });
  }

  function add() {
    if (missing) { toast.error(`اختار من «${missing.name}»`); return; }
    cart.addProduct({ productId: p.id, quantity: qty, weightPerUnit: weight, optionIds });
    toast.success(`اتضاف «${p.name}» للسلة`);
    productSheet.close();
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="no-scrollbar overflow-y-auto px-5 pb-4">
        <div className="relative mx-auto mt-3 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted">
          <ProductImage src={p.imageUrl ?? p.thumbUrl} alt={p.name} slug={slug} toneIndex={toneIndex} />
          {badge && (
            <span className="absolute start-3 top-3 rounded-full bg-sale px-2.5 py-1 text-xs font-bold text-sale-foreground">{badge}</span>
          )}
        </div>
        <DrawerTitle className="mt-4 text-xl font-bold leading-snug">{p.name}</DrawerTitle>
        <DrawerDescription className={cn("mt-1 text-sm text-muted-foreground", !p.description && "sr-only")}>
          {p.description ?? p.name}
        </DrawerDescription>
        <PriceTag p={p} className="mt-2 [&>span:nth-child(2)]:text-xl" />

        {p.saleMode === "PIECE_WEIGHT" && (
          <Section title="وزن القطعة" hint="السعر النهائي بيتحدد بعد الوزن الفعلي">
            <div className="flex flex-wrap gap-2">
              {p.weightChoices.map((w) => (
                <Chip key={w} active={weight === w} onClick={() => setWeight(w)}>
                  {formatQty(w)} كيلو
                </Chip>
              ))}
            </div>
          </Section>
        )}

        {p.saleMode === "WEIGHT" && p.weightChoices.length > 0 && (
          <Section title="اختار الوزن">
            <div className="flex flex-wrap gap-2">
              {p.weightChoices
                .filter((w) => w >= p.minQty)
                .map((w) => (
                  <Chip key={w} active={qty === w} onClick={() => setQty(w)}>
                    {formatQty(w)} {p.unitLabel}
                  </Chip>
                ))}
            </div>
          </Section>
        )}

        {p.optionGroups.map((g) => (
          <Section
            key={g.id}
            title={g.name}
            hint={
              g.minSelect > 0
                ? g.maxSelect === 1
                  ? "مطلوب · اختار واحد"
                  : `مطلوب · من ${g.minSelect} لـ ${g.maxSelect}`
                : g.maxSelect === 1
                  ? "اختياري"
                  : `اختياري · لحد ${g.maxSelect}`
            }
          >
            <div className="divide-y rounded-xl border bg-card">
              {g.options.map((o) => {
                const on = selected[g.id]?.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => toggle(g, o.id)}
                    className="flex w-full items-center gap-3 px-3.5 py-3 text-start"
                  >
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center border-2 transition-colors",
                        g.maxSelect === 1 ? "rounded-full" : "rounded-md",
                        on ? "border-primary bg-primary text-primary-foreground" : "border-input",
                      )}
                    >
                      {on && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span className="flex-1 text-sm font-medium">{o.name}</span>
                    <span className="text-xs text-muted-foreground">{optionPriceLabel(o.pricing, o.priceMinor)}</span>
                  </button>
                );
              })}
            </div>
          </Section>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t bg-card px-5 py-4 pb-safe">
        <div className="flex h-12 items-center gap-1 rounded-xl border px-1">
          <button type="button" aria-label="زوّد" onClick={() => setQty((q) => stepQty(p, q, 1))} className="grid size-10 place-items-center rounded-lg text-primary hover:bg-primary-soft">
            <Plus className="size-4" />
          </button>
          <span className="min-w-12 text-center text-sm font-bold tabular-nums">
            {formatQty(qty)}
            <span className="ms-1 text-xs font-normal text-muted-foreground">
              {p.saleMode === "WEIGHT" ? p.unitLabel : p.saleMode === "PIECE_WEIGHT" ? "قطعة" : ""}
            </span>
          </span>
          <button
            type="button"
            aria-label="قلّل"
            disabled={qty - p.qtyStep < p.minQty}
            onClick={() => setQty((q) => Math.max(p.minQty, stepQty(p, q, -1)))}
            className="grid size-10 place-items-center rounded-lg hover:bg-muted disabled:opacity-30"
          >
            <Minus className="size-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!p.available}
          className="flex h-12 flex-1 items-center justify-between rounded-xl bg-primary px-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-50"
        >
          <span className="whitespace-nowrap">{p.available ? "أضف للسلة" : "مش متاح"}</span>
          <span className="whitespace-nowrap tabular-nums">{p.saleMode === "PIECE_WEIGHT" ? "≈ " : ""}{formatMoney(total)}</span>
        </button>
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h4 className="font-semibold">{title}</h4>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/50",
      )}
    >
      {children}
    </button>
  );
}
