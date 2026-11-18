import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "المنتجات — لوحة الإدارة" }] }),
  component: AdminProductsPage,
});

function AdminProductsPage() {
  return (
    <AdminPage title="المنتجات">
      <EmptyState title="قريبًا" description="الصفحة دي لسه بتتعمل." />
    </AdminPage>
  );
}
