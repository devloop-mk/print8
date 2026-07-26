import { redirect } from 'next/navigation';
import { getCustomerSession } from '@/lib/auth/customer';
import { LoginForm } from '@/components/auth/LoginForm';

export default async function AccountLoginPage() {
  const session = await getCustomerSession();
  if (session) {
    redirect('/account');
  }

  return (
    <div className="px-4 py-10 sm:px-6">
      <LoginForm />
    </div>
  );
}
