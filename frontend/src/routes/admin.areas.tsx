import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Archive, MapPin, Pencil, Plus, RotateCcw } from "lucide-react";
import { api } from "@/lib/api/client";
import type { AdminArea } from "@/lib/api/admin-types";
import { formatMoney, toMinor } from "@/lib/money";
import { AdminPage, LoadingBlock, EmptyState, ErrorBlock } from "@/components/admin/AdminPage";
import { FormSheet, Field, SwitchField, egpStr } from "@/components/admin/form";
import { useAdminMutation } from "@/components/admin/hooks";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/areas")({
  head: () => ({ meta: [{ title: "البلاد والتوصيل — لوحة الإدارة" }] }),
  component: AdminAreasPage,
});

type Draft = { id?: string; name: string; fee: string; sortOrder: string; isActive: boolean };
const empty: Draft = { name: "", fee: "", sortOrder: "0", isActive: true };

function AdminAreasPage() {
  const [archived, setArchived] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const q = useQuery({
    queryKey: ["admin", "areas", archived],
    queryFn: () => api<{ areas: AdminArea[] }>("/areas", { query: archived ? { archived: "true" } : {} }).then((d) => d.areas),
  });
  const save = useAdminMutation(
    (d: Draft) => {
      const body = { name: d.name.trim(), feeMinor: toMinor(d.fee || 0), sortOrder: Number(d.sortOrder || 0), isActive: d.isActive };
      return d.id ? api(`/areas/${d.id}`, { method: "PATCH", body }) : api("/areas", { method: "POST", body });
    },
    { success: "اتحفظت", onSuccess: () => setDraft(null) },
  );
  const archive = useAdminMutation((id: string) => api(`/areas/${id}`, { method: "DELETE" }), { success: "اتأرشفت" });
  const restore = useAdminMutation((id: string) => api(`/areas/${id}/restore`, { method: "POST" }), { success: "رجعت تاني" });

  return (
    <AdminPage
      title="البلاد والتوصيل"
      description="البلاد اللي بتوصّلها وسعر التوصيل لكل واحدة"
      actions={
        <>
          <label className="flex items-center gap-2 text-sm"><Switch checked={archived} onCheckedChange={setArchived} /> المؤرشفة</label>
          <Button onClick={() => setDraft({ ...empty })} className="rounded-xl"><Plus /> بلد جديدة</Button>
        </>
      }
    >
      {q.isLoading ? (
        <LoadingBlock />
      ) : q.error ? (
        <ErrorBlock message="تعذّر التحميل" onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState title={archived ? "مفيش بلاد مؤرشفة" : "لسه مفيش بلاد"} description={archived ? undefined : "ضيف أول بلد بتوصّلها."} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-card">
              <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><MapPin className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{a.name} {!a.isActive && !a.archivedAt && <span className="text-xs font-normal text-muted-foreground">(موقوفة)</span>}</p>
                <p className="text-sm text-primary-deep">توصيل {formatMoney(a.feeMinor)}</p>
              </div>
              {a.archivedAt ? (
                <Button size="sm" variant="outline" onClick={() => restore.mutate(a.id)}><RotateCcw /> رجّعها</Button>
              ) : (
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" aria-label="تعديل" onClick={() => setDraft({ id: a.id, name: a.name, fee: egpStr(a.feeMinor), sortOrder: String(a.sortOrder), isActive: a.isActive })}><Pencil /></Button>
                  <ConfirmButton trigger={<Button size="icon" variant="ghost" aria-label="أرشفة" className="text-destructive"><Archive /></Button>} title={`أرشفة ${a.name}؟`} description="البلد هتختفي من الموقع، والأوردرات القديمة هتفضل زي ما هي." confirmLabel="أرشف" onConfirm={() => archive.mutate(a.id)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <FormSheet open={!!draft} onOpenChange={(o) => !o && setDraft(null)} title={draft?.id ? "تعديل بلد" : "بلد جديدة"} busy={save.isPending} onSubmit={() => draft && save.mutate(draft)}>
        {draft && (
          <>
            <Field label="اسم البلد" htmlFor="a-name"><Input id="a-name" required minLength={2} maxLength={60} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
            <Field label="سعر التوصيل (جنيه)" htmlFor="a-fee"><Input id="a-fee" type="number" min={0} step="0.5" required value={draft.fee} onChange={(e) => setDraft({ ...draft, fee: e.target.value })} /></Field>
            <Field label="الترتيب" hint="الأصغر يظهر الأول" htmlFor="a-sort"><Input id="a-sort" type="number" min={0} value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} /></Field>
            <SwitchField label="متاحة للعملاء" checked={draft.isActive} onChange={(v) => setDraft({ ...draft, isActive: v })} />
          </>
        )}
      </FormSheet>
    </AdminPage>
  );
}
