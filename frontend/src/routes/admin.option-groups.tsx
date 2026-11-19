import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { PRICING_LABEL, type AdminOption, type AdminOptionGroup } from "@/lib/api/admin-types";
import type { OptionPricing } from "@/lib/api/types";
import { formatMoney, toMinor } from "@/lib/money";
import { AdminPage, AdminCard, LoadingBlock, EmptyState, ErrorBlock } from "@/components/admin/AdminPage";
import { FormSheet, Field, SwitchField } from "@/components/admin/form";
import { useAdminMutation } from "@/components/admin/hooks";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/option-groups")({
  head: () => ({ meta: [{ title: "خيارات التجهيز — لوحة الإدارة" }] }),
  component: AdminOptionGroupsPage,
});

type GroupDraft = { id?: string; name: string; minSelect: string; maxSelect: string; sortOrder: string; isActive: boolean };
type OptDraft = { groupId: string; id?: string; name: string; pricing: OptionPricing; price: string; sortOrder: string; isActive: boolean };

function AdminOptionGroupsPage() {
  const [group, setGroup] = useState<GroupDraft | null>(null);
  const [opt, setOpt] = useState<OptDraft | null>(null);
  const q = useQuery({ queryKey: ["admin", "option-groups"], queryFn: () => api<{ groups: AdminOptionGroup[] }>("/option-groups").then((d) => d.groups) });

  const saveGroup = useAdminMutation(
    (d: GroupDraft) => {
      const body = { name: d.name.trim(), minSelect: Number(d.minSelect || 0), maxSelect: Number(d.maxSelect || 1), sortOrder: Number(d.sortOrder || 0), isActive: d.isActive };
      return d.id ? api(`/option-groups/${d.id}`, { method: "PATCH", body }) : api("/option-groups", { method: "POST", body });
    },
    { success: "المجموعة اتحفظت", onSuccess: () => setGroup(null) },
  );
  const delGroup = useAdminMutation((id: string) => api(`/option-groups/${id}`, { method: "DELETE" }), { success: "المجموعة اتمسحت" });
  const saveOpt = useAdminMutation(
    (d: OptDraft) => {
      const body = { name: d.name.trim(), pricing: d.pricing, priceMinor: toMinor(d.price || 0), sortOrder: Number(d.sortOrder || 0), isActive: d.isActive };
      return d.id ? api(`/option-groups/${d.groupId}/options/${d.id}`, { method: "PATCH", body }) : api(`/option-groups/${d.groupId}/options`, { method: "POST", body });
    },
    { success: "الخيار اتحفظ", onSuccess: () => setOpt(null) },
  );
  const delOpt = useAdminMutation((v: { g: string; o: string }) => api(`/option-groups/${v.g}/options/${v.o}`, { method: "DELETE" }), { success: "الخيار اتمسح" });

  return (
    <AdminPage
      title="خيارات التجهيز"
      description="زي تنظيف الفراخ، تقطيع السمك، إضافات البيتزا… واربطها بالمنتجات من صفحة المنتجات"
      actions={<Button className="rounded-xl" onClick={() => setGroup({ name: "", minSelect: "0", maxSelect: "1", sortOrder: "0", isActive: true })}><Plus /> مجموعة جديدة</Button>}
    >
      {q.isLoading ? (
        <LoadingBlock />
      ) : q.error ? (
        <ErrorBlock message="تعذّر التحميل" onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState title="لسه مفيش مجموعات خيارات" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {q.data.map((g) => (
            <AdminCard key={g.id}>
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><ListChecks className="size-5" /></span>
                <div className="flex-1">
                  <p className="font-bold">{g.name} {!g.isActive && <span className="text-xs font-normal text-muted-foreground">(موقوفة)</span>}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.minSelect > 0 ? `إجباري (${g.minSelect}–${g.maxSelect})` : `اختياري (لحد ${g.maxSelect})`} · مربوطة بـ {g.productsCount} منتج
                  </p>
                </div>
                <Button size="icon" variant="ghost" aria-label="تعديل" onClick={() => setGroup({ id: g.id, name: g.name, minSelect: String(g.minSelect), maxSelect: String(g.maxSelect), sortOrder: String(g.sortOrder), isActive: g.isActive })}><Pencil /></Button>
                <ConfirmButton trigger={<Button size="icon" variant="ghost" className="text-destructive" aria-label="مسح"><Trash2 /></Button>} title={`مسح ${g.name}؟`} description="مينفعش تمسح مجموعة مربوطة بمنتجات." confirmLabel="امسح" onConfirm={() => delGroup.mutate(g.id)} />
              </div>
              <ul className="mt-3 divide-y rounded-xl border">
                {g.options.length === 0 && <li className="p-3 text-center text-sm text-muted-foreground">مفيش خيارات</li>}
                {g.options.map((o: AdminOption) => (
                  <li key={o.id} className="flex items-center gap-2 p-2.5 ps-3 text-sm">
                    <span className="flex-1 font-medium">{o.name} {!o.isActive && <span className="text-xs text-muted-foreground">(موقوف)</span>}</span>
                    <span className="text-xs text-muted-foreground">{o.priceMinor ? `${formatMoney(o.priceMinor)} · ${PRICING_LABEL[o.pricing]}` : "مجانًا"}</span>
                    <Button size="icon" variant="ghost" className="size-8" aria-label="تعديل" onClick={() => setOpt({ groupId: g.id, id: o.id, name: o.name, pricing: o.pricing, price: String(o.priceMinor / 100), sortOrder: String(o.sortOrder), isActive: o.isActive })}><Pencil /></Button>
                    <Button size="icon" variant="ghost" className="size-8 text-destructive" aria-label="مسح" onClick={() => delOpt.mutate({ g: g.id, o: o.id })}><Trash2 /></Button>
                  </li>
                ))}
              </ul>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setOpt({ groupId: g.id, name: "", pricing: "FLAT", price: "0", sortOrder: "0", isActive: true })}><Plus /> خيار</Button>
            </AdminCard>
          ))}
        </div>
      )}

      <FormSheet open={!!group} onOpenChange={(o) => !o && setGroup(null)} title={group?.id ? "تعديل مجموعة" : "مجموعة جديدة"} busy={saveGroup.isPending} onSubmit={() => group && saveGroup.mutate(group)}>
        {group && (
          <>
            <Field label="اسم المجموعة" hint="بيظهر للعميل، مثال: تنظيف الفراخ"><Input required minLength={2} value={group.name} onChange={(e) => setGroup({ ...group, name: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="أقل اختيار" hint="0 = اختياري"><Input type="number" min={0} max={20} value={group.minSelect} onChange={(e) => setGroup({ ...group, minSelect: e.target.value })} /></Field>
              <Field label="أكتر اختيار" hint="1 = اختيار واحد"><Input type="number" min={1} max={20} value={group.maxSelect} onChange={(e) => setGroup({ ...group, maxSelect: e.target.value })} /></Field>
            </div>
            <Field label="الترتيب"><Input type="number" min={0} value={group.sortOrder} onChange={(e) => setGroup({ ...group, sortOrder: e.target.value })} /></Field>
            <SwitchField label="شغّالة" checked={group.isActive} onChange={(v) => setGroup({ ...group, isActive: v })} />
          </>
        )}
      </FormSheet>

      <FormSheet open={!!opt} onOpenChange={(o) => !o && setOpt(null)} title={opt?.id ? "تعديل خيار" : "خيار جديد"} busy={saveOpt.isPending} onSubmit={() => opt && saveOpt.mutate(opt)}>
        {opt && (
          <>
            <Field label="اسم الخيار"><Input required value={opt.name} onChange={(e) => setOpt({ ...opt, name: e.target.value })} /></Field>
            <Field label="طريقة التسعير" hint="«لكل كيلو» للمنتجات بالوزن، «لكل وحدة» للعدد، «ثابت» مرة واحدة للبند">
              <Select value={opt.pricing} onValueChange={(v) => setOpt({ ...opt, pricing: v as OptionPricing })} dir="rtl">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRICING_LABEL) as OptionPricing[]).map((p) => <SelectItem key={p} value={p}>{PRICING_LABEL[p]}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="السعر (جنيه)" hint="0 = مجانًا"><Input type="number" min={0} step="0.5" value={opt.price} onChange={(e) => setOpt({ ...opt, price: e.target.value })} /></Field>
            <Field label="الترتيب"><Input type="number" min={0} value={opt.sortOrder} onChange={(e) => setOpt({ ...opt, sortOrder: e.target.value })} /></Field>
            <SwitchField label="متاح" checked={opt.isActive} onChange={(v) => setOpt({ ...opt, isActive: v })} />
          </>
        )}
      </FormSheet>
    </AdminPage>
  );
}
