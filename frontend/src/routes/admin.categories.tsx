import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({ meta: [{ title: "الأقسام — لوحة الإدارة" }] }),
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  return (
    <AdminPage title="الأقسام">
      <EmptyState title="قريبًا" description="الصفحة دي لسه بتتعمل." />
    </AdminPage>
  );
}
