import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/admin/areas")({
  head: () => ({ meta: [{ title: "البلاد والتوصيل — لوحة الإدارة" }] }),
  component: AdminAreasPage,
});

function AdminAreasPage() {
  return (
    <AdminPage title="البلاد والتوصيل">
      <EmptyState title="قريبًا" description="الصفحة دي لسه بتتعمل." />
    </AdminPage>
  );
}
