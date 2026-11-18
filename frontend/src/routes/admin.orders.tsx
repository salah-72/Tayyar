import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "الأوردرات — لوحة الإدارة" }] }),
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  return (
    <AdminPage title="الأوردرات">
      <EmptyState title="قريبًا" description="الصفحة دي لسه بتتعمل." />
    </AdminPage>
  );
}
