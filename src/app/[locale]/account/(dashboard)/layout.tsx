import { redirect } from '@/i18n/navigation';
import { getCustomerSession } from '@/lib/auth/customer';
import { AccountShell } from '@/components/account/AccountShell';

export default async function AccountDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getCustomerSession();
  if (!session) {
    redirect({ href: '/account/login', locale });
  }

  return <AccountShell>{children}</AccountShell>;
}
