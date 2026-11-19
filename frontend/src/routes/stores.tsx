import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Store, UtensilsCrossed, X } from "lucide-react";
import { catalogQuery, normalizeArabic, useCatalog } from "@/lib/catalog";
import { StoreLayout, CartButton } from "@/components/store/StoreLayout";
import { categoryTone } from "@/components/store/CategoryIcon";
import { bpsToPercent } from "@/lib/money";

export const Route = createFileRoute("/stores")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  head: () => ({
    meta: [
      { title: "المطاعم والمحلات — البيه الطيار" },
      { name: "description", content: "تصفح المطاعم والمحلات واطلب من المنيو المفضل ليك ويوصلك لحد البيت." },
      { property: "og:title", content: "المطاعم والمحلات — البيه الطيار" },
      { property: "og:description", content: "اطلب أكلك المفضل من أحسن المطاعم والمحلات ويوصلك لحد البيت." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StoresPage,
});

function StoresPage() {
  // The backend catalog only returns active stores of type RESTAURANT, so `c.stores` is exactly that list.
  const c = useCatalog();
  const [q, setQ] = useState("");

  const itemsCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of c.products) if (p.storeId) m.set(p.storeId, (m.get(p.storeId) ?? 0) + 1);
    return m;
  }, [c.products]);

  const stores = useMemo(() => {
    const n = normalizeArabic(q);
    if (!n) return c.stores;
    return c.stores.filter((s) => normalizeArabic(`${s.name} ${s.sections.join(" ")}`).includes(n));
  }, [c.stores, q]);

  return (
    <StoreLayout>
      <div className="sticky top-0 z-30 bg-background/95 pb-3 pt-5 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 md:px-6">
          <h1 className="text-2xl font-bold">المطاعم والمحلات</h1>
          <CartButton />
        </div>
        <div className="mt-3 px-4 md:px-6">
          <label className="flex h-11 items-center gap-2 rounded-2xl bg-card px-3.5 shadow-card">
            <Search className="size-4 text-primary" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن مطعم أو محل..."
              className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {q && (
              <button aria-label="امسح البحث" onClick={() => setQ("")}>
                <X className="size-4 text-muted-foreground" />
              </button>
            )}
          </label>
        </div>
      </div>

      <div className="px-4 md:px-6">
        {stores.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-card/60 px-6 py-16 text-center">
            <Store className="mx-auto size-10 text-muted-foreground" strokeWidth={1.5} />
            <p className="mt-3 font-semibold">{q ? "مفيش مطعم أو محل بالاسم ده" : "مفيش مطاعم أو محلات متاحة دلوقتي"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {q ? "جرّب كلمة تانية أو امسح البحث." : "ارجع كمان شوية، هنضيف مطاعم ومحلات جديدة قريب."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((s, i) => {
              const count = itemsCount.get(s.id) ?? 0;
              const img = s.thumbUrl ?? s.imageUrl;
              return (
                <Link
                  key={s.id}
                  to="/store/$slug"
                  params={{ slug: s.slug }}
                  className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card transition-transform hover:-translate-y-0.5"
                >
                  <span className={`grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl ${categoryTone(i + 1)}`}>
                    {img ? (
                      <img src={img} alt={s.name} className="size-full object-cover" loading="lazy" />
                    ) : (
                      <UtensilsCrossed className="size-8" strokeWidth={1.5} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{s.name}</p>
                    {s.sections.length > 0 && <p className="truncate text-xs text-muted-foreground">{s.sections.join(" · ")}</p>}
                    <p className="mt-1 text-xs text-primary">{count} صنف في المنيو</p>
                    {s.serviceFeeBps ? (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">رسوم خدمة {bpsToPercent(s.serviceFeeBps)}</p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
