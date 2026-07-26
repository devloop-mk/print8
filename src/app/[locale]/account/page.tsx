import { redirect } from 'next/navigation';
import { getCustomerSession } from '@/lib/auth/customer';
import { AccountDashboard } from '@/components/account/AccountDashboard';

export default async function AccountPage() {
  const session = await getCustomerSession();
  if (!session) {
    redirect('/account/login');
  }

  return <AccountDashboard />;
}
