import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/admin/option-groups")({
  head: () => ({ meta: [{ title: "خيارات التجهيز — لوحة الإدارة" }] }),
  component: AdminOptionGroupsPage,
});

function AdminOptionGroupsPage() {
  return (
    <AdminPage title="خيارات التجهيز">
      <EmptyState title="قريبًا" description="الصفحة دي لسه بتتعمل." />
    </AdminPage>
  );
}
