import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { catalogQuery, useCatalog } from "@/lib/catalog";
import { StoreLayout, CartButton } from "@/components/store/StoreLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { bpsToPercent } from "@/lib/money";
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
      <div className="relative bg-gradient-hero px-4 pb-14 pt-5 text-primary-foreground md:px-6">
        <div className="flex items-center justify-between">
          <Link to="/" hash="restaurants" aria-label="رجوع" className="grid size-11 place-items-center rounded-full bg-primary-foreground/15">
            <ArrowRight className="size-5" />
          </Link>
          <CartButton />
        </div>
        <div className="mt-5 flex items-center gap-4">
          <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-card text-primary">
            {store.imageUrl ? <img src={store.imageUrl} alt={store.name} className="size-full object-cover" /> : <UtensilsCrossed className="size-9" strokeWidth={1.5} />}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{store.name}</h1>
            <p className="mt-1 text-sm opacity-85">{store.sections.join(" · ")}</p>
            {store.serviceFeeBps ? (
              <p className="mt-1 text-xs opacity-75">بيتضاف رسوم خدمة {bpsToPercent(store.serviceFeeBps)} على أصناف المطعم</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="no-scrollbar sticky top-0 z-20 -mt-8 flex gap-2 overflow-x-auto px-4 py-2 md:px-6">
        <SectionChip on={active === null} onClick={() => setActive(null)}>الكل</SectionChip>
        {sections.map((s) => (
          <SectionChip key={s} on={active === s} onClick={() => setActive(s)}>
            {s}
          </SectionChip>
        ))}
      </div>

      <div className="space-y-7 px-4 pt-3 md:px-6">
        {sections
          .filter((s) => active === null || s === active)
          .map((s) => (
            <section key={s}>
              <h2 className="mb-3 text-lg font-bold">{s}</h2>
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
        "shrink-0 rounded-2xl border px-4 py-2 text-sm font-medium shadow-card transition-colors",
        on ? "border-primary bg-primary text-primary-foreground" : "bg-card",
      )}
    >
      {children}
    </button>
  );
}
