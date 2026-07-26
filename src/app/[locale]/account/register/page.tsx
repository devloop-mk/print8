import { redirect } from 'next/navigation';
import { getCustomerSession } from '@/lib/auth/customer';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default async function AccountRegisterPage() {
  const session = await getCustomerSession();
  if (session) {
    redirect('/account');
  }

  return (
    <div className="px-4 py-10 sm:px-6">
      <RegisterForm />
    </div>
  );
}
