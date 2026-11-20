import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, UtensilsCrossed } from "lucide-react";
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
      { name: "description", content: loaderData ? `اطلب من منيو ${loaderData.name} ويوصلك لحد البيت.` : "منيو المطعم" },
      { property: "og:title", content: loaderData ? `${loaderData.name} — البيه الطيار` : "المطعم — البيه الطيار" },
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
  const sections = [...store.sections, ...new Set(items.map((p) => p.menuSection ?? "أخرى"))].filter(
    (s, i, a) => a.indexOf(s) === i && items.some((p) => (p.menuSection ?? "أخرى") === s),
  );
  const [active, setActive] = useState<string | null>(null);

  return (
    <StoreLayout>
      <div className="bg-gradient-hero px-4 pb-6 pt-5 text-primary-foreground md:px-6">
        <Link to="/stores" aria-label="رجوع" className="grid size-11 place-items-center rounded-full bg-primary-foreground/15">
          <ArrowRight className="size-5" />
        </Link>
        <div className="mt-4 flex items-center gap-4">
          <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-card text-primary">
            {store.imageUrl ? <img src={store.imageUrl} alt={store.name} className="size-full object-cover" /> : <UtensilsCrossed className="size-9" strokeWidth={1.5} />}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{store.name}</h1>
            <p className="mt-1 text-sm opacity-85">{store.sections.join(" · ")}</p>
          </div>
        </div>
        {c.settings.serviceFeePerStoreMinor > 0 && (
          <p className="mt-4 w-fit rounded-full bg-primary-foreground/15 px-3 py-1 text-xs">
            رسوم الخدمة {formatMoney(c.settings.serviceFeePerStoreMinor)} على كل محل في الأوردر
          </p>
        )}
      </div>

      <div className="no-scrollbar sticky top-0 z-20 flex gap-2 overflow-x-auto border-b bg-background/95 px-4 py-3 backdrop-blur md:px-6">
        <SectionChip on={active === null} onClick={() => setActive(null)}>الكل</SectionChip>
        {sections.map((s) => (
          <SectionChip key={s} on={active === s} onClick={() => setActive(s)}>
            {s}
          </SectionChip>
        ))}
      </div>

      <div className="space-y-7 px-4 pt-4 md:px-6">
        {items.length === 0 && (
          <div className="rounded-3xl border border-dashed bg-card/60 px-6 py-16 text-center">
            <p className="font-semibold">المنيو لسه فاضي</p>
            <p className="mt-1 text-sm text-muted-foreground">ارجع كمان شوية، هنضيف الأصناف قريب.</p>
          </div>
        )}
        {sections
          .filter((s) => active === null || s === active)
          .map((s) => (
            <section key={s}>
              <h2 className="mb-3 flex items-baseline justify-between text-lg font-bold">
                {s}
                <span className="text-sm font-normal text-muted-foreground">{items.filter((p) => (p.menuSection ?? "أخرى") === s).length} صنف</span>
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {items
                  .filter((p) => (p.menuSection ?? "أخرى") === s)
                  .map((p) => (
                    <ProductCard key={p.id} p={p} slug="restaurant" toneIndex={1} />
                  ))}
              </div>
            </section>
          ))}
      </div>
    </StoreLayout>
  );
}

function SectionChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        on ? "border-primary bg-primary text-primary-foreground" : "bg-card",
      )}
    >
      {children}
    </button>
  );
}
