import { Suspense } from 'react';
import { Card } from '@/components/ui/Card';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { AdminPageLoading } from '@/components/admin/AdminPageLoading';
import { isAdminAuthConfigured } from '@/lib/admin/auth';
import { adminStrings } from '@/lib/admin/strings';

export default function AdminLoginPage() {
  const configured = isAdminAuthConfigured();
  const t = adminStrings.login;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:py-12">
      <Card className="w-full max-w-md p-5 sm:p-6">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            {adminStrings.brand}
          </p>
          <h1 className="text-2xl font-semibold text-ink-900">{t.title}</h1>
          <p className="mt-1 text-sm text-ink-500">{t.subtitle}</p>
        </div>

        {!configured ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t.notConfigured}
          </p>
        ) : (
          <Suspense fallback={<AdminPageLoading />}>
            <AdminLoginForm />
          </Suspense>
        )}
      </Card>
    </div>
  );
}
