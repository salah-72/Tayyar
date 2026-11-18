import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, UserRound } from "lucide-react";
import { apiRaw } from "@/lib/api/client";
import type { AdminUser } from "@/lib/api/types";
import { fetchMe } from "@/lib/admin-auth";
import { AdminPage, LoadingBlock, ErrorBlock } from "@/components/admin/AdminPage";
import { FormSheet, Field } from "@/components/admin/form";
import { useAdminMutation } from "@/components/admin/hooks";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/admins")({
  head: () => ({ meta: [{ title: "المشرفين — لوحة الإدارة" }] }),
  component: AdminAdminsPage,
});

function AdminAdminsPage() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const me = useQuery({ queryKey: ["admin", "me"], queryFn: fetchMe });
  const q = useQuery({ queryKey: ["admin", "admins"], queryFn: () => apiRaw<{ data: { admins: AdminUser[] } }>("/auth/admins").then((r) => r.data.admins) });
  const create = useAdminMutation(
    () => apiRaw("/auth/newAdmin", { method: "POST", body: { username: username.trim().toLowerCase(), password } }),
    { success: "المشرف اتضاف", onSuccess: () => { setOpen(false); setUsername(""); setPassword(""); } },
  );
  const del = useAdminMutation((id: number) => apiRaw(`/auth/${id}`, { method: "DELETE" }), { success: "المشرف اتمسح" });

  return (
    <AdminPage title="المشرفين" description="مين يقدر يدخل لوحة الإدارة" actions={<Button onClick={() => setOpen(true)} className="rounded-xl"><Plus /> مشرف جديد</Button>}>
      {q.isLoading ? (
        <LoadingBlock />
      ) : q.error ? (
        <ErrorBlock message="تعذّر التحميل" onRetry={() => q.refetch()} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {q.data?.map((a) => {
            const isMe = a.id === me.data?.id;
            return (
              <div key={a.id} className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-card">
                <span className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary"><UserRound className="size-5" /></span>
                <div className="flex-1">
                  <p className="font-bold" dir="ltr">{a.username}</p>
                  {isMe && <p className="text-xs text-primary">ده إنت</p>}
                </div>
                {!isMe && (q.data?.length ?? 0) > 1 && (
                  <ConfirmButton trigger={<Button size="icon" variant="ghost" className="text-destructive" aria-label="مسح"><Trash2 /></Button>} title={`مسح ${a.username}؟`} description="مش هيقدر يدخل لوحة الإدارة تاني." confirmLabel="امسح" onConfirm={() => del.mutate(a.id)} />
                )}
              </div>
            );
          })}
        </div>
      )}
      <FormSheet open={open} onOpenChange={setOpen} title="مشرف جديد" busy={create.isPending} onSubmit={() => create.mutate(undefined)}>
        <Field label="اسم المستخدم" hint="حروف إنجليزي صغيرة"><Input required maxLength={30} dir="ltr" autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} className="text-left" /></Field>
        <Field label="كلمة السر" hint="من 6 لـ 50 حرف"><Input type="password" required minLength={6} maxLength={50} dir="ltr" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="text-left" /></Field>
      </FormSheet>
    </AdminPage>
  );
}
