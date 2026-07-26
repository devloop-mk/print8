import { redirect } from '@/i18n/navigation';
import { getCustomerSession } from '@/lib/auth/customer';
import { AccountDashboard } from '@/components/account/AccountDashboard';

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getCustomerSession();
  if (!session) {
    redirect({ href: '/account/login', locale });
  }

  return <AccountDashboard />;
}
