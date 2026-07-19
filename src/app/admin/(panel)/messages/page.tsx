import { ContactMessagesTable } from '@/components/admin/ContactMessagesTable';
import {
  listContactMessages,
  type ContactMessageRecord,
  type ContactMessageStatus,
} from '@/lib/db/contact-messages';
import { adminStrings } from '@/lib/admin/strings';

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusParam = params.status ?? 'all';
  const status =
    statusParam === 'new' ||
    statusParam === 'read' ||
    statusParam === 'archived' ||
    statusParam === 'all'
      ? statusParam
      : 'all';

  let messages: ContactMessageRecord[] = [];
  let loadError: string | null = null;
  try {
    messages = await listContactMessages({
      status: status as ContactMessageStatus | 'all',
      limit: 100,
    });
  } catch {
    loadError = adminStrings.contactMessages.loadError;
  }

  const t = adminStrings.contactMessages;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900 sm:text-2xl">
          {t.title}
        </h1>
        <p className="mt-1 text-sm text-ink-500">{t.subtitle}</p>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadError}
        </p>
      ) : (
        <ContactMessagesTable messages={messages} statusFilter={status} />
      )}
    </div>
  );
}
