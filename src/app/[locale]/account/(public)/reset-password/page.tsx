import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="px-4 py-10 sm:px-6">
      <Suspense
        fallback={
          <div className="mx-auto max-w-md p-6 text-sm text-ink-600">…</div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
