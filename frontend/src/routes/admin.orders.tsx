import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { api, apiPage } from "@/lib/api/client";
import type { AdminArea, OrderRow } from "@/lib/api/admin-types";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/api/types";
import { formatMoney } from "@/lib/money";
import { AdminPage, LoadingBlock, EmptyState, ErrorBlock } from "@/components/admin/AdminPage";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OrderSheet, StatusActions } from "@/components/admin/OrderSheet";
import { fmtDateTime } from "@/components/admin/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUSES: OrderStatus[] = ["PENDING", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

type OrdersSearch = { status?: OrderStatus };

export const Route = createFileRoute("/admin/orders")({
  validateSearch: (s: Record<string, unknown>): OrdersSearch => ({
    status: STATUSES.includes(s.status as OrderStatus) ? (s.status as OrderStatus) : undefined,
  }),
  head: () => ({ meta: [{ title: "الأوردرات — لوحة الإدارة" }] }),
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  const { status } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState("");
  const [areaId, setAreaId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = useQuery({
    queryKey: ["admin", "orders", "counts"],
    queryFn: () => api<{ counts: Record<string, number> }>("/orders/counts").then((d) => d.counts),
    refetchInterval: 30_000,
  });
  const areas = useQuery({ queryKey: ["admin", "areas", false], queryFn: () => api<{ areas: AdminArea[] }>("/areas").then((d) => d.areas) });
  const list = useQuery({
    queryKey: ["admin", "orders", "list", { status, q, areaId, from, to, page }],
    queryFn: () =>
      apiPage<{ orders: OrderRow[] }>("/orders", {
        query: { status, q: q.trim() || undefined, areaId: areaId === "all" ? undefined : areaId, from: from || undefined, to: to || undefined, page, limit: 20 },
      }),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
  const total = counts.data ? Object.values(counts.data).reduce((a, b) => a + b, 0) : undefined;

  return (
    <AdminPage title="الأوردرات" description="تابع الأوردرات وغيّر حالتها">
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Tab active={!status} onClick={() => { setPage(1); void navigate({ search: {} }); }} label="الكل" count={total} />
        {STATUSES.map((s) => (
          <Tab key={s} active={status === s} onClick={() => { setPage(1); void navigate({ search: { status: s } }); }} label={ORDER_STATUS_LABEL[s]} count={counts.data?.[s]} />
        ))}
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="رقم الأوردر أو الموبايل" className="h-10 rounded-xl ps-9" />
        </label>
        <Select value={areaId} onValueChange={(v) => { setAreaId(v); setPage(1); }} dir="rtl">
          <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل البلاد</SelectItem>
            {areas.data?.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} aria-label="من تاريخ" className="h-10 rounded-xl" />
        <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} aria-label="لحد تاريخ" className="h-10 rounded-xl" />
      </div>

      {list.isLoading ? (
        <LoadingBlock />
      ) : list.error ? (
        <ErrorBlock message="تعذّر تحميل الأوردرات" onRetry={() => list.refetch()} />
      ) : !list.data?.data.orders.length ? (
        <EmptyState title="مفيش أوردرات" description="جرّب تغيّر الفلاتر." />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr className="text-start">
                  <th className="p-3 text-start">#</th>
                  <th className="p-3 text-start">العميل</th>
                  <th className="p-3 text-start">البلد</th>
                  <th className="p-3 text-start">الوقت</th>
                  <th className="p-3 text-start">الإجمالي</th>
                  <th className="p-3 text-start">الحالة</th>
                  <th className="p-3 text-start">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {list.data.data.orders.map((o) => (
                  <tr key={o.id} onClick={() => setOpenId(o.id)} className="cursor-pointer hover:bg-muted/40">
                    <td className="p-3 font-bold">{o.number}</td>
                    <td className="p-3">
                      <p className="font-medium">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{o.customerPhone}</p>
                      {o.adminNote && <p className="text-xs text-highlight-foreground">📝 {o.adminNote}</p>}
                    </td>
                    <td className="p-3">{o.area}</td>
                    <td className="p-3 text-xs text-muted-foreground">{fmtDateTime(o.createdAt)}</td>
                    <td className="p-3 font-semibold tabular-nums">{formatMoney(o.totalMinor)}{o.isEstimated ? " ≈" : ""}</td>
                    <td className="p-3"><StatusBadge status={o.status} /></td>
                    <td className="p-3"><StatusActions id={o.id} next={o.nextStatuses.filter((s) => s !== "CANCELLED")} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">
            {list.data.data.orders.map((o) => (
              <div key={o.id} onClick={() => setOpenId(o.id)} className="rounded-2xl border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">#{o.number} · {o.customerName}</p>
                    <p className="text-xs text-muted-foreground">{o.area} · {fmtDateTime(o.createdAt)}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="font-bold tabular-nums text-primary-deep">{formatMoney(o.totalMinor)}</span>
                  <StatusActions id={o.id} next={o.nextStatuses.filter((s) => s !== "CANCELLED")} />
                </div>
              </div>
            ))}
          </div>
          {list.data.meta && list.data.meta.pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="السابق"><ChevronRight /></Button>
              <span className="text-sm text-muted-foreground">صفحة {list.data.meta.page} من {list.data.meta.pages}</span>
              <Button variant="outline" size="icon" disabled={page >= list.data.meta.pages} onClick={() => setPage((p) => p + 1)} aria-label="التالي"><ChevronLeft /></Button>
            </div>
          )}
        </>
      )}
      <OrderSheet id={openId} onClose={() => setOpenId(null)} />
    </AdminPage>
  );
}

function Tab({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <button onClick={onClick} className={cn("flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors", active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/40")}>
      {label}
      {count != null && <span className={cn("rounded-full px-1.5 text-xs", active ? "bg-primary-foreground/20" : "bg-muted")}>{count}</span>}
    </button>
  );
}
