import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LogOut, Menu, Plane, ExternalLink } from "lucide-react";
import { ADMIN_NAV } from "@/components/admin/nav";
import { adminLogout, fetchMe, useAdminToken } from "@/lib/admin-auth";
import { LoadingBlock } from "@/components/admin/AdminPage";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة الإدارة — البيه الطيار" },
      { name: "description", content: "إدارة الأوردرات والمنتجات والحسابات لمتجر البيه الطيار." },
      { property: "og:title", content: "لوحة الإدارة — البيه الطيار" },
      { property: "og:description", content: "إدارة الأوردرات والمنتجات والحسابات." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const token = useAdminToken();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!token) void navigate({ to: "/admin/login", replace: true });
  }, [token, navigate]);

  const me = useQuery({ queryKey: ["admin", "me"], queryFn: fetchMe, enabled: !!token, retry: false });

  if (!token) return <LoadingBlock label="بيحوّلك لتسجيل الدخول..." />;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
        <SidebarContent username={me.data?.username} />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-72 border-0 p-0">
          <SheetTitle className="sr-only">القائمة</SheetTitle>
          <SidebarContent username={me.data?.username} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-xl hover:bg-muted" aria-label="القائمة">
            <Menu className="size-5" />
          </button>
          <span className="font-bold text-primary">لوحة الإدارة</span>
          <span className="size-10" />
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ username, onNavigate }: { username?: string; onNavigate?: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="grid size-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <Plane className="size-5 -rotate-45" />
        </div>
        <div>
          <p className="font-bold leading-tight text-sidebar-accent-foreground">البيه الطيار</p>
          <p className="text-xs opacity-70">لوحة الإدارة</p>
        </div>
      </div>
      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4">
        {ADMIN_NAV.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider opacity-50">{group.title}</p>
            {group.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                activeOptions={{ exact: item.to === "/admin" }}
                className={cn(
                  "mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
                )}
                activeProps={{ className: "bg-sidebar-accent font-semibold text-sidebar-accent-foreground [&>svg]:text-sidebar-primary" }}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <a href="/" target="_blank" rel="noreferrer" className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-sidebar-accent">
          <ExternalLink className="size-4" /> افتح موقع العملاء
        </a>
        <button
          onClick={async () => {
            await adminLogout();
            void navigate({ to: "/admin/login" });
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-sidebar-accent"
        >
          <LogOut className="size-4" /> خروج{username ? ` (${username})` : ""}
        </button>
      </div>
    </div>
  );
}
