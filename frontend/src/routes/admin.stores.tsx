import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/admin/stores")({
  head: () => ({ meta: [{ title: "المحلات والمطاعم — لوحة الإدارة" }] }),
  component: AdminStoresPage,
});

function AdminStoresPage() {
  return (
    <AdminPage title="المحلات والمطاعم">
      <EmptyState title="قريبًا" description="الصفحة دي لسه بتتعمل." />
    </AdminPage>
  );
}
