import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Phone, MapPin, StickyNote, Store as StoreIcon, CheckCircle2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/client";
import type { AdminOrder } from "@/lib/api/admin-types";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/api/types";
import { formatMoney, formatQty, bpsToPercent } from "@/lib/money";
import { PricingSummary } from "@/components/store/PricingSummary";
import { StatusBadge } from "./StatusBadge";
import { LoadingBlock, ErrorBlock } from "./AdminPage";
import { useAdminMutation, fmtDateTime, waLink } from "./hooks";

export function useOrderStatusMutation() {
  return useAdminMutation(
    (v: { id: string; status: OrderStatus; cancelReason?: string }) =>
      api(`/orders/${v.id}/status`, {
        method: "PATCH",
        body: { status: v.status, ...(v.status === "CANCELLED" ? { cancelReason: v.cancelReason } : {}) },
      }),
    { success: (_r) => "الحالة اتغيّرت" },
  );
}

export function StatusActions({ id, next, size = "sm" }: { id: string; next: OrderStatus[]; size?: "sm" | "default" }) {
  const m = useOrderStatusMutation();
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  if (!next.length) return null;
  if (cancelling) {
    return (
      <div className="w-full space-y-2" onClick={(e) => e.stopPropagation()}>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="سبب الإلغاء" maxLength={300} className="min-h-16" />
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" disabled={reason.trim().length < 2 || m.isPending} onClick={() => m.mutate({ id, status: "CANCELLED", cancelReason: reason.trim() }, { onSuccess: () => setCancelling(false) })}>
            تأكيد الإلغاء
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setCancelling(false)}>رجوع</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
      {next.map((s) =>
        s === "CANCELLED" ? (
          <Button key={s} size={size} variant="outline" className="text-destructive" onClick={() => setCancelling(true)}>
            إلغاء
          </Button>
        ) : (
          <Button key={s} size={size} disabled={m.isPending} onClick={() => m.mutate({ id, status: s })}>
            {s === "PREPARING" ? "أكّد وابدأ التجهيز" : s === "OUT_FOR_DELIVERY" ? "خرج للتوصيل" : s === "DELIVERED" ? "اتسلّم" : ORDER_STATUS_LABEL[s]}
          </Button>
        ),
      )}
    </div>
  );
}

export function OrderSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" className="w-full overflow-y-auto p-0 sm:max-w-xl" dir="rtl">
        {id && <OrderDetails id={id} />}
      </SheetContent>
    </Sheet>
  );
}

function OrderDetails({ id }: { id: string }) {
  const q = useQuery({ queryKey: ["admin", "order", id], queryFn: () => api<{ order: AdminOrder }>(`/orders/${id}`).then((d) => d.order) });
  const [note, setNote] = useState("");
  useEffect(() => setNote(q.data?.adminNote ?? ""), [q.data?.adminNote]);
  const saveNote = useAdminMutation(() => api(`/orders/${id}`, { method: "PATCH", body: { adminNote: note.trim() || null } }), { success: "الملاحظة اتحفظت" });

  if (q.isLoading) return <><SheetTitle className="sr-only">أوردر</SheetTitle><LoadingBlock /></>;
  if (q.error || !q.data) return <><SheetTitle className="sr-only">أوردر</SheetTitle><div className="p-5"><ErrorBlock message="تعذّر تحميل الأوردر" onRetry={() => q.refetch()} /></div></>;
  const o = q.data;
  const t = o.timeline;

  return (
    <div>
      <SheetHeader className="border-b p-5 text-right">
        <div className="flex items-center gap-3">
          <SheetTitle className="text-xl">أوردر #{o.number}</SheetTitle>
          <StatusBadge status={o.status} />
        </div>
        <SheetDescription>{fmtDateTime(o.createdAt)}</SheetDescription>
      </SheetHeader>
      <div className="space-y-5 p-5">
        <StatusActions id={o.id} next={o.nextStatuses} size="default" />
        {o.cancelReason && <p className="rounded-xl bg-destructive/5 p-3 text-sm text-destructive">سبب الإلغاء: {o.cancelReason}</p>}

        <div className="space-y-2 rounded-2xl border p-4 text-sm">
          <p className="font-bold">{o.customer.name}</p>
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${o.customer.phone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5" dir="ltr"><Phone className="size-3.5" />{o.customer.phone}</a>
            <a href={o.customerWhatsappUrl || waLink(o.customer.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-1.5 text-success"><MessageCircle className="size-3.5" />واتساب</a>
          </div>
          <p className="flex items-start gap-1.5 text-muted-foreground"><MapPin className="mt-0.5 size-3.5 shrink-0" />{o.area} — {o.addressDetails}</p>
          {o.notes && <p className="flex items-start gap-1.5 text-muted-foreground"><StickyNote className="mt-0.5 size-3.5 shrink-0" />{o.notes}</p>}
        </div>

        <div>
          <h3 className="mb-2 font-bold">الأصناف ({o.items.length})</h3>
          <ul className="divide-y rounded-2xl border">
            {o.items.map((it) => (
              <li key={it.id} className="flex gap-3 p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {it.purchased && <CheckCircle2 className="me-1 inline size-4 text-success" />}
                    {it.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatQty(it.quantity)} {it.saleMode === "WEIGHT" ? it.unitLabel : it.saleMode === "PIECE_WEIGHT" ? "قطعة" : it.unitLabel}
                    {it.weightPerUnit ? ` × ${formatQty(it.weightPerUnit)} كيلو` : ""}
                    {it.unitPriceMinor != null ? ` · ${formatMoney(it.unitPriceMinor)} للوحدة` : ""}
                  </p>
                  {it.options.length > 0 && <p className="text-xs text-muted-foreground">{it.options.map((x) => `${x.groupName}: ${x.optionName}`).join("، ")}</p>}
                  {it.note && <p className="text-xs text-highlight-foreground">ملاحظة: {it.note}</p>}
                  {(it.storeName || it.categoryName) && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <StoreIcon className="size-3" /> {it.storeName ?? it.categoryName}
                      {it.menuSection ? ` · ${it.menuSection}` : ""}
                      {it.serviceFeeBps ? ` · خدمة ${bpsToPercent(it.serviceFeeBps)}` : ""}
                      {it.actualCostMinor != null ? ` · اتشترى بـ ${formatMoney(it.actualCostMinor)}` : ""}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-semibold tabular-nums">{it.lineTotalMinor == null ? "بعد الشراء" : formatMoney(it.lineTotalMinor)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border p-4">
          <PricingSummary pricing={o.pricing} isEstimated={o.isEstimated} needsPricing={o.needsPricing} />
        </div>

        <div className="space-y-2">
          <h3 className="font-bold">ملاحظة الإدارة</h3>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="ملاحظة داخلية مش بتظهر للعميل" />
          <Button size="sm" variant="secondary" disabled={saveNote.isPending || note === (o.adminNote ?? "")} onClick={() => saveNote.mutate(undefined)}>حفظ الملاحظة</Button>
        </div>

        <div className="rounded-2xl bg-muted/60 p-4 text-xs text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">التسلسل</p>
          <p>اتعمل: {fmtDateTime(t.createdAt)}</p>
          {t.confirmedAt && <p>اتأكد: {fmtDateTime(t.confirmedAt)}</p>}
          {t.outForDeliveryAt && <p>خرج: {fmtDateTime(t.outForDeliveryAt)}</p>}
          {t.deliveredAt && <p>اتسلّم: {fmtDateTime(t.deliveredAt)}</p>}
          {t.cancelledAt && <p>اتلغى: {fmtDateTime(t.cancelledAt)}</p>}
        </div>
      </div>
    </div>
  );
}
