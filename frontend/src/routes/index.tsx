import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Plane, BadgePercent, Clock, UtensilsCrossed } from "lucide-react";
import { catalogQuery, useCatalog } from "@/lib/catalog";
import { formatMoney, bpsToPercent } from "@/lib/money";
import { StoreLayout, CartButton } from "@/components/store/StoreLayout";
import { BannerCarousel, defaultBanners } from "@/components/store/BannerCarousel";
import { SectionHeader, seeAllClass } from "@/components/store/SectionHeader";
import { ProductCard } from "@/components/store/ProductCard";
import { CustomItemRequest } from "@/components/store/CustomItemRequest";
import { categoryIcon, categoryTone } from "@/components/store/CategoryIcon";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  head: () => ({
    meta: [
      { title: "البيه الطيار — اطلب كل اللي تحتاجه لحد البيت" },
      { name: "description", content: "خضار وفاكهة ولحوم وفراخ وبقالة وأكل مطاعم، اطلب أونلاين والطيار يوصلك." },
      { property: "og:title", content: "البيه الطيار — اطلب كل اللي تحتاجه لحد البيت" },
      { property: "og:description", content: "خضار وفاكهة ولحوم وفراخ وبقالة وأكل مطاعم، اطلب أونلاين والطيار يوصلك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const c = useCatalog();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { settings } = c;
  const threshold = settings.freeDeliveryThresholdMinor;
  const banners = defaultBanners(threshold > 0 ? `على الطلبات فوق ${formatMoney(threshold)}` : null);

  const groceries = c.products.filter((p) => !p.storeId);
  const offers = groceries.filter((p) => p.price.hasDiscount);
  const featured = groceries.filter((p) => p.isFeatured && !p.price.hasDiscount);
  const catIndex = new Map(c.categories.map((cat, i) => [cat.id, i] as const));
  const cardProps = (categoryId: string | null) => {
    const i = categoryId ? catIndex.get(categoryId) ?? 0 : 0;
    return { slug: c.categories[i]?.slug, toneIndex: i };
  };

  return (
    <StoreLayout>
      <header className="flex items-center justify-between gap-3 px-4 pt-5 md:px-6">
        <div className="flex items-center gap-3">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.storeName} className="size-11 rounded-2xl object-cover" />
          ) : (
            <div className="grid size-11 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground">
              <Plane className="size-5 -rotate-45" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold leading-tight text-primary-deep">{settings.storeName}</h1>
            {settings.tagline && <p className="text-xs text-muted-foreground">{settings.tagline}</p>}
          </div>
        </div>
        <CartButton />
      </header>

      {!settings.acceptingOrders && (
        <div className="mx-4 mt-4 flex items-center gap-2 rounded-2xl bg-highlight-soft px-4 py-3 text-sm text-highlight-foreground md:mx-6">
          <Clock className="size-4 shrink-0" /> المتجر مش بيستقبل أوردرات دلوقتي، تقدر تتفرج وتجهّز سلتك.
        </div>
      )}

      <form
        className="mx-4 mt-4 md:mx-6"
        onSubmit={(e) => {
          e.preventDefault();
          void navigate({ to: "/categories", search: { q: q.trim() || undefined } });
        }}
      >
        <label className="flex h-12 items-center gap-3 rounded-2xl bg-card px-4 shadow-card">
          <Search className="size-5 text-primary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن منتج أو أكلة..."
            className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
      </form>

      <div className="mt-5 px-4 md:px-6">
        <BannerCarousel banners={banners} />
      </div>

      {c.discounts.length > 0 && (
        <div className="no-scrollbar mt-5 flex gap-3 overflow-x-auto px-4 md:px-6">
          {c.discounts.map((d) => (
            <div key={d.name} className="flex min-w-72 items-center gap-3 rounded-2xl bg-gradient-saffron px-4 py-3 text-highlight-foreground">
              <BadgePercent className="size-7 shrink-0" />
              <div>
                <p className="text-sm font-bold">{d.name}</p>
                <p className="text-xs opacity-80">
                  {d.kind === "PERCENT" ? `خصم ${bpsToPercent(d.value)}` : `خصم ${formatMoney(d.value)}`} للطلبات من {formatMoney(d.minSubtotalMinor)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="mt-7 px-4 md:px-6">
        <SectionHeader title="تسوّق حسب القسم" action={<Link to="/categories" className={seeAllClass}>عرض الكل</Link>} />
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-6 md:overflow-visible md:px-0 lg:grid-cols-11">
          {c.categories.map((cat, i) => {
            const Icon = categoryIcon(cat.slug);
            return (
              <Link key={cat.id} to="/categories" search={{ c: cat.slug }} className="group flex w-20 shrink-0 flex-col items-center gap-2 text-center md:w-auto">
                <span className={`grid size-20 place-items-center overflow-hidden rounded-2xl transition-transform group-hover:-translate-y-0.5 ${categoryTone(i)}`}>
                  {cat.thumbUrl ?? cat.imageUrl ? (
                    <img src={(cat.thumbUrl ?? cat.imageUrl)!} alt={cat.name} className="size-full object-cover" loading="lazy" />
                  ) : (
                    <Icon className="size-8" strokeWidth={1.5} />
                  )}
                </span>
                <span className="line-clamp-2 text-xs font-medium leading-tight">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-5 px-4 md:px-6">
        <CustomItemRequest />
      </div>

      {offers.length > 0 && (
        <ProductRow title="عروض مميزة" products={offers} cardProps={cardProps} />
      )}

      {featured.length > 0 && <ProductRow title="الأكثر طلبًا" products={featured} cardProps={cardProps} />}

      {c.stores.length > 0 && (
        <section id="restaurants" className="mt-7 scroll-mt-4 px-4 md:px-6">
          <SectionHeader title="المطاعم والمحلات" action={<Link to="/stores" className={seeAllClass}>عرض الكل</Link>} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {c.stores.map((s, i) => {
              const count = c.products.filter((p) => p.storeId === s.id).length;
              return (
                <Link
                  key={s.id}
                  to="/store/$slug"
                  params={{ slug: s.slug }}
                  className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card transition-transform hover:-translate-y-0.5"
                >
                  <span className={`grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl ${categoryTone(i + 1)}`}>
                    {s.thumbUrl ?? s.imageUrl ? (
                      <img src={(s.thumbUrl ?? s.imageUrl)!} alt={s.name} className="size-full object-cover" loading="lazy" />
                    ) : (
                      <UtensilsCrossed className="size-7" strokeWidth={1.5} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.sections.join(" · ")}</p>
                    <p className="mt-1 text-xs text-primary">{count} صنف في المنيو</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </StoreLayout>
  );
}

function ProductRow({
  title,
  products,
  cardProps,
}: {
  title: string;
  products: ReturnType<typeof useCatalog>["products"];
  cardProps: (categoryId: string | null) => { slug?: string; toneIndex: number };
}) {
  return (
    <section className="mt-7 px-4 md:px-6">
      <SectionHeader title={title} action={<Link to="/categories" className={seeAllClass}>عرض الكل</Link>} />
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 lg:grid-cols-5">
        {products.map((p) => (
          <ProductCard key={p.id} p={p} {...cardProps(p.categoryId)} className="w-44 shrink-0 md:w-auto" />
        ))}
      </div>
    </section>
  );
}
