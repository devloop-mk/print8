import { Suspense } from 'react';
import { Card } from '@/components/ui/Card';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { isAdminAuthConfigured } from '@/lib/admin/auth';

export default function AdminLoginPage() {
  const configured = isAdminAuthConfigured();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Print 8
          </p>
          <h1 className="text-2xl font-semibold text-ink-900">Admin login</h1>
          <p className="mt-1 text-sm text-ink-500">
            Sign in to manage orders and view store metrics.
          </p>
        </div>

        {!configured ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Admin credentials are not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD, and
            ADMIN_SESSION_SECRET in your environment.
          </p>
        ) : (
          <Suspense fallback={<p className="text-sm text-ink-500">Loading…</p>}>
            <AdminLoginForm />
          </Suspense>
        )}
      </Card>
    </div>
  );
}
