import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/admin/admins")({
  head: () => ({ meta: [{ title: "المشرفين — لوحة الإدارة" }] }),
  component: AdminAdminsPage,
});

function AdminAdminsPage() {
  return (
    <AdminPage title="المشرفين">
      <EmptyState title="قريبًا" description="الصفحة دي لسه بتتعمل." />
    </AdminPage>
  );
}
