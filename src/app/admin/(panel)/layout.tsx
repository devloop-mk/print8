import { AdminShell } from '@/components/admin/AdminShell';
import { requireAdminSession } from '@/lib/admin/require-admin';

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminSession();

  return <AdminShell>{children}</AdminShell>;
}
