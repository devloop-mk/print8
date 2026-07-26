import { redirect } from '@/i18n/navigation';
import { Suspense } from 'react';
import { getCustomerSession } from '@/lib/auth/customer';
import { LoginForm } from '@/components/auth/LoginForm';

export default async function AccountLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { locale } = await params;
  const { redirect: redirectPath } = await searchParams;
  const session = await getCustomerSession();
  if (session) {
    const safeRedirect =
      redirectPath?.startsWith('/') && !redirectPath.startsWith('//')
        ? redirectPath
        : '/account';
    redirect({ href: safeRedirect, locale });
  }

  return (
    <div className="px-4 py-10 sm:px-6">
      <Suspense fallback={<div className="mx-auto max-w-md p-6 text-sm text-ink-600">…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
