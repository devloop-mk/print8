import { NewsletterAdminPanel } from '@/components/admin/NewsletterAdminPanel';
import { adminStrings } from '@/lib/admin/strings';

export default function AdminNewsletterPage() {
  const t = adminStrings.newsletter;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900 sm:text-2xl">
          {t.title}
        </h1>
        <p className="mt-1 text-sm text-ink-500">{t.subtitle}</p>
      </div>
      <NewsletterAdminPanel />
    </div>
  );
}
