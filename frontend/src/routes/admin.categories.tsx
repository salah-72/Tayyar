import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Archive, Pencil, Plus, RotateCcw } from "lucide-react";
import { api } from "@/lib/api/client";
import type { AdminCategory, AdminDiscountKind, AdminStore } from "@/lib/api/admin-types";
import { AdminPage, LoadingBlock, EmptyState, ErrorBlock } from "@/components/admin/AdminPage";
import { FormSheet, Field, SwitchField, FormSection } from "@/components/admin/form";
import { useAdminMutation } from "@/components/admin/hooks";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { DiscountFields, discountFromForm, discountText, discountToForm } from "@/components/admin/DiscountFields";
import { categoryIcon, categoryTone } from "@/components/store/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({ meta: [{ title: "الأقسام — لوحة الإدارة" }] }),
  component: AdminCategoriesPage,
});

type Draft = { id?: string; name: string; slug: string; sortOrder: string; isActive: boolean; discountKind: AdminDiscountKind; discountValue: string; defaultStoreId: string; imageUrl?: string | null };
const empty: Draft = { name: "", slug: "", sortOrder: "0", isActive: true, discountKind: "NONE", discountValue: "", defaultStoreId: "none" };

function AdminCategoriesPage() {
  const [archived, setArchived] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const q = useQuery({
    queryKey: ["admin", "categories", archived],
    queryFn: () => api<{ categories: AdminCategory[] }>("/categories", { query: archived ? { archived: "true" } : {} }).then((d) => d.categories),
  });
  const suppliers = useQuery({
    queryKey: ["admin", "stores", "SUPPLIER"],
    queryFn: () => api<{ stores: AdminStore[] }>("/stores", { query: { type: "SUPPLIER" } }).then((d) => d.stores),
  });
  const save = useAdminMutation(
    (d: Draft) => {
      const body = {
        name: d.name.trim(),
        ...(d.slug.trim() ? { slug: d.slug.trim() } : {}),
        sortOrder: Number(d.sortOrder || 0),
        isActive: d.isActive,
        ...discountFromForm(d.discountKind, d.discountValue),
        defaultStoreId: d.defaultStoreId === "none" ? null : d.defaultStoreId,
      };
      return d.id ? api(`/categories/${d.id}`, { method: "PATCH", body }) : api<{ category: AdminCategory }>("/categories", { method: "POST", body });
    },
    {
      success: "القسم اتحفظ",
      onSuccess: (r, d) => {
        const created = (r as { category?: AdminCategory })?.category;
        if (!d.id && created) setDraft({ ...d, id: created.id, imageUrl: created.imageUrl });
        else setDraft(null);
      },
    },
  );
  const archive = useAdminMutation((id: string) => api(`/categories/${id}`, { method: "DELETE" }), { success: "القسم اتأرشف" });
  const restore = useAdminMutation((id: string) => api(`/categories/${id}/restore`, { method: "POST" }), { success: "القسم رجع" });

  const current = draft?.id ? q.data?.find((c) => c.id === draft.id) : undefined;

  return (
    <AdminPage
      title="الأقسام"
      description="أقسام البقالة اللي بتظهر في الموقع (المطاعم ليها منيو منفصل)"
      actions={
        <>
          <label className="flex items-center gap-2 text-sm"><Switch checked={archived} onCheckedChange={setArchived} /> المؤرشفة</label>
          <Button onClick={() => setDraft({ ...empty })} className="rounded-xl"><Plus /> قسم جديد</Button>
        </>
      }
    >
      {q.isLoading ? (
        <LoadingBlock />
      ) : q.error ? (
        <ErrorBlock message="تعذّر التحميل" onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState title={archived ? "مفيش أقسام مؤرشفة" : "لسه مفيش أقسام"} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.map((c, i) => {
            const Icon = categoryIcon(c.slug);
            const disc = discountText(c.discountKind, c.discountValue);
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-card">
                <span className={`grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl ${categoryTone(i)}`}>
                  {c.imageUrl ? <img src={c.imageUrl} alt={c.name} className="size-full object-cover" /> : <Icon className="size-6" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{c.name}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">/{c.slug}</p>
                  <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                    {!c.isActive && <span className="rounded-full bg-muted px-2 py-0.5">مخفي</span>}
                    {disc && <span className="rounded-full bg-sale/10 px-2 py-0.5 text-sale">{disc}</span>}
                  </div>
                </div>
                {c.archivedAt ? (
                  <Button size="sm" variant="outline" onClick={() => restore.mutate(c.id)}><RotateCcw /> رجّعه</Button>
                ) : (
                  <div className="flex">
                    <Button size="icon" variant="ghost" aria-label="تعديل" onClick={() => setDraft({ id: c.id, name: c.name, slug: c.slug, sortOrder: String(c.sortOrder), isActive: c.isActive, discountKind: c.discountKind ?? "NONE", discountValue: discountToForm(c.discountKind, c.discountValue), defaultStoreId: c.defaultStoreId ?? "none", imageUrl: c.imageUrl })}><Pencil /></Button>
                    <ConfirmButton trigger={<Button size="icon" variant="ghost" className="text-destructive" aria-label="أرشفة"><Archive /></Button>} title={`أرشفة ${c.name}؟`} description="مينفعش تأرشف قسم فيه منتجات، انقلها أو أرشفها الأول." confirmLabel="أرشف" onConfirm={() => archive.mutate(c.id)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <FormSheet open={!!draft} onOpenChange={(o) => !o && setDraft(null)} title={draft?.id ? "تعديل قسم" : "قسم جديد"} busy={save.isPending} onSubmit={() => draft && save.mutate(draft)}>
        {draft && (
          <>
            <FormSection title="البيانات">
              <Field label="اسم القسم"><Input required minLength={2} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
              <Field label="الرابط (slug)" hint="اختياري، بالإنجليزي. بيتعمل تلقائي لو سيبته فاضي"><Input dir="ltr" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} /></Field>
              <Field label="الترتيب" hint="الأصغر يظهر الأول"><Input type="number" min={0} value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} /></Field>
              <Field label="المورّد الافتراضي" hint="المحل اللي بتشتري منه أصناف القسم ده عادةً">
                <Select value={draft.defaultStoreId} onValueChange={(v) => setDraft({ ...draft, defaultStoreId: v })} dir="rtl">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">من غير</SelectItem>
                    {suppliers.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <SwitchField label="ظاهر للعملاء" checked={draft.isActive} onChange={(v) => setDraft({ ...draft, isActive: v })} />
            </FormSection>
            <FormSection title="خصم على القسم كله">
              <DiscountFields kind={draft.discountKind} value={draft.discountValue} onChange={(k, v) => setDraft({ ...draft, discountKind: k, discountValue: v })} />
            </FormSection>
            <FormSection title="الصورة">
              {draft.id ? <ImageUploader endpoint={`/categories/${draft.id}/image`} imageUrl={current?.imageUrl ?? draft.imageUrl} /> : <p className="text-sm text-muted-foreground">احفظ القسم الأول وبعدين ارفع الصورة.</p>}
            </FormSection>
          </>
        )}
      </FormSheet>
    </AdminPage>
  );
}
