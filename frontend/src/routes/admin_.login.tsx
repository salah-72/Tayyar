import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Plane } from "lucide-react";
import { toast } from "sonner";
import { adminLogin } from "@/lib/admin-auth";
import { errorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin_/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "دخول الإدارة — البيه الطيار" },
      { name: "description", content: "تسجيل دخول مشرفي متجر البيه الطيار." },
      { property: "og:title", content: "دخول الإدارة — البيه الطيار" },
      { property: "og:description", content: "تسجيل دخول المشرفين." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminLogin(username.trim(), password);
      void navigate({ to: "/admin" });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-hero px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-card p-7 shadow-card">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 grid size-14 place-items-center rounded-2xl bg-gradient-saffron text-highlight-foreground">
            <Plane className="size-7 -rotate-45" />
          </div>
          <h1 className="text-xl font-bold">لوحة إدارة البيه الطيار</h1>
          <p className="mt-1 text-sm text-muted-foreground">سجّل دخولك علشان تدير المتجر</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input id="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required dir="ltr" className="h-11 text-left" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">كلمة السر</Label>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" className="h-11 text-left" />
          </div>
          <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl text-base">
            {busy && <Loader2 className="animate-spin" />} دخول
          </Button>
        </div>
      </form>
    </div>
  );
}
