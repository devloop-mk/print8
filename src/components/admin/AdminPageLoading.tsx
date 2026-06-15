import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { adminStrings } from '@/lib/admin/strings';

export function AdminPageLoading({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4 py-16">
      <LoadingIndicator label={label ?? adminStrings.login.loading} size="lg" />
    </div>
  );
}
