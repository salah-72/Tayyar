import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Clock, PackageCheck, Truck, ChefHat, XCircle } from "lucide-react";
import { api, apiPage } from "@/lib/api/client";
import type { OrderRow } from "@/lib/api/admin-types";
import type { OrderStatus, StoreSettings } from "@/lib/api/types";
import { formatMoney } from "@/lib/money";
import { AdminPage, AdminCard, LoadingBlock, EmptyState } from "@/components/admin/AdminPage";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OrderSheet, StatusActions } from "@/components/admin/OrderSheet";
import { useAdminMutation, fmtDateTime } from "@/components/admin/hooks";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "لوحة التحكم — لوحة الإدارة" }] }),
  component: Dashboard,
});

const STATS: { status: OrderStatus; label: string; icon: typeof Clock; tone: string }[] = [
  { status: "PENDING", label: "أوردرات جديدة", icon: Clock, tone: "bg-highlight-soft text-highlight-foreground" },
  { status: "PREPARING", label: "بتتجهّز", icon: ChefHat, tone: "bg-info/10 text-info" },
  { status: "OUT_FOR_DELIVERY", label: "في الطريق", icon: Truck, tone: "bg-primary-soft text-primary-deep" },
  { status: "DELIVERED", label: "اتسلّمت", icon: PackageCheck, tone: "bg-success/10 text-success" },
  { status: "CANCELLED", label: "ملغية", icon: XCircle, tone: "bg-destructive/10 text-destructive" },
];

function Dashboard() {
  const [openId, setOpenId] = useState<string | null>(null);
  const counts = useQuery({
    queryKey: ["admin", "orders", "counts"],
    queryFn: () => api<{ counts: Record<string, number> }>("/orders/counts").then((d) => d.counts),
    refetchInterval: 30_000,
  });
  const latest = useQuery({
    queryKey: ["admin", "orders", "latest"],
    queryFn: () => apiPage<{ orders: OrderRow[] }>("/orders", { query: { limit: 8 } }).then((r) => r.data.orders),
    refetchInterval: 30_000,
  });
  const settings = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api<{ settings: StoreSettings }>("/settings").then((d) => d.settings),
  });
  const toggle = useAdminMutation((acceptingOrders: boolean) => api("/settings", { method: "PATCH", body: { acceptingOrders } }), {
    success: (r) => "اتحفظ",
  });

  return (
    <AdminPage title="لوحة التحكم" description="نظرة سريعة على شغل النهارده">
      <AdminCard className="mb-5 flex items-center justify-between gap-4 bg-gradient-hero text-primary-foreground">
        <div>
          <p className="font-bold">{settings.data?.acceptingOrders ? "المتجر بيستقبل أوردرات" : "المتجر مقفول"}</p>
          <p className="text-sm opacity-80">{settings.data?.acceptingOrders ? "العملاء يقدروا يطلبوا دلوقتي" : "العملاء يقدروا يتفرجوا بس من غير طلب"}</p>
        </div>
        <Switch
          checked={!!settings.data?.acceptingOrders}
          disabled={!settings.data || toggle.isPending}
          onCheckedChange={(v) => toggle.mutate(v)}
          className="data-[state=checked]:bg-highlight"
        />
      </AdminCard>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {STATS.map((s) => (
          <Link key={s.status} to="/admin/orders" search={{ status: s.status }} className="rounded-2xl border bg-card p-4 shadow-card transition-transform hover:-translate-y-0.5">
            <span className={`grid size-10 place-items-center rounded-xl ${s.tone}`}>
              <s.icon className="size-5" />
            </span>
            <p className="mt-3 text-2xl font-bold tabular-nums">{counts.data?.[s.status] ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold">آخر الأوردرات</h2>
        <Link to="/admin/orders" className="flex items-center gap-1 text-sm font-semibold text-primary">
          كل الأوردرات <ArrowLeft className="size-4" />
        </Link>
      </div>
      {latest.isLoading ? (
        <LoadingBlock />
      ) : !latest.data?.length ? (
        <EmptyState title="لسه مفيش أوردرات" description="أول ما عميل يطلب هيظهر هنا." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {latest.data.map((o) => (
            <div key={o.id} role="button" tabIndex={0} onClick={() => setOpenId(o.id)} className="cursor-pointer rounded-2xl border bg-card p-4 shadow-card hover:border-primary/40">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">#{o.number} · {o.customerName}</p>
                  <p className="text-xs text-muted-foreground">{o.area} · {o.itemsCount} صنف · {fmtDateTime(o.createdAt)}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="font-bold tabular-nums text-primary-deep">{formatMoney(o.totalMinor)}{o.isEstimated ? " ≈" : ""}</span>
                <StatusActions id={o.id} next={o.nextStatuses.filter((s) => s !== "CANCELLED")} />
              </div>
            </div>
          ))}
        </div>
      )}
      <OrderSheet id={openId} onClose={() => setOpenId(null)} />
    </AdminPage>
  );
}
