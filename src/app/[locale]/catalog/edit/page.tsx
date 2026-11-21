import type { Metadata } from 'next';
import { CatalogLogoEditor } from '@/components/catalog/CatalogLogoEditor';
import { requireAdminSession } from '@/lib/admin/require-admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Поставување лого | Каталог',
  robots: { index: false, follow: false },
};

export default async function CatalogLogoEditPage() {
  await requireAdminSession('/catalog/edit');
  return <CatalogLogoEditor />;
}
