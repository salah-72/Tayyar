import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Copy, RotateCcw, ShoppingBasket } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import type { PurchaseLine, PurchaseStore, ShoppingList } from "@/lib/api/admin-types";
import { formatMoney, toMinor } from "@/lib/money";
import { AdminPage, AdminCard, LoadingBlock, EmptyState, ErrorBlock } from "@/components/admin/AdminPage";
import { useAdminMutation } from "@/components/admin/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/purchases")({
  head: () => ({ meta: [{ title: "قايمة الشراء — لوحة الإدارة" }] }),
  component: AdminPurchasesPage,
});

const STATUS_TABS = [
  { v: "PENDING", l: "الأوردرات الجديدة" },
  { v: "PREPARING", l: "اللي بتتجهّز" },
  { v: "OUT_FOR_DELIVERY", l: "اللي في الطريق" },
] as const;

function AdminPurchasesPage() {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]["v"]>("PREPARING");
  const [hide, setHide] = useState(false);
  const q = useQuery({
    queryKey: ["admin", "purchases", status, hide],
    queryFn: () => api<ShoppingList>("/purchases", { query: { status, hidePurchased: hide ? "true" : undefined } }),
    refetchInterval: 30_000,
  });

  return (
    <AdminPage title="قايمة الشراء" description="كل الأصناف المطلوبة متجمّعة حسب المحل، علّم اللي اشتريته واكتب تكلفته">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => (
            <button key={t.v} onClick={() => setStatus(t.v)} className={cn("rounded-xl border px-3.5 py-2 text-sm font-medium", status === t.v ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
              {t.l}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={hide} onCheckedChange={setHide} /> خبّي اللي اتشترى
        </label>
      </div>

      {q.isLoading ? (
        <LoadingBlock />
      ) : q.error ? (
        <ErrorBlock message="تعذّر تحميل القايمة" onRetry={() => q.refetch()} />
      ) : !q.data?.stores.length ? (
        <EmptyState title="مفيش حاجة تتشترى" description="لما الأوردرات تتأكد، أصنافها هتظهر هنا." />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="الأصناف" value={`${q.data.totals.purchasedCount} / ${q.data.totals.itemsCount}`} />
            <Stat label="التكلفة التقديرية" value={formatMoney(q.data.totals.estimatedMinor)} />
            <Stat label="التكلفة الفعلية" value={formatMoney(q.data.totals.actualCostMinor)} />
            <Stat label="الحالة" value={q.data.totals.state === "ALL" ? "اتشترى كله" : q.data.totals.state === "PARTIAL" ? "جزء" : "لسه"} />
          </div>
          <div className="space-y-4">
            {q.data.stores.map((s) => <StoreBlock key={s.storeId ?? "none"} s={s} />)}
          </div>
        </>
      )}
    </AdminPage>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

function StoreBlock({ s }: { s: PurchaseStore }) {
  return (
    <AdminCard className="p-0 md:p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary"><ShoppingBasket className="size-5" /></span>
          <div>
            <p className="font-bold">{s.storeName}</p>
            <p className="text-xs text-muted-foreground">{s.purchasedCount} من {s.itemsCount} · تقديري {formatMoney(s.estimatedMinor)}</p>
          </div>
        </div>
        {s.text && (
          <Button variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(s.text); toast.success("القايمة اتنسخت"); }}>
            <Copy /> انسخ القايمة للمحل
          </Button>
        )}
      </div>
      <ul className="divide-y">
        {s.lines.map((l) => <LineRow key={l.key} l={l} />)}
      </ul>
    </AdminCard>
  );
}

function LineRow({ l }: { l: PurchaseLine }) {
  const [cost, setCost] = useState(l.actualCostMinor != null ? String(l.actualCostMinor / 100) : String(l.estimatedMinor / 100));
  const mark = useAdminMutation(
    (v: { purchased: boolean }) =>
      api("/purchases/mark", {
        method: "POST",
        body: v.purchased ? { itemIds: l.itemIds, purchased: true, actualCostMinor: toMinor(cost || 0) } : { itemIds: l.itemIds, purchased: false },
      }),
    { success: (_r) => "اتحفظ" },
  );
  const done = l.state === "ALL";
  return (
    <li className={cn("flex flex-wrap items-center gap-3 p-4", done && "bg-success/5")}>
      <div className="min-w-0 flex-1">
        <p className={cn("font-semibold", done && "text-muted-foreground line-through")}>
          {l.name} <span className="font-normal text-primary-deep">— {l.quantityText}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {[l.categoryName ?? l.menuSection, l.options.join("، "), l.note].filter(Boolean).join(" · ")}
        </p>
        <p className="text-xs text-muted-foreground">
          أوردرات: {l.orders.map((o) => `#${o.number} (${o.customerName})`).join("، ")}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {!done && (
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            التكلفة
            <Input type="number" min={0} step="0.5" value={cost} onChange={(e) => setCost(e.target.value)} className="h-9 w-24 rounded-lg" />
          </label>
        )}
        {done ? (
          <>
            <span className="text-sm font-semibold text-success tabular-nums">{formatMoney(l.actualCostMinor)}</span>
            <Button size="sm" variant="ghost" disabled={mark.isPending} onClick={() => mark.mutate({ purchased: false })}><RotateCcw /> تراجع</Button>
          </>
        ) : (
          <Button size="sm" disabled={mark.isPending} onClick={() => mark.mutate({ purchased: true })}><Check /> اشتريته</Button>
        )}
      </div>
    </li>
  );
}
