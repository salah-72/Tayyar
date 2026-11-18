import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { catalogQuery, normalizeArabic, useCatalog } from "@/lib/catalog";
import { StoreLayout, CartButton } from "@/components/store/StoreLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { categoryIcon } from "@/components/store/CategoryIcon";
import { cn } from "@/lib/utils";

type CategoriesSearch = { c?: string; q?: string };

export const Route = createFileRoute("/categories")({
  validateSearch: (s: Record<string, unknown>): CategoriesSearch => ({
    c: typeof s.c === "string" && s.c ? s.c : undefined,
    q: typeof s.q === "string" && s.q ? s.q : undefined,
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  head: () => ({
    meta: [
      { title: "الأقسام — البيه الطيار" },
      { name: "description", content: "تصفح كل الأقسام: خضار، لحوم، فراخ، سمك، بقالة، ألبان، مشروبات، منظفات وأكتر." },
      { property: "og:title", content: "الأقسام — البيه الطيار" },
      { property: "og:description", content: "تصفح كل الأقسام واطلب اللي محتاجه لحد البيت." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const c = useCatalog();
  const { c: slug, q } = Route.useSearch();
  const navigate = useNavigate({ from: "/categories" });
  const [searchOpen, setSearchOpen] = useState(!!q);
  const [text, setText] = useState(q ?? "");
  const chipsRef = useRef<HTMLDivElement>(null);

  const active = c.categories.find((x) => x.slug === slug) ?? (q ? undefined : c.categories[0]);
  const activeIndex = active ? c.categories.indexOf(active) : 0;

  useEffect(() => {
    const t = setTimeout(() => {
      const v = text.trim();
      if (v !== (q ?? "")) void navigate({ search: (s) => ({ ...s, q: v || undefined }), replace: true });
    }, 250);
    return () => clearTimeout(t);
  }, [text, q, navigate]);

  useEffect(() => {
    chipsRef.current?.querySelector<HTMLElement>("[data-active=true]")?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active?.id]);

  const products = useMemo(() => {
    if (q) {
      const n = normalizeArabic(q);
      return c.products.filter((p) => normalizeArabic(`${p.name} ${p.description ?? ""}`).includes(n));
    }
    return active ? c.products.filter((p) => p.categoryId === active.id) : [];
  }, [c.products, q, active]);

  const catIndex = new Map(c.categories.map((cat, i) => [cat.id, i] as const));

  return (
    <StoreLayout>
      <div className="sticky top-0 z-30 bg-background/95 pb-3 pt-5 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 md:px-6">
          {searchOpen ? (
            <label className="flex h-11 flex-1 items-center gap-2 rounded-2xl bg-card px-3.5 shadow-card">
              <Search className="size-4 text-primary" />
              <input
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="ابحث في كل المنتجات..."
                className="h-full flex-1 bg-transparent text-sm outline-none"
              />
              <button
                aria-label="اقفل البحث"
                onClick={() => {
                  setText("");
                  setSearchOpen(false);
                }}
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </label>
          ) : (
            <>
              <h1 className="text-2xl font-bold">الأقسام</h1>
              <div className="flex items-center gap-2">
                <button onClick={() => setSearchOpen(true)} aria-label="بحث" className="grid size-11 place-items-center rounded-full bg-card shadow-card">
                  <Search className="size-5" />
                </button>
                <CartButton />
              </div>
            </>
          )}
        </div>
        {!q && (
          <div ref={chipsRef} className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4 md:px-6">
            {c.categories.map((cat) => {
              const Icon = categoryIcon(cat.slug);
              const on = cat.id === active?.id;
              return (
                <Link
                  key={cat.id}
                  to="/categories"
                  search={{ c: cat.slug }}
                  replace
                  data-active={on}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm font-medium transition-colors",
                    on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/40",
                  )}
                >
                  <Icon className="size-4" />
                  {cat.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-4 md:px-6">
        {q && (
          <p className="mb-3 text-sm text-muted-foreground">
            {products.length} نتيجة لـ «{q}»
          </p>
        )}
        {products.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-card/60 px-6 py-16 text-center">
            <p className="font-semibold">{q ? "مفيش منتجات بالاسم ده" : "القسم ده لسه فاضي"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              مش لاقي اللي محتاجه؟ اكتبه في السلة وإحنا نشتريهولك.
            </p>
            <Link to="/cart" className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              اطلب حاجة مش موجودة
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {products.map((p) => {
              const i = p.categoryId ? catIndex.get(p.categoryId) ?? activeIndex : 1;
              return (
                <ProductCard key={p.id} p={p} slug={p.storeId ? "restaurant" : c.categories[i]?.slug} toneIndex={i} />
              );
            })}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
