import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "إعدادات المتجر — لوحة الإدارة" }] }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  return (
    <AdminPage title="إعدادات المتجر">
      <EmptyState title="قريبًا" description="الصفحة دي لسه بتتعمل." />
    </AdminPage>
  );
}
