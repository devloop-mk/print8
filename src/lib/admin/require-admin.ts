import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin/auth';

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }
  return session;
}
