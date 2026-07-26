import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCustomerSession } from '@/lib/auth/customer';
import { LoginForm } from '@/components/auth/LoginForm';

export default async function AccountLoginPage() {
  const session = await getCustomerSession();
  if (session) {
    redirect('/account');
  }

  return (
    <div className="px-4 py-10 sm:px-6">
      <Suspense fallback={<div className="mx-auto max-w-md p-6 text-sm text-ink-600">…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
