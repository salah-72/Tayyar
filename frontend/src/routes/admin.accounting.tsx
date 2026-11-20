import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FileText, Undo2, CheckCheck } from "lucide-react";
import { api } from "@/lib/api/client";
import type { DayAccount, SettlementState, StoreRange } from "@/lib/api/admin-types";
import { formatMoney } from "@/lib/money";
import { AdminPage, LoadingBlock, EmptyState, ErrorBlock } from "@/components/admin/AdminPage";
import { useAdminMutation, todayISO, fmtDate } from "@/components/admin/hooks";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/accounting")({
  head: () => ({ meta: [{ title: "حسابات المطاعم — لوحة الإدارة" }] }),
  component: AdminAccountingPage,
});

const STATE: Record<SettlementState, { label: string; tone: string }> = {
  OPEN: { label: "لسه ما اتحاسبش", tone: "bg-highlight-soft text-highlight-foreground" },
  SETTLED: { label: "اتحاسب", tone: "bg-success/10 text-success" },
  CHANGED: { label: "الأرقام اتغيّرت", tone: "bg-destructive/10 text-destructive" },
};

function StateBadge({ s }: { s: SettlementState }) {
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATE[s].tone)}>{STATE[s].label}</span>;
}

function AdminAccountingPage() {
  const [date, setDate] = useState(todayISO());
  const [statementFor, setStatementFor] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["admin", "accounting", date], queryFn: () => api<DayAccount>("/accounting/stores", { query: { date } }) });
  const settle = useAdminMutation((storeId: string) => api("/accounting/settlements", { method: "POST", body: { storeId, date } }), { success: "اتسجّلت المحاسبة" });
  const undo = useAdminMutation((id: string) => api(`/accounting/settlements/${id}`, { method: "DELETE" }), { success: "اتلغت المحاسبة" });

  return (
    <AdminPage
      title="حسابات المطاعم"
      description="اللي عليك تدفعه لكل مطعم في اليوم، وربحك من رسوم الخدمة"
      actions={<Input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="h-10 w-44 rounded-xl" />}
    >
      {q.isLoading ? (
        <LoadingBlock />
      ) : q.error ? (
        <ErrorBlock message="تعذّر تحميل الحسابات" onRetry={() => q.refetch()} />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="مستحق للمطاعم" value={formatMoney(q.data!.totals.salesMinor)} />
            <Stat label="ربحك (رسوم خدمة)" value={formatMoney(q.data!.totals.serviceFeeMinor)} accent />
            <Stat label="أوردرات" value={String(q.data!.totals.ordersCount)} />
            <Stat label="مطاعم محتاجة محاسبة" value={String(q.data!.totals.openCount)} />
          </div>
          {!q.data!.stores.length ? (
            <EmptyState title="مفيش مطاعم" description="ضيف مطاعم من صفحة المحلات والمطاعم." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {q.data!.stores.map((s) => (
                <div key={s.storeId} className="rounded-2xl border bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{s.storeName}</p>
                      <p className="text-xs text-muted-foreground">{s.ordersCount} أوردر · {s.itemsCount} صنف</p>
                    </div>
                    {s.salesMinor > 0 || s.settlement ? <StateBadge s={s.state} /> : <span className="text-xs text-muted-foreground">مفيش مبيعات</span>}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">تدفعله</p><p className="font-bold tabular-nums">{formatMoney(s.salesMinor)}</p></div>
                    <div className="rounded-xl bg-primary-soft p-3"><p className="text-xs text-muted-foreground">ربحك</p><p className="font-bold tabular-nums text-primary-deep">{formatMoney(s.serviceFeeMinor)}</p></div>
                  </div>
                  {s.state === "CHANGED" && s.settlement && (
                    <p className="mt-2 text-xs text-destructive">اتحاسب على {formatMoney(s.settlement.salesMinor)}، ألغِ المحاسبة وسجّلها تاني بالأرقام الجديدة.</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.state === "OPEN" && s.salesMinor > 0 && (
                      <ConfirmButton
                        destructive={false}
                        trigger={<Button size="sm"><CheckCheck /> دفعت للمطعم</Button>}
                        title={`محاسبة ${s.storeName}`}
                        description={`هتسجّل إنك دفعت ${formatMoney(s.salesMinor)} عن يوم ${fmtDate(date)}.`}
                        onConfirm={() => settle.mutate(s.storeId)}
                      />
                    )}
                    {s.settlement && (
                      <Button size="sm" variant="outline" disabled={undo.isPending} onClick={() => undo.mutate(s.settlement!.id)}><Undo2 /> ألغِ المحاسبة</Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setStatementFor(s.storeId)}><FileText /> كشف حساب</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <StatementSheet storeId={statementFor} onClose={() => setStatementFor(null)} />
    </AdminPage>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-4 shadow-card", accent ? "bg-gradient-hero text-primary-foreground" : "bg-card")}>
      <p className={cn("text-xs", accent ? "opacity-80" : "text-muted-foreground")}>{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

function monthAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function StatementSheet({ storeId, onClose }: { storeId: string | null; onClose: () => void }) {
  const [from, setFrom] = useState(monthAgo());
  const [to, setTo] = useState(todayISO());
  const q = useQuery({
    queryKey: ["admin", "accounting", "range", storeId, from, to],
    queryFn: () => api<StoreRange>(`/accounting/stores/${storeId}`, { query: { from, to } }),
    enabled: !!storeId,
  });
  return (
    <Sheet open={!!storeId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-lg" dir="rtl">
        <SheetHeader className="text-right">
          <SheetTitle>كشف حساب {q.data?.store.name ?? ""}</SheetTitle>
          <SheetDescription>لحد 93 يوم</SheetDescription>
        </SheetHeader>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Input type="date" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} aria-label="من" />
          <Input type="date" value={to} onChange={(e) => e.target.value && setTo(e.target.value)} aria-label="لحد" />
        </div>
        {q.isLoading ? (
          <LoadingBlock />
        ) : q.error ? (
          <div className="mt-4"><ErrorBlock message={(q.error as Error).message} /></div>
        ) : q.data ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">إجمالي المبيعات</p><p className="font-bold">{formatMoney(q.data.totals.salesMinor)}</p></div>
              <div className="rounded-xl bg-primary-soft p-3"><p className="text-xs text-muted-foreground">ربحك</p><p className="font-bold text-primary-deep">{formatMoney(q.data.totals.serviceFeeMinor)}</p></div>
              <div className="col-span-2 rounded-xl bg-highlight-soft p-3 text-highlight-foreground"><p className="text-xs">لسه عليك للمطعم</p><p className="font-bold">{formatMoney(q.data.totals.unsettledSalesMinor)}</p></div>
            </div>
            <ul className="mt-4 divide-y rounded-2xl border">
              {q.data.days.length === 0 && <li className="p-4 text-center text-sm text-muted-foreground">مفيش حركة في الفترة دي</li>}
              {q.data.days.map((d) => (
                <li key={d.date} className="flex items-center justify-between gap-2 p-3 text-sm">
                  <div>
                    <p className="font-medium">{fmtDate(d.date)}</p>
                    <p className="text-xs text-muted-foreground">{d.ordersCount} أوردر · ربح {formatMoney(d.serviceFeeMinor)}</p>
                  </div>
                  <div className="text-end">
                    <p className="font-semibold tabular-nums">{formatMoney(d.salesMinor)}</p>
                    <StateBadge s={d.state} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
