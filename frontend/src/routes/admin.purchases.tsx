import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/admin/purchases")({
  head: () => ({ meta: [{ title: "قايمة الشراء — لوحة الإدارة" }] }),
  component: AdminPurchasesPage,
});

function AdminPurchasesPage() {
  return (
    <AdminPage title="قايمة الشراء">
      <EmptyState title="قريبًا" description="الصفحة دي لسه بتتعمل." />
    </AdminPage>
  );
}
