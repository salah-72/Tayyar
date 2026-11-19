import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Archive, BadgePercent, ChevronLeft, ChevronRight, Pencil, Plus, RotateCcw, Search, Star } from "lucide-react";
import { api, apiPage } from "@/lib/api/client";
import { SALE_MODES, UNITS, unitLabel, type AdminCategory, type AdminDiscountKind, type AdminOptionGroup, type AdminProduct, type AdminStore } from "@/lib/api/admin-types";
import type { SaleMode } from "@/lib/api/types";
import { formatMoney, toMinor } from "@/lib/money";
import { AdminPage, LoadingBlock, EmptyState, ErrorBlock } from "@/components/admin/AdminPage";
import { FormSheet, Field, SwitchField, FormSection } from "@/components/admin/form";
import { useAdminMutation } from "@/components/admin/hooks";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { DiscountFields, discountFromForm, discountText, discountToForm } from "@/components/admin/DiscountFields";
import { ProductImage } from "@/components/store/ProductImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "المنتجات — لوحة الإدارة" }] }),
  component: AdminProductsPage,
});

type Kind = "grocery" | "restaurant";
type Draft = {
  id?: string;
  kind: Kind;
  name: string;
  description: string;
  categoryId: string;
  storeId: string; // supplier (grocery, optional) or restaurant (required)
  menuSection: string;
  unit: string;
  saleMode: SaleMode;
  price: string;
  minQty: string;
  qtyStep: string;
  weightChoices: string;
  discountKind: AdminDiscountKind;
  discountValue: string;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: string;
  optionGroupIds: string[];
  imageUrl?: string | null;
};

const empty = (kind: Kind): Draft => ({
  kind,
  name: "",
  description: "",
  categoryId: "",
  storeId: "none",
  menuSection: "",
  unit: kind === "restaurant" ? "DISH" : "PIECE",
  saleMode: "UNIT",
  price: "",
  minQty: "1",
  qtyStep: "1",
  weightChoices: "",
  discountKind: null,
  discountValue: "",
  isFeatured: false,
  isActive: true,
  sortOrder: "0",
  optionGroupIds: [],
});

function fromProduct(p: AdminProduct): Draft {
  return {
    id: p.id,
    kind: p.storeType === "RESTAURANT" ? "restaurant" : "grocery",
    name: p.name,
    description: p.description ?? "",
    categoryId: p.categoryId ?? "",
    storeId: p.storeId ?? "none",
    menuSection: p.menuSection ?? "",
    unit: p.unit,
    saleMode: p.saleMode,
    price: String(p.priceMinor / 100),
    minQty: String(p.minQty),
    qtyStep: String(p.qtyStep),
    weightChoices: p.weightChoices.join("، "),
    discountKind: p.discountKind,
    discountValue: discountToForm(p.discountKind, p.discountValue),
    isFeatured: p.isFeatured,
    isActive: p.isActive,
    sortOrder: String(p.sortOrder),
    optionGroupIds: p.optionGroups.map((g) => g.id),
    imageUrl: p.imageUrl,
  };
}

function toBody(d: Draft) {
  const weights = d.weightChoices
    .split(/[,،\s]+/)
    .map((x) => Number(x))
    .filter((x) => x > 0);
  const restaurant = d.kind === "restaurant";
  return {
    name: d.name.trim(),
    description: d.description.trim() || null,
    categoryId: restaurant ? null : d.categoryId || null,
    storeId: d.storeId === "none" ? null : d.storeId,
    menuSection: restaurant ? d.menuSection.trim() || null : null,
    unit: d.unit,
    saleMode: d.saleMode,
    priceMinor: toMinor(d.price || 0),
    minQty: Number(d.minQty || 1),
    qtyStep: Number(d.qtyStep || 1),
    weightChoices: d.saleMode === "WEIGHT" || d.saleMode === "PIECE_WEIGHT" ? weights : [],
    ...discountFromForm(d.discountKind, d.discountValue),
    isFeatured: d.isFeatured,
    isActive: d.isActive,
    sortOrder: Number(d.sortOrder || 0),
    optionGroupIds: d.optionGroupIds,
  };
}

function AdminProductsPage() {
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [storeId, setStoreId] = useState("all");
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulk, setBulk] = useState<{ kind: AdminDiscountKind; value: string }>({ kind: "PERCENT", value: "" });

  const categories = useQuery({ queryKey: ["admin", "categories", false], queryFn: () => api<{ categories: AdminCategory[] }>("/categories").then((d) => d.categories) });
  const stores = useQuery({ queryKey: ["admin", "stores", false, "all"], queryFn: () => api<{ stores: AdminStore[] }>("/stores").then((d) => d.stores) });
  const groups = useQuery({ queryKey: ["admin", "option-groups"], queryFn: () => api<{ groups: AdminOptionGroup[] }>("/option-groups").then((d) => d.groups) });
  const list = useQuery({
    queryKey: ["admin", "products", { q, categoryId, storeId, archived, page }],
    queryFn: () =>
      apiPage<{ products: AdminProduct[] }>("/products", {
        query: { q: q.trim() || undefined, categoryId: categoryId === "all" ? undefined : categoryId, storeId: storeId === "all" ? undefined : storeId, archived: archived ? "true" : undefined, page, limit: 30 },
      }),
    placeholderData: keepPreviousData,
  });

  const save = useAdminMutation(
    (d: Draft) => (d.id ? api(`/products/${d.id}`, { method: "PATCH", body: toBody(d) }) : api<{ product: AdminProduct }>("/products", { method: "POST", body: toBody(d) })),
    {
      success: "المنتج اتحفظ",
      onSuccess: (r, d) => {
        const created = (r as { product?: AdminProduct })?.product;
        if (!d.id && created) setDraft({ ...d, id: created.id, imageUrl: created.imageUrl });
        else setDraft(null);
      },
    },
  );
  const archive = useAdminMutation((id: string) => api(`/products/${id}`, { method: "DELETE" }), { success: "المنتج اتأرشف" });
  const restore = useAdminMutation((id: string) => api(`/products/${id}/restore`, { method: "POST" }), { success: "المنتج رجع" });
  const bulkDiscount = useAdminMutation(
    () => api("/products/bulk-discount", { method: "POST", body: { productIds: selected, ...discountFromForm(bulk.kind, bulk.value) } }),
    { success: "الخصم اتطبّق", onSuccess: () => { setBulkOpen(false); setSelected([]); } },
  );

  const restaurants = stores.data?.filter((s) => s.type === "RESTAURANT") ?? [];
  const suppliers = stores.data?.filter((s) => s.type === "SUPPLIER") ?? [];
  const rows = list.data?.data.products ?? [];
  const current = draft?.id ? rows.find((p) => p.id === draft.id) : undefined;
  const toggleSel = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <AdminPage
      title="المنتجات"
      description="أصناف البقالة ومنيو المطاعم"
      actions={
        <>
          <Button variant="outline" className="rounded-xl" onClick={() => setDraft(empty("restaurant"))}><Plus /> صنف مطعم</Button>
          <Button className="rounded-xl" onClick={() => setDraft(empty("grocery"))}><Plus /> منتج بقالة</Button>
        </>
      }
    >
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="ابحث بالاسم" className="h-10 rounded-xl ps-9" />
        </label>
        <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setPage(1); }} dir="rtl">
          <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأقسام</SelectItem>
            {categories.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={storeId} onValueChange={(v) => { setStoreId(v); setPage(1); }} dir="rtl">
          <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المحلات والمطاعم</SelectItem>
            {stores.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <label className="flex h-10 items-center gap-2 text-sm"><Switch checked={archived} onCheckedChange={(v) => { setArchived(v); setPage(1); }} /> المؤرشفة</label>
      </div>

      {selected.length > 0 && (
        <div className="sticky top-14 z-20 mb-3 flex items-center justify-between gap-3 rounded-2xl bg-primary-deep px-4 py-3 text-primary-foreground lg:top-2">
          <span className="text-sm">اخترت {selected.length} منتج</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setBulkOpen(true)}><BadgePercent /> خصم جماعي</Button>
            <Button size="sm" variant="ghost" className="hover:bg-primary-foreground/10" onClick={() => setSelected([])}>إلغاء</Button>
          </div>
        </div>
      )}

      {list.isLoading ? (
        <LoadingBlock />
      ) : list.error ? (
        <ErrorBlock message="تعذّر تحميل المنتجات" onRetry={() => list.refetch()} />
      ) : !rows.length ? (
        <EmptyState title="مفيش منتجات" description="غيّر الفلاتر أو ضيف منتج جديد." />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((p) => {
              const disc = discountText(p.discountKind, p.discountValue);
              return (
                <div key={p.id} className={cn("flex gap-3 rounded-2xl border bg-card p-3 shadow-card", selected.includes(p.id) && "border-primary ring-1 ring-primary")}>
                  <div className="flex flex-col items-center gap-2">
                    <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggleSel(p.id)} aria-label="اختيار" />
                    <div className="size-16 overflow-hidden rounded-xl">
                      <ProductImage src={p.imageUrl} alt={p.name} slug={p.storeType === "RESTAURANT" ? "restaurant" : undefined} toneIndex={p.storeType === "RESTAURANT" ? 1 : 0} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-semibold leading-snug">
                      {p.isFeatured && <Star className="me-1 inline size-3.5 fill-highlight text-highlight" />}
                      {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.storeType === "RESTAURANT" ? `${p.storeName}${p.menuSection ? ` · ${p.menuSection}` : ""}` : p.categoryName ?? "—"}
                    </p>
                    <p className="mt-1 text-sm font-bold text-primary-deep">
                      {formatMoney(p.priceMinor)} <span className="text-xs font-normal text-muted-foreground">/ {unitLabel(p.unit)}</span>
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                      {!p.isActive && <span className="rounded-full bg-muted px-2 py-0.5">مخفي</span>}
                      {disc && <span className="rounded-full bg-sale/10 px-2 py-0.5 text-sale">{disc}</span>}
                      {p.discountKind === null && p.categoryId && <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">خصم القسم</span>}
                      {p.optionGroups.length > 0 && <span className="rounded-full bg-info/10 px-2 py-0.5 text-info">{p.optionGroups.length} خيارات</span>}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    {p.archivedAt ? (
                      <Button size="icon" variant="ghost" aria-label="رجّعه" onClick={() => restore.mutate(p.id)}><RotateCcw /></Button>
                    ) : (
                      <>
                        <Button size="icon" variant="ghost" aria-label="تعديل" onClick={() => setDraft(fromProduct(p))}><Pencil /></Button>
                        <ConfirmButton trigger={<Button size="icon" variant="ghost" className="text-destructive" aria-label="أرشفة"><Archive /></Button>} title={`أرشفة ${p.name}؟`} description="هيختفي من الموقع، والأوردرات القديمة هتفضل." confirmLabel="أرشف" onConfirm={() => archive.mutate(p.id)} />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {list.data?.meta && list.data.meta.pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="السابق"><ChevronRight /></Button>
              <span className="text-sm text-muted-foreground">صفحة {list.data.meta.page} من {list.data.meta.pages} · {list.data.meta.total} منتج</span>
              <Button variant="outline" size="icon" disabled={page >= list.data.meta.pages} onClick={() => setPage((p) => p + 1)} aria-label="التالي"><ChevronLeft /></Button>
            </div>
          )}
        </>
      )}

      <FormSheet wide open={!!draft} onOpenChange={(o) => !o && setDraft(null)} title={draft?.id ? `تعديل ${draft.name}` : draft?.kind === "restaurant" ? "صنف مطعم جديد" : "منتج بقالة جديد"} busy={save.isPending} onSubmit={() => draft && save.mutate(draft)}>
        {draft && (
          <ProductForm
            d={draft}
            set={setDraft}
            categories={categories.data ?? []}
            restaurants={restaurants}
            suppliers={suppliers}
            groups={groups.data ?? []}
            image={draft.id ? <ImageUploader endpoint={`/products/${draft.id}/image`} imageUrl={current?.imageUrl ?? draft.imageUrl} /> : <p className="text-sm text-muted-foreground">احفظ المنتج الأول وبعدين ارفع الصورة.</p>}
          />
        )}
      </FormSheet>

      <FormSheet open={bulkOpen} onOpenChange={setBulkOpen} title={`خصم على ${selected.length} منتج`} submitLabel="طبّق" busy={bulkDiscount.isPending} onSubmit={() => bulkDiscount.mutate(undefined)}>
        <DiscountFields allowInherit kind={bulk.kind} value={bulk.value} onChange={(k, v) => setBulk({ kind: k, value: v })} />
        <p className="text-xs text-muted-foreground">«زي القسم» بيشيل خصم المنتج ويخليه ياخد خصم القسم.</p>
      </FormSheet>
    </AdminPage>
  );
}

function ProductForm({
  d,
  set,
  categories,
  restaurants,
  suppliers,
  groups,
  image,
}: {
  d: Draft;
  set: (d: Draft) => void;
  categories: AdminCategory[];
  restaurants: AdminStore[];
  suppliers: AdminStore[];
  groups: AdminOptionGroup[];
  image: React.ReactNode;
}) {
  const up = (patch: Partial<Draft>) => set({ ...d, ...patch });
  const restaurant = d.kind === "restaurant";
  const unitsFor = d.saleMode === "WEIGHT" ? UNITS.filter((u) => u.value === "KG" || u.value === "LITER") : d.saleMode === "PIECE_WEIGHT" ? UNITS.filter((u) => u.value === "PIECE") : UNITS.filter((u) => u.value !== "KG");
  const priceLabel = d.saleMode === "UNIT" ? `السعر لل${unitLabel(d.unit)} (جنيه)` : "السعر للكيلو (جنيه)";

  function setMode(m: SaleMode) {
    const unit = m === "WEIGHT" ? "KG" : m === "PIECE_WEIGHT" ? "PIECE" : d.unit === "KG" || d.unit === "LITER" ? (restaurant ? "DISH" : "PIECE") : d.unit;
    up({ saleMode: m, unit, ...(m === "WEIGHT" ? { minQty: "0.5", qtyStep: "0.5" } : { minQty: "1", qtyStep: "1" }) });
  }

  return (
    <>
      {!d.id && (
        <div className="grid grid-cols-2 gap-2">
          {(["grocery", "restaurant"] as const).map((k) => (
            <button key={k} type="button" onClick={() => up({ ...empty(k), name: d.name })} className={cn("rounded-xl border p-3 text-sm font-medium", d.kind === k ? "border-primary bg-primary-soft text-primary-deep" : "bg-card")}>
              {k === "grocery" ? "منتج بقالة" : "صنف في منيو مطعم"}
            </button>
          ))}
        </div>
      )}
      <FormSection title="البيانات الأساسية">
        <Field label="اسم المنتج"><Input required minLength={2} maxLength={150} value={d.name} onChange={(e) => up({ name: e.target.value })} /></Field>
        <Field label="الوصف (اختياري)"><Textarea maxLength={500} value={d.description} onChange={(e) => up({ description: e.target.value })} /></Field>
        {restaurant ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="المطعم">
              <Select value={d.storeId === "none" ? "" : d.storeId} onValueChange={(v) => up({ storeId: v })} dir="rtl">
                <SelectTrigger><SelectValue placeholder="اختار المطعم" /></SelectTrigger>
                <SelectContent>{restaurants.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="قسم المنيو" hint="مثال: بيتزا، كريب"><Input maxLength={60} value={d.menuSection} onChange={(e) => up({ menuSection: e.target.value })} /></Field>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="القسم">
              <Select value={d.categoryId} onValueChange={(v) => up({ categoryId: v })} dir="rtl">
                <SelectTrigger><SelectValue placeholder="اختار القسم" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="المورّد (اختياري)" hint="بتشتريه منين">
              <Select value={d.storeId} onValueChange={(v) => up({ storeId: v })} dir="rtl">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">حسب القسم</SelectItem>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}
      </FormSection>

      <FormSection title="طريقة البيع والسعر">
        <div className="grid gap-2 sm:grid-cols-3">
          {SALE_MODES.map((m) => (
            <button key={m.value} type="button" onClick={() => setMode(m.value)} className={cn("rounded-xl border p-3 text-start", d.saleMode === m.value ? "border-primary bg-primary-soft" : "bg-card")}>
              <span className="block text-sm font-semibold">{m.label}</span>
              <span className="block text-[11px] text-muted-foreground">{m.hint}</span>
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="الوحدة">
            <Select value={d.unit} onValueChange={(v) => up({ unit: v })} dir="rtl">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{unitsFor.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label={priceLabel}><Input type="number" required min={0} step="0.01" value={d.price} onChange={(e) => up({ price: e.target.value })} /></Field>
          <Field label="أقل كمية" hint={d.saleMode === "WEIGHT" ? "بالكيلو، مثال 0.5" : "عدد صحيح"}><Input type="number" min={0.001} step="any" value={d.minQty} onChange={(e) => up({ minQty: e.target.value })} /></Field>
          <Field label="الزيادة كل مرة" hint="أقل كمية لازم تكون من مضاعفاتها"><Input type="number" min={0.001} step="any" value={d.qtyStep} onChange={(e) => up({ qtyStep: e.target.value })} /></Field>
        </div>
        {(d.saleMode === "PIECE_WEIGHT" || d.saleMode === "WEIGHT") && (
          <Field label={d.saleMode === "PIECE_WEIGHT" ? "أوزان القطعة المتاحة (كيلو)" : "أوزان سريعة (اختياري)"} hint="افصل بينهم بفاصلة، مثال: 1.5، 2، 2.5 (لحد 12 وزن)">
            <Input dir="ltr" required={d.saleMode === "PIECE_WEIGHT"} value={d.weightChoices} onChange={(e) => up({ weightChoices: e.target.value })} className="text-right" />
          </Field>
        )}
      </FormSection>

      <FormSection title="الخصم">
        <DiscountFields allowInherit={!restaurant} kind={restaurant && d.discountKind === null ? "NONE" : d.discountKind} value={d.discountValue} onChange={(k, v) => up({ discountKind: k, discountValue: v })} />
      </FormSection>

      {groups.length > 0 && (
        <FormSection title="خيارات التجهيز">
          <div className="grid gap-2 sm:grid-cols-2">
            {groups.map((g) => (
              <label key={g.id} className="flex cursor-pointer items-center gap-2 rounded-xl border bg-card p-3 text-sm">
                <Checkbox
                  checked={d.optionGroupIds.includes(g.id)}
                  onCheckedChange={(c) => up({ optionGroupIds: c ? [...d.optionGroupIds, g.id] : d.optionGroupIds.filter((x) => x !== g.id) })}
                />
                <span className="flex-1">{g.name}</span>
                <span className="text-xs text-muted-foreground">{g.options.length} خيار</span>
              </label>
            ))}
          </div>
        </FormSection>
      )}

      <FormSection title="الظهور">
        <SwitchField label="ظاهر ومتاح للطلب" checked={d.isActive} onChange={(v) => up({ isActive: v })} />
        <SwitchField label="منتج مميز" hint="بيظهر في «الأكثر طلبًا» في الرئيسية" checked={d.isFeatured} onChange={(v) => up({ isFeatured: v })} />
        <Field label="الترتيب"><Input type="number" min={0} value={d.sortOrder} onChange={(e) => up({ sortOrder: e.target.value })} /></Field>
      </FormSection>

      <FormSection title="الصورة">{image}</FormSection>
    </>
  );
}
