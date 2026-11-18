import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BadgePercent, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import type { AdminDiscount, DiscountStatus } from "@/lib/api/admin-types";
import { formatMoney, toMinor, bpsToPercent } from "@/lib/money";
import { AdminPage, LoadingBlock, EmptyState, ErrorBlock } from "@/components/admin/AdminPage";
import { FormSheet, Field, SwitchField, FormSection, egpStr } from "@/components/admin/form";
import { useAdminMutation, fmtDate } from "@/components/admin/hooks";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/discounts")({
  head: () => ({ meta: [{ title: "خصومات الفاتورة — لوحة الإدارة" }] }),
  component: AdminDiscountsPage,
});

const STATUS: Record<DiscountStatus, { l: string; t: string }> = {
  LIVE: { l: "شغّال", t: "bg-success/10 text-success" },
  DISABLED: { l: "موقوف", t: "bg-muted text-muted-foreground" },
  SCHEDULED: { l: "مجدول", t: "bg-info/10 text-info" },
  EXPIRED: { l: "خلص", t: "bg-destructive/10 text-destructive" },
  EXHAUSTED: { l: "استُهلك", t: "bg-highlight-soft text-highlight-foreground" },
};

type Draft = {
  id?: string;
  name: string;
  auto: boolean;
  code: string;
  kind: "PERCENT" | "FIXED";
  value: string;
  min: string;
  max: string;
  startsAt: string;
  endsAt: string;
  maxUses: string;
  isActive: boolean;
};
const empty: Draft = { name: "", auto: false, code: "", kind: "PERCENT", value: "", min: "0", max: "", startsAt: "", endsAt: "", maxUses: "", isActive: true };

const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

function fromDiscount(d: AdminDiscount): Draft {
  return {
    id: d.id,
    name: d.name,
    auto: d.code == null,
    code: d.code ?? "",
    kind: d.kind,
    value: d.kind === "PERCENT" ? String(d.value / 100) : egpStr(d.value),
    min: egpStr(d.minSubtotalMinor),
    max: egpStr(d.maxDiscountMinor),
    startsAt: toLocal(d.startsAt),
    endsAt: toLocal(d.endsAt),
    maxUses: d.maxUses == null ? "" : String(d.maxUses),
    isActive: d.isActive,
  };
}

function AdminDiscountsPage() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const q = useQuery({ queryKey: ["admin", "discounts"], queryFn: () => api<{ discounts: AdminDiscount[] }>("/discounts").then((d) => d.discounts) });
  const detail = useQuery({
    queryKey: ["admin", "discount", draft?.id],
    queryFn: () => api<{ discount: AdminDiscount }>(`/discounts/${draft!.id}`).then((d) => d.discount),
    enabled: !!draft?.id,
  });
  const save = useAdminMutation(
    (d: Draft) => {
      const body = {
        name: d.name.trim(),
        code: d.auto ? null : d.code.trim().toUpperCase(),
        kind: d.kind,
        value: d.kind === "PERCENT" ? Math.round(Number(d.value) * 100) : toMinor(d.value),
        minSubtotalMinor: toMinor(d.min || 0),
        maxDiscountMinor: d.kind === "PERCENT" && d.max ? toMinor(d.max) : null,
        startsAt: d.startsAt ? new Date(d.startsAt).toISOString() : null,
        endsAt: d.endsAt ? new Date(d.endsAt).toISOString() : null,
        maxUses: d.maxUses ? Number(d.maxUses) : null,
        isActive: d.isActive,
      };
      return d.id ? api(`/discounts/${d.id}`, { method: "PATCH", body }) : api("/discounts", { method: "POST", body });
    },
    { success: "الخصم اتحفظ", onSuccess: () => setDraft(null) },
  );
  const del = useAdminMutation((id: string) => api(`/discounts/${id}`, { method: "DELETE" }), { success: "الخصم اتمسح" });
  const toggle = useAdminMutation((v: { id: string; isActive: boolean }) => api(`/discounts/${v.id}`, { method: "PATCH", body: { isActive: v.isActive } }), { success: "اتحفظ" });

  return (
    <AdminPage title="خصومات الفاتورة" description="أكواد خصم أو خصومات تلقائية على إجمالي الطلب" actions={<Button onClick={() => setDraft({ ...empty })} className="rounded-xl"><Plus /> خصم جديد</Button>}>
      {q.isLoading ? (
        <LoadingBlock />
      ) : q.error ? (
        <ErrorBlock message="تعذّر التحميل" onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState title="مفيش خصومات" description="اعمل كود خصم أو عرض تلقائي على الطلبات الكبيرة." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {q.data.map((d) => (
            <div key={d.id} className="rounded-2xl border bg-card p-4 shadow-card">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-saffron text-highlight-foreground"><BadgePercent className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{d.name}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", STATUS[d.status].t)}>{STATUS[d.status].l}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {d.code ? <span className="font-mono font-semibold text-foreground" dir="ltr">{d.code}</span> : "تلقائي"} ·{" "}
                    {d.kind === "PERCENT" ? `${bpsToPercent(d.value)}${d.maxDiscountMinor ? ` (أقصى ${formatMoney(d.maxDiscountMinor)})` : ""}` : formatMoney(d.value)}
                    {d.minSubtotalMinor > 0 ? ` · من ${formatMoney(d.minSubtotalMinor)}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    استُخدم {d.usedCount}{d.maxUses ? ` من ${d.maxUses}` : ""} مرة
                    {d.endsAt ? ` · لحد ${fmtDate(d.endsAt)}` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setDraft(fromDiscount(d))}><Pencil /> تعديل</Button>
                <Button size="sm" variant="ghost" disabled={toggle.isPending} onClick={() => toggle.mutate({ id: d.id, isActive: !d.isActive })}>{d.isActive ? "إيقاف" : "تشغيل"}</Button>
                <ConfirmButton trigger={<Button size="sm" variant="ghost" className="text-destructive"><Trash2 /> مسح</Button>} title={`مسح «${d.name}»؟`} description="ينفع تمسح الخصم بس لو عمره ما اتستخدم في أي أوردر، وإلا وقّفه." confirmLabel="امسح" onConfirm={() => del.mutate(d.id)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <FormSheet open={!!draft} onOpenChange={(o) => !o && setDraft(null)} title={draft?.id ? "تعديل خصم" : "خصم جديد"} busy={save.isPending} onSubmit={() => draft && save.mutate(draft)}>
        {draft && (
          <>
            {draft.id && detail.data?.stats && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">أوردرات استخدمته</p><p className="font-bold">{detail.data.stats.ordersCount}</p></div>
                <div className="rounded-xl bg-primary-soft p-3"><p className="text-xs text-muted-foreground">إجمالي الخصم</p><p className="font-bold">{formatMoney(detail.data.stats.totalDiscountMinor)}</p></div>
              </div>
            )}
            <FormSection title="الأساسيات">
              <Field label="اسم الخصم" hint="بيظهر للعميل في الفاتورة"><Input required minLength={2} maxLength={80} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
              <SwitchField label="خصم تلقائي" hint="بيتطبّق لوحده من غير كود" checked={draft.auto} onChange={(v) => setDraft({ ...draft, auto: v })} />
              {!draft.auto && (
                <Field label="الكود" hint="3-20 حرف إنجليزي أو رقم"><Input required dir="ltr" pattern="[A-Za-z0-9_\-]{3,20}" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} className="font-mono" /></Field>
              )}
            </FormSection>
            <FormSection title="القيمة">
              <div className="grid grid-cols-2 gap-2">
                {(["PERCENT", "FIXED"] as const).map((k) => (
                  <button type="button" key={k} onClick={() => setDraft({ ...draft, kind: k })} className={cn("rounded-xl border p-3 text-sm font-medium", draft.kind === k ? "border-primary bg-primary-soft text-primary-deep" : "bg-card")}>
                    {k === "PERCENT" ? "نسبة %" : "مبلغ ثابت"}
                  </button>
                ))}
              </div>
              <Field label={draft.kind === "PERCENT" ? "النسبة (%)" : "المبلغ (جنيه)"}><Input type="number" required min={0.01} step="0.01" max={draft.kind === "PERCENT" ? 100 : undefined} value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} /></Field>
              {draft.kind === "PERCENT" && <Field label="أقصى خصم (جنيه)" hint="سيبه فاضي من غير حد"><Input type="number" min={0} step="0.5" value={draft.max} onChange={(e) => setDraft({ ...draft, max: e.target.value })} /></Field>}
              <Field label="أقل قيمة للطلب (جنيه)" hint="بعد خصومات المنتجات وقبل التوصيل"><Input type="number" min={0} step="0.5" value={draft.min} onChange={(e) => setDraft({ ...draft, min: e.target.value })} /></Field>
            </FormSection>
            <FormSection title="المدة والاستخدام">
              <div className="grid grid-cols-2 gap-2">
                <Field label="يبدأ"><Input type="datetime-local" value={draft.startsAt} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })} /></Field>
                <Field label="ينتهي"><Input type="datetime-local" value={draft.endsAt} onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })} /></Field>
              </div>
              <Field label="أقصى عدد استخدامات" hint="سيبه فاضي من غير حد"><Input type="number" min={1} value={draft.maxUses} onChange={(e) => setDraft({ ...draft, maxUses: e.target.value })} /></Field>
              <SwitchField label="شغّال" checked={draft.isActive} onChange={(v) => setDraft({ ...draft, isActive: v })} />
            </FormSection>
          </>
        )}
      </FormSheet>
    </AdminPage>
  );
}
