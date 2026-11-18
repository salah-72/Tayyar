import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiRaw, errorMessage, tokenStore } from "@/lib/api/client";
import type { StoreSettings } from "@/lib/api/types";
import { toMinor } from "@/lib/money";
import { AdminPage, AdminCard, LoadingBlock, ErrorBlock } from "@/components/admin/AdminPage";
import { Field, SwitchField, egpStr } from "@/components/admin/form";
import { useAdminMutation } from "@/components/admin/hooks";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "إعدادات المتجر — لوحة الإدارة" }] }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "settings"], queryFn: () => api<{ settings: StoreSettings }>("/settings").then((d) => d.settings), retry: false });
  const [f, setF] = useState({ storeName: "", tagline: "", whatsappNumber: "", threshold: "", acceptingOrders: true });
  useEffect(() => {
    if (q.data) setF({ storeName: q.data.storeName, tagline: q.data.tagline ?? "", whatsappNumber: q.data.whatsappNumber ?? "", threshold: egpStr(q.data.freeDeliveryThresholdMinor), acceptingOrders: q.data.acceptingOrders });
  }, [q.data]);
  const save = useAdminMutation(
    () =>
      api("/settings", {
        method: "PATCH",
        body: { storeName: f.storeName.trim(), tagline: f.tagline.trim() || null, whatsappNumber: f.whatsappNumber.replace(/\D/g, ""), freeDeliveryThresholdMinor: toMinor(f.threshold || 0), acceptingOrders: f.acceptingOrders },
      }),
    { success: "الإعدادات اتحفظت" },
  );

  return (
    <AdminPage title="إعدادات المتجر" description="الاسم، اللوجو، رقم الواتساب والتوصيل المجاني">
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {q.isLoading ? (
          <LoadingBlock />
        ) : q.error && !q.data ? (
          <AdminCard>
            <p className="mb-3 text-sm text-muted-foreground">الإعدادات لسه ما اتعملتش، املاها واحفظ (رقم الواتساب مطلوب أول مرة).</p>
            <SettingsForm f={f} setF={setF} busy={save.isPending} onSave={() => save.mutate(undefined)} />
          </AdminCard>
        ) : (
          <AdminCard>
            <SettingsForm f={f} setF={setF} busy={save.isPending} onSave={() => save.mutate(undefined)} />
          </AdminCard>
        )}
        <div className="space-y-5">
          <AdminCard>
            <h2 className="mb-3 font-bold">لوجو المتجر</h2>
            <ImageUploader endpoint="/settings/logo" imageUrl={q.data?.logoUrl} label="اللوجو" onChange={() => { void qc.invalidateQueries({ queryKey: ["admin", "settings"] }); void qc.invalidateQueries({ queryKey: ["catalog"] }); }} />
          </AdminCard>
          <PasswordCard />
        </div>
      </div>
    </AdminPage>
  );
}

type F = { storeName: string; tagline: string; whatsappNumber: string; threshold: string; acceptingOrders: boolean };
function SettingsForm({ f, setF, busy, onSave }: { f: F; setF: (f: F) => void; busy: boolean; onSave: () => void }) {
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
      <Field label="اسم المتجر"><Input required minLength={2} value={f.storeName} onChange={(e) => setF({ ...f, storeName: e.target.value })} /></Field>
      <Field label="الشعار (جملة تحت الاسم)"><Input value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} /></Field>
      <Field label="رقم الواتساب" hint="بالصيغة الدولية من غير + (مثال: 201012345678). الأوردرات بتتبعت عليه."><Input required dir="ltr" inputMode="numeric" value={f.whatsappNumber} onChange={(e) => setF({ ...f, whatsappNumber: e.target.value })} className="text-right" /></Field>
      <Field label="التوصيل مجاني من (جنيه)" hint="0 = مفيش توصيل مجاني"><Input type="number" min={0} step="1" value={f.threshold} onChange={(e) => setF({ ...f, threshold: e.target.value })} /></Field>
      <SwitchField label="بيستقبل أوردرات" hint="اقفلها لو مش شغالين دلوقتي" checked={f.acceptingOrders} onChange={(v) => setF({ ...f, acceptingOrders: v })} />
      <Button type="submit" disabled={busy} className="rounded-xl">{busy && <Loader2 className="animate-spin" />} حفظ الإعدادات</Button>
    </form>
  );
}

function PasswordCard() {
  const navigate = useNavigate();
  const [oldPassword, setOld] = useState("");
  const [newPassword, setNew] = useState("");
  const [passwordConfirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== passwordConfirm) { toast.error("كلمتين السر مش زي بعض"); return; }
    setBusy(true);
    try {
      await apiRaw("/auth/password", { method: "PATCH", body: { oldPassword, newPassword, passwordConfirm } });
      toast.success("كلمة السر اتغيّرت، سجّل دخول تاني");
      tokenStore.set(null);
      void navigate({ to: "/admin/login" });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AdminCard>
      <h2 className="mb-3 font-bold">غيّر كلمة السر</h2>
      <form onSubmit={submit} className="space-y-3">
        <Input type="password" required placeholder="كلمة السر الحالية" autoComplete="current-password" value={oldPassword} onChange={(e) => setOld(e.target.value)} />
        <Input type="password" required minLength={6} maxLength={50} placeholder="كلمة السر الجديدة (6 حروف على الأقل)" autoComplete="new-password" value={newPassword} onChange={(e) => setNew(e.target.value)} />
        <Input type="password" required placeholder="أكّد كلمة السر الجديدة" autoComplete="new-password" value={passwordConfirm} onChange={(e) => setConfirm(e.target.value)} />
        <Button type="submit" variant="secondary" disabled={busy}>{busy && <Loader2 className="animate-spin" />} غيّر</Button>
      </form>
    </AdminCard>
  );
}
