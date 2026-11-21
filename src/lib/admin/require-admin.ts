import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin/auth';

export async function requireAdminSession(from?: string) {
  const session = await getAdminSession();
  if (!session) {
    const login = from
      ? `/admin/login?from=${encodeURIComponent(from)}`
      : '/admin/login';
    redirect(login);
  }
  return session;
}
