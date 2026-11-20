import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, Search, Sparkles, Store, UtensilsCrossed, X } from "lucide-react";
import { catalogQuery, normalizeArabic, useCatalog } from "@/lib/catalog";
import { StoreLayout } from "@/components/store/StoreLayout";
import { categoryTone } from "@/components/store/CategoryIcon";

export const Route = createFileRoute("/stores")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  head: () => ({
    meta: [
      { title: "المطاعم والمحلات — البيه الطيار" },
      {
        name: "description",
        content: "تصفح المطاعم والمحلات واطلب من المنيو المفضل ليك ويوصلك لحد البيت.",
      },
      { property: "og:title", content: "المطاعم والمحلات — البيه الطيار" },
      {
        property: "og:description",
        content: "اطلب أكلك المفضل من أحسن المطاعم والمحلات ويوصلك لحد البيت.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StoresPage,
});

function StoresPage() {
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
      {/* Sticky Header & Search */}
      <div className="sticky top-0 z-30 border-b border-border/40 bg-background/90 pb-4 pt-5 backdrop-blur-md">
        <div className="flex items-end justify-between px-4 md:px-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">المطاعم والمحلات</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">اختار مطعمك المفضل واطلب أونلاين</p>
          </div>
          {c.stores.length > 0 && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {stores.length} {stores.length === 1 ? "مطعم" : "مطاعم"}
            </span>
          )}
        </div>

        <div className="mt-3.5 px-4 md:px-6">
          <label className="flex h-12 items-center gap-2.5 rounded-2xl border border-border/80 bg-card px-4 shadow-sm transition-all focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
            <Search className="size-4.5 shrink-0 text-primary" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث باسم المطعم أو نوع الأكل..."
              className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/80"
            />
            {q && (
              <button
                type="button"
                aria-label="امسح البحث"
                onClick={() => setQ("")}
                className="grid size-7 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </label>
        </div>
      </div>

      {/* Stores Grid */}
      <div className="px-4 py-5 md:px-6">
        {stores.length === 0 ? (
          <div className="mx-auto max-w-md rounded-3xl border border-dashed bg-card/60 px-6 py-16 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-muted/60 text-muted-foreground">
              <Store className="size-8" strokeWidth={1.5} />
            </div>
            <p className="mt-4 text-base font-bold">
              {q ? "مفيش مطعم أو محل بالاسم ده" : "مفيش مطاعم أو محلات متاحة دلوقتي"}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {q
                ? "جرّب تكتب كلمة تانية أو امسح البحث عشان تشوف كل المطاعم."
                : "ارجع كمان شوية، هنضيف مطاعم ومحلات جديدة قريب."}
            </p>
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="mt-5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-transform active:scale-95"
              >
                عرض كل المطاعم
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((s) => {
              const count = itemsCount.get(s.id) ?? 0;
              const img = s.thumbUrl ?? s.imageUrl;
              return (
                <Link
                  key={s.id}
                  to="/store/$slug"
                  params={{ slug: s.slug }}
                  className="group relative flex items-center gap-3.5 rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
                >
                  <div
                    className={`grid size-22 shrink-0 place-items-center overflow-hidden rounded-2xl border border-black/5 ${categoryTone(0, "restaurant")}`}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={s.name}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <UtensilsCrossed className="size-9 opacity-80" strokeWidth={1.5} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-foreground transition-colors group-hover:text-primary">
                      {s.name}
                    </p>

                    {s.sections.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {s.sections.slice(0, 3).map((sec) => (
                          <span
                            key={sec}
                            className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                          >
                            {sec}
                          </span>
                        ))}
                        {s.sections.length > 3 && (
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                            +{s.sections.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">منيو متنوع</p>
                    )}

                    <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Sparkles className="size-3.5" />
                      <span>{count} صنف في المنيو</span>
                    </div>
                  </div>

                  <div className="grid size-8 shrink-0 place-items-center rounded-full bg-muted/50 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                    <ChevronLeft className="size-4.5 transition-transform group-hover:-translate-x-0.5" />
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
