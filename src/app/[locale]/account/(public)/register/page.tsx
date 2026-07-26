import { redirect } from '@/i18n/navigation';
import { getCustomerSession } from '@/lib/auth/customer';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default async function AccountRegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getCustomerSession();
  if (session) {
    redirect({ href: '/account', locale });
  }

  return (
    <div className="px-4 py-10 sm:px-6">
      <RegisterForm />
    </div>
  );
}
