import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/admin/accounting")({
  head: () => ({ meta: [{ title: "حسابات المطاعم — لوحة الإدارة" }] }),
  component: AdminAccountingPage,
});

function AdminAccountingPage() {
  return (
    <AdminPage title="حسابات المطاعم">
      <EmptyState title="قريبًا" description="الصفحة دي لسه بتتعمل." />
    </AdminPage>
  );
}
