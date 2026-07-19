'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { ContactMessageRecord } from '@/lib/db/contact-messages';
import { adminStrings, formatAdminDate } from '@/lib/admin/strings';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

const STATUS_STYLES = {
  new: 'bg-brand-50 text-brand-800',
  read: 'bg-ink-100 text-ink-700',
  archived: 'bg-ink-50 text-ink-500',
} as const;

export function ContactMessagesTable({
  messages,
  statusFilter,
}: {
  messages: ContactMessageRecord[];
  statusFilter: string;
}) {
  const t = adminStrings.contactMessages;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function setFilter(status: string) {
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    router.push(
      params.size > 0
        ? `/admin/messages?${params.toString()}`
        : '/admin/messages',
    );
  }

  async function updateStatus(
    id: string,
    status: 'new' | 'read' | 'archived',
  ) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/contact-messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return;
      startTransition(() => router.refresh());
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['all', t.allStatuses],
            ['new', t.statusNew],
            ['read', t.statusRead],
            ['archived', t.statusArchived],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
              statusFilter === value
                ? 'border-brand-300 bg-brand-50 text-brand-800'
                : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {messages.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-200 bg-white px-4 py-10 text-center text-sm text-ink-500">
          {t.empty}
        </p>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <article
              key={message.id}
              className="rounded-xl border border-ink-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-ink-900">{message.name}</h2>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                        STATUS_STYLES[message.status],
                      )}
                    >
                      {t.status[message.status]}
                    </span>
                  </div>
                  <a
                    href={`mailto:${message.email}`}
                    className="mt-1 block text-sm text-brand-700 hover:underline"
                  >
                    {message.email}
                  </a>
                  <p className="mt-1 text-xs text-ink-400">
                    {formatAdminDate(message.createdAt, 'long')}
                    {message.locale ? ` · ${message.locale.toUpperCase()}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {message.status !== 'read' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      loading={updatingId === message.id || pending}
                      onClick={() => void updateStatus(message.id, 'read')}
                    >
                      {t.markRead}
                    </Button>
                  ) : null}
                  {message.status !== 'archived' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      loading={updatingId === message.id || pending}
                      onClick={() => void updateStatus(message.id, 'archived')}
                    >
                      {t.archive}
                    </Button>
                  ) : null}
                  {message.status === 'archived' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      loading={updatingId === message.id || pending}
                      onClick={() => void updateStatus(message.id, 'new')}
                    >
                      {t.markNew}
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                {message.message}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
