import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/admin/discounts")({
  head: () => ({ meta: [{ title: "خصومات الفاتورة — لوحة الإدارة" }] }),
  component: AdminDiscountsPage,
});

function AdminDiscountsPage() {
  return (
    <AdminPage title="خصومات الفاتورة">
      <EmptyState title="قريبًا" description="الصفحة دي لسه بتتعمل." />
    </AdminPage>
  );
}
