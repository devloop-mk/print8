'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminStrings } from '@/lib/admin/strings';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type SubscriberRow = {
  id: string;
  email: string;
  locale: string | null;
  status: 'active' | 'unsubscribed';
  createdAt: string;
};

type TemplateLocaleCopy = {
  subject: string;
  body: string;
  headline: string;
  subtitle: string;
  ctaLabel: string;
  ctaPath: string;
};

type TemplateRow = {
  id: string;
  label: string;
  labelEn: string;
  description?: string;
  mk: TemplateLocaleCopy;
  en: TemplateLocaleCopy;
};

const emptyMeta = {
  headline: '',
  subtitle: '',
  headlineEn: '',
  subtitleEn: '',
  ctaLabel: '',
  ctaLabelEn: '',
  ctaPath: '/',
};

export function NewsletterAdminPanel() {
  const t = adminStrings.newsletter;
  const [counts, setCounts] = useState({ active: 0, unsubscribed: 0 });
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [subjectEn, setSubjectEn] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [meta, setMeta] = useState(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/newsletter');
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setCounts(data.counts);
      setSubscribers(data.subscribers ?? []);
      setTemplates(data.templates ?? []);
    } catch {
      setError(t.loadError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function applyTemplate(id: string) {
    setTemplateId(id);
    setMessage(null);
    if (!id) {
      setMeta(emptyMeta);
      return;
    }
    const selected = templates.find((item) => item.id === id);
    if (!selected) return;
    setSubject(selected.mk.subject);
    setBody(selected.mk.body);
    setSubjectEn(selected.en.subject);
    setBodyEn(selected.en.body);
    setMeta({
      headline: selected.mk.headline,
      subtitle: selected.mk.subtitle,
      headlineEn: selected.en.headline,
      subtitleEn: selected.en.subtitle,
      ctaLabel: selected.mk.ctaLabel,
      ctaLabelEn: selected.en.ctaLabel,
      ctaPath: selected.mk.ctaPath,
    });
  }

  const previewParagraphs = useMemo(
    () =>
      body
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean),
    [body],
  );

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;
    if (!window.confirm(t.confirmSend.replace('{count}', String(counts.active)))) {
      return;
    }

    setSending(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          body,
          subjectEn: subjectEn || null,
          bodyEn: bodyEn || null,
          templateId: templateId || null,
          headline: meta.headline || null,
          subtitle: meta.subtitle || null,
          headlineEn: meta.headlineEn || null,
          subtitleEn: meta.subtitleEn || null,
          ctaLabel: meta.ctaLabel || null,
          ctaLabelEn: meta.ctaLabelEn || null,
          ctaPath: meta.ctaPath || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : t.sendError);
        setSending(false);
        return;
      }

      setMessage(
        t.sendSuccess
          .replace('{sent}', String(data.sent ?? 0))
          .replace('{failed}', String(data.failed ?? 0)),
      );
    } catch {
      setError(t.sendError);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border border-ink-200 bg-white p-4">
          <p className="text-sm text-ink-500">{t.activeCount}</p>
          <p className="mt-1 text-2xl font-bold text-ink-900">
            {loading ? '…' : counts.active}
          </p>
        </div>
        <div className="border border-ink-200 bg-white p-4">
          <p className="text-sm text-ink-500">{t.unsubscribedCount}</p>
          <p className="mt-1 text-2xl font-bold text-ink-900">
            {loading ? '…' : counts.unsubscribed}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSend}
        className="space-y-5 border border-ink-200 bg-white p-4 sm:p-6"
      >
        <h2 className="text-lg font-semibold text-ink-900">{t.composeTitle}</h2>

        <div>
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <label className="block text-sm font-medium text-ink-700">
              {t.template}
            </label>
            <button
              type="button"
              onClick={() => {
                setTemplateId('');
                setSubject('');
                setBody('');
                setSubjectEn('');
                setBodyEn('');
                setMeta(emptyMeta);
              }}
              className="text-xs font-medium text-brand-700 underline-offset-2 hover:underline"
            >
              {t.templateCustom}
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((item) => {
              const selected = templateId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applyTemplate(item.id)}
                  className={cn(
                    'border px-3 py-3 text-left transition',
                    selected
                      ? 'border-brand-600 bg-brand-50 shadow-lift-brand'
                      : 'border-ink-200 bg-ink-50/40 hover:border-brand-300 hover:bg-white',
                  )}
                >
                  <p className="text-sm font-semibold text-ink-900">{item.label}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{item.labelEn}</p>
                  {item.description ? (
                    <p className="mt-2 text-xs leading-snug text-ink-600">
                      {item.description}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-ink-500">{t.templateHelp}</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-ink-800">{t.localeMk}</p>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">
                    {t.subject}
                  </label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    minLength={3}
                    className="w-full border border-ink-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">
                    {t.headline}
                  </label>
                  <input
                    value={meta.headline}
                    onChange={(e) =>
                      setMeta((m) => ({ ...m, headline: e.target.value }))
                    }
                    className="w-full border border-ink-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">
                    {t.emailSubtitle}
                  </label>
                  <input
                    value={meta.subtitle}
                    onChange={(e) =>
                      setMeta((m) => ({ ...m, subtitle: e.target.value }))
                    }
                    className="w-full border border-ink-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">
                    {t.body}
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    minLength={10}
                    rows={8}
                    placeholder={t.bodyPlaceholder}
                    className="w-full border border-ink-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-ink-800">{t.localeEn}</p>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">
                    {t.subject}
                  </label>
                  <input
                    value={subjectEn}
                    onChange={(e) => setSubjectEn(e.target.value)}
                    className="w-full border border-ink-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">
                    {t.headline}
                  </label>
                  <input
                    value={meta.headlineEn}
                    onChange={(e) =>
                      setMeta((m) => ({ ...m, headlineEn: e.target.value }))
                    }
                    className="w-full border border-ink-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">
                    {t.emailSubtitle}
                  </label>
                  <input
                    value={meta.subtitleEn}
                    onChange={(e) =>
                      setMeta((m) => ({ ...m, subtitleEn: e.target.value }))
                    }
                    className="w-full border border-ink-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">
                    {t.body}
                  </label>
                  <textarea
                    value={bodyEn}
                    onChange={(e) => setBodyEn(e.target.value)}
                    rows={8}
                    placeholder={t.bodyEnPlaceholder}
                    className="w-full border border-ink-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">
                  {t.ctaLabel}
                </label>
                <input
                  value={meta.ctaLabel}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, ctaLabel: e.target.value }))
                  }
                  className="w-full border border-ink-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">
                  {t.ctaLabelEn}
                </label>
                <input
                  value={meta.ctaLabelEn}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, ctaLabelEn: e.target.value }))
                  }
                  className="w-full border border-ink-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">
                  {t.ctaPath}
                </label>
                <input
                  value={meta.ctaPath}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, ctaPath: e.target.value }))
                  }
                  placeholder="/"
                  className="w-full border border-ink-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="border border-ink-200 bg-ink-50/50 p-3">
            <p className="mb-3 text-sm font-semibold text-ink-800">
              {t.previewTitle}
            </p>
            {meta.headline || subject ? (
              <div className="overflow-hidden border border-ink-200 bg-white shadow-sm">
                <div className="bg-[#225376] px-4 py-5 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#b9d5e9]">
                    Print 8
                  </p>
                  <p className="mt-1 text-lg font-bold leading-snug">
                    {meta.headline || subject}
                  </p>
                  {meta.subtitle ? (
                    <p className="mt-2 text-sm text-[#dceaf4]">{meta.subtitle}</p>
                  ) : null}
                </div>
                <div className="space-y-3 px-4 py-4 text-sm leading-relaxed text-ink-800">
                  {previewParagraphs.length > 0 ? (
                    previewParagraphs.map((paragraph, index) => (
                      <p key={index} className="whitespace-pre-wrap">
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p className="text-ink-400">{t.bodyPlaceholder}</p>
                  )}
                </div>
                {meta.ctaLabel ? (
                  <div className="px-4 pb-4">
                    <span className="inline-block bg-[#2f7cb2] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white">
                      {meta.ctaLabel}
                    </span>
                    <p className="mt-2 text-[11px] text-ink-400">{meta.ctaPath}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-ink-500">{t.previewEmpty}</p>
            )}
          </div>
        </div>

        {error ? (
          <p className="bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
        {message ? (
          <p className="bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {message}
          </p>
        ) : null}
        <Button type="submit" loading={sending} disabled={sending || counts.active === 0}>
          {t.send}
        </Button>
      </form>

      <div className="border border-ink-200 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-ink-900">{t.listTitle}</h2>
        {loading ? (
          <p className="mt-3 text-sm text-ink-500">{t.loading}</p>
        ) : subscribers.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">{t.empty}</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink-100">
            {subscribers.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="font-medium text-ink-900">{item.email}</span>
                <span className="text-ink-500">
                  {item.status === 'active' ? t.statusActive : t.statusUnsubscribed}
                  {item.locale ? ` · ${item.locale}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
