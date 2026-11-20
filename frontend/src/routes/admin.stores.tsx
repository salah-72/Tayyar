import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Archive, Pencil, Plus, RotateCcw, Store, UtensilsCrossed } from "lucide-react";
import { api } from "@/lib/api/client";
import type { AdminStore } from "@/lib/api/admin-types";
import { AdminPage, LoadingBlock, EmptyState, ErrorBlock } from "@/components/admin/AdminPage";
import { FormSheet, Field, SwitchField, FormSection } from "@/components/admin/form";
import { useAdminMutation } from "@/components/admin/hooks";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/stores")({
  head: () => ({ meta: [{ title: "المحلات والمطاعم — لوحة الإدارة" }] }),
  component: AdminStoresPage,
});

type Draft = { id?: string; name: string; slug: string; type: AdminStore["type"]; sortOrder: string; isActive: boolean; imageUrl?: string | null };
const empty: Draft = { name: "", slug: "", type: "RESTAURANT", sortOrder: "0", isActive: true };

function AdminStoresPage() {
  const [archived, setArchived] = useState(false);
  const [type, setType] = useState<"all" | AdminStore["type"]>("all");
  const [draft, setDraft] = useState<Draft | null>(null);
  const q = useQuery({
    queryKey: ["admin", "stores", archived, type],
    queryFn: () => api<{ stores: AdminStore[] }>("/stores", { query: { archived: archived ? "true" : undefined, type: type === "all" ? undefined : type } }).then((d) => d.stores),
  });
  const save = useAdminMutation(
    (d: Draft) => {
      const body = {
        name: d.name.trim(),
        ...(d.slug.trim() ? { slug: d.slug.trim() } : {}),
        sortOrder: Number(d.sortOrder || 0),
        isActive: d.isActive,
      };
      return d.id ? api(`/stores/${d.id}`, { method: "PATCH", body }) : api<{ store: AdminStore }>("/stores", { method: "POST", body: { ...body, type: d.type } });
    },
    {
      success: "اتحفظ",
      onSuccess: (r, d) => {
        const created = (r as { store?: AdminStore })?.store;
        if (!d.id && created) setDraft({ ...d, id: created.id, imageUrl: created.imageUrl });
        else setDraft(null);
      },
    },
  );
  const archive = useAdminMutation((id: string) => api(`/stores/${id}`, { method: "DELETE" }), { success: "اتأرشف" });
  const restore = useAdminMutation((id: string) => api(`/stores/${id}/restore`, { method: "POST" }), { success: "رجع" });
  const current = draft?.id ? q.data?.find((s) => s.id === draft.id) : undefined;

  return (
    <AdminPage
      title="المحلات والمطاعم"
      description="المطاعم ليها منيو بيظهر للعملاء ورسوم خدمة، والمورّدين بتشتري منهم أصناف البقالة"
      actions={
        <>
          <label className="flex items-center gap-2 text-sm"><Switch checked={archived} onCheckedChange={setArchived} /> المؤرشفة</label>
          <Button onClick={() => setDraft({ ...empty })} className="rounded-xl"><Plus /> إضافة</Button>
        </>
      }
    >
      <div className="mb-4 flex gap-2">
        {([["all", "الكل"], ["RESTAURANT", "مطاعم"], ["SUPPLIER", "مورّدين"]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setType(v)} className={cn("rounded-xl border px-3.5 py-2 text-sm font-medium", type === v ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>{l}</button>
        ))}
      </div>
      {q.isLoading ? (
        <LoadingBlock />
      ) : q.error ? (
        <ErrorBlock message="تعذّر التحميل" onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState title="مفيش حاجة هنا" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-card">
              <span className={cn("grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl", s.type === "RESTAURANT" ? "bg-highlight-soft text-highlight-foreground" : "bg-primary-soft text-primary")}>
                {s.imageUrl ? <img src={s.imageUrl} alt={s.name} className="size-full object-cover" /> : s.type === "RESTAURANT" ? <UtensilsCrossed className="size-6" /> : <Store className="size-6" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.type === "RESTAURANT" ? "مطعم" : "مورّد"} · {s.productsCount} صنف
                </p>
                {!s.isActive && !s.archivedAt && <span className="text-[11px] text-muted-foreground">موقوف</span>}
              </div>
              {s.archivedAt ? (
                <Button size="sm" variant="outline" onClick={() => restore.mutate(s.id)}><RotateCcw /> رجّعه</Button>
              ) : (
                <div className="flex">
                  <Button size="icon" variant="ghost" aria-label="تعديل" onClick={() => setDraft({ id: s.id, name: s.name, slug: s.slug, type: s.type, sortOrder: String(s.sortOrder), isActive: s.isActive, imageUrl: s.imageUrl })}><Pencil /></Button>
                  <ConfirmButton trigger={<Button size="icon" variant="ghost" className="text-destructive" aria-label="أرشفة"><Archive /></Button>} title={`أرشفة ${s.name}؟`} description="هيختفي من الموقع، والحسابات القديمة هتفضل." confirmLabel="أرشف" onConfirm={() => archive.mutate(s.id)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <FormSheet open={!!draft} onOpenChange={(o) => !o && setDraft(null)} title={draft?.id ? `تعديل ${draft.name}` : "إضافة محل أو مطعم"} busy={save.isPending} onSubmit={() => draft && save.mutate(draft)}>
        {draft && (
          <>
            <FormSection title="النوع">
              <div className="grid grid-cols-2 gap-2">
                {(["RESTAURANT", "SUPPLIER"] as const).map((t) => (
                  <button key={t} type="button" disabled={!!draft.id} onClick={() => setDraft({ ...draft, type: t })} className={cn("rounded-xl border p-3 text-start text-sm disabled:opacity-60", draft.type === t ? "border-primary bg-primary-soft" : "bg-card")}>
                    <span className="block font-semibold">{t === "RESTAURANT" ? "مطعم" : "مورّد"}</span>
                    <span className="block text-xs text-muted-foreground">{t === "RESTAURANT" ? "ليه منيو بيظهر للعملاء" : "بتشتري منه البقالة"}</span>
                  </button>
                ))}
              </div>
              {draft.id && <p className="text-xs text-muted-foreground">النوع مبيتغيّرش بعد الإضافة.</p>}
            </FormSection>
            <FormSection title="البيانات">
              <Field label="الاسم"><Input required minLength={2} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
              <Field label="الرابط (slug)" hint="اختياري، بالإنجليزي"><Input dir="ltr" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} /></Field>
              <Field label="الترتيب"><Input type="number" min={0} value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} /></Field>
              <SwitchField label="شغّال" checked={draft.isActive} onChange={(v) => setDraft({ ...draft, isActive: v })} />
              {draft.type === "RESTAURANT" && <p className="text-xs text-muted-foreground">أقسام المنيو (بيتزا، كريب…) بتتحدد من خانة «قسم المنيو» في كل صنف.</p>}
            </FormSection>
            <FormSection title="الصورة">
              {draft.id ? <ImageUploader endpoint={`/stores/${draft.id}/image`} imageUrl={current?.imageUrl ?? draft.imageUrl} /> : <p className="text-sm text-muted-foreground">احفظ الأول وبعدين ارفع الصورة.</p>}
            </FormSection>
          </>
        )}
      </FormSheet>
    </AdminPage>
  );
}
