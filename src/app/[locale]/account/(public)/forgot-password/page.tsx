import { Suspense } from 'react';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="px-4 py-10 sm:px-6">
      <Suspense
        fallback={
          <div className="mx-auto max-w-md p-6 text-sm text-ink-600">…</div>
        }
      >
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
