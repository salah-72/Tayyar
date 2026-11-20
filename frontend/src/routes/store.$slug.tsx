import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Receipt, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { catalogQuery, useCatalog } from "@/lib/catalog";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/store/$slug")({
  loader: async ({ context, params }) => {
    const c = await context.queryClient.ensureQueryData(catalogQuery);
    const store = c.stores.find((s) => s.slug === params.slug);
    if (!store) throw notFound();
    return { name: store.name };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.name} — منيو | البيه الطيار` : "المطعم — البيه الطيار" },
      {
        name: "description",
        content: loaderData ? `اطلب من منيو ${loaderData.name} ويوصلك لحد البيت.` : "منيو المطعم",
      },
      {
        property: "og:title",
        content: loaderData ? `${loaderData.name} — البيه الطيار` : "المطعم — البيه الطيار",
      },
      { property: "og:description", content: "اطلب أكلك المفضل ويوصلك لحد البيت." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StorePage,
});

function StorePage() {
  const { slug } = Route.useParams();
  const c = useCatalog();
  const store = c.stores.find((s) => s.slug === slug)!;
  const items = c.products.filter((p) => p.storeId === store.id);
  const sections = [
    ...store.sections,
    ...new Set(items.map((p) => p.menuSection ?? "أخرى")),
  ].filter((s, i, a) => a.indexOf(s) === i && items.some((p) => (p.menuSection ?? "أخرى") === s));
  const [active, setActive] = useState<string | null>(null);

  return (
    <StoreLayout>
      {/* Store Hero Header */}
      <div className="relative overflow-hidden bg-gradient-hero px-4 pb-7 pt-5 text-primary-foreground md:px-6">
        {/* Decorative subtle glow */}
        <div className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <Link
            to="/stores"
            aria-label="رجوع"
            className="grid size-10 place-items-center rounded-full bg-primary-foreground/15 backdrop-blur-sm transition-colors hover:bg-primary-foreground/25 active:scale-95"
          >
            <ArrowRight className="size-5" />
          </Link>
          <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            {items.length} صنف متاح
          </span>
        </div>

        <div className="relative mt-5 flex items-center gap-4">
          <div className="grid size-22 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-white/20 bg-card text-primary shadow-lg">
            {store.imageUrl ? (
              <img src={store.imageUrl} alt={store.name} className="size-full object-cover" />
            ) : (
              <UtensilsCrossed className="size-10" strokeWidth={1.5} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-extrabold tracking-tight md:text-3xl">
              {store.name}
            </h1>
            {store.sections.length > 0 && (
              <p className="mt-1.5 line-clamp-1 text-sm text-primary-foreground/85">
                {store.sections.join(" • ")}
              </p>
            )}
          </div>
        </div>

        {c.settings.serviceFeePerStoreMinor > 0 && (
          <div className="relative mt-4 inline-flex items-center gap-1.5 rounded-xl bg-black/15 px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm">
            <Receipt className="size-3.5 shrink-0 opacity-90" />
            <span>
              رسوم الخدمة {formatMoney(c.settings.serviceFeePerStoreMinor)} على كل محل في الأوردر
            </span>
          </div>
        )}
      </div>

      {/* Sticky Section Filter Bar */}
      {sections.length > 0 && (
        <div className="no-scrollbar sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-border/60 bg-background/95 px-4 py-3 shadow-xs backdrop-blur-md md:px-6">
          <SectionChip on={active === null} count={items.length} onClick={() => setActive(null)}>
            الكل
          </SectionChip>
          {sections.map((s) => {
            const secCount = items.filter((p) => (p.menuSection ?? "أخرى") === s).length;
            return (
              <SectionChip key={s} on={active === s} count={secCount} onClick={() => setActive(s)}>
                {s}
              </SectionChip>
            );
          })}
        </div>
      )}

      {/* Menu Sections & Products */}
      <div className="space-y-8 px-4 pb-8 pt-5 md:px-6">
        {items.length === 0 ? (
          <div className="mx-auto max-w-md rounded-3xl border border-dashed bg-card/60 px-6 py-16 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-muted/60 text-muted-foreground">
              <UtensilsCrossed className="size-8" strokeWidth={1.5} />
            </div>
            <p className="mt-4 text-base font-bold">المنيو لسه فاضي</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              ارجع كمان شوية، هنضيف الأصناف قريب.
            </p>
          </div>
        ) : (
          sections
            .filter((s) => active === null || s === active)
            .map((s) => {
              const sectionItems = items.filter((p) => (p.menuSection ?? "أخرى") === s);
              return (
                <section key={s} className="scroll-mt-20">
                  <div className="mb-3.5 flex items-center gap-3">
                    <h2 className="text-lg font-extrabold tracking-tight">{s}</h2>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                      {sectionItems.length}
                    </span>
                    <div className="h-px flex-1 bg-border/60" />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
                    {sectionItems.map((p) => (
                      <ProductCard key={p.id} p={p} slug="restaurant" toneIndex={1} />
                    ))}
                  </div>
                </section>
              );
            })
        )}
      </div>
    </StoreLayout>
  );
}

function SectionChip({
  on,
  count,
  onClick,
  children,
}: {
  on: boolean;
  count: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all active:scale-95",
        on
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border/80 bg-card text-foreground hover:border-primary/40 hover:bg-muted/40",
      )}
    >
      <span>{children}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.2 text-[11px]",
          on
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}
