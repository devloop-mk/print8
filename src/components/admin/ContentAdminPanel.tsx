'use client';

import { useState } from 'react';
import type { CmsContentRecord, CmsServiceRecord } from '@/lib/db/cms';
import { Button } from '@/components/ui/Button';

export function ContentAdminPanel({
  initialContent,
  initialServices,
}: {
  initialContent: CmsContentRecord[];
  initialServices: CmsServiceRecord[];
}) {
  const [content, setContent] = useState(initialContent);
  const [services, setServices] = useState(initialServices);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function saveContent(entry: CmsContentRecord) {
    setSavingKey(entry.key);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'content', entry }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to save content');
      }
      setMessage(`Зачувано: ${entry.label}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setSavingKey(null);
    }
  }

  async function saveService(entry: CmsServiceRecord) {
    setSavingKey(entry.id);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'service', entry }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to save service');
      }
      setMessage(`Зачувана услуга: ${entry.titleMk}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save service');
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Содржина на сајтот</h2>
          <p className="text-sm text-ink-500">
            Уредете текстови за почетна, контакт и други секции.
          </p>
        </div>
        {content.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 px-4 py-8 text-sm text-ink-500">
            Нема CMS записи. Пуштете го seed скриптот за почетна содржина.
          </p>
        ) : (
          <div className="space-y-4">
            {content.map((entry) => (
              <div
                key={entry.key}
                className="rounded-xl border border-ink-200 bg-white p-4"
              >
                <p className="text-sm font-medium text-ink-900">{entry.label}</p>
                <p className="text-xs text-ink-500">{entry.key}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-1 block text-ink-600">MK</span>
                    <textarea
                      rows={3}
                      value={entry.valueMk}
                      onChange={(event) =>
                        setContent((prev) =>
                          prev.map((item) =>
                            item.key === entry.key
                              ? { ...item, valueMk: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="w-full rounded-lg border border-ink-200 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-ink-600">EN</span>
                    <textarea
                      rows={3}
                      value={entry.valueEn}
                      onChange={(event) =>
                        setContent((prev) =>
                          prev.map((item) =>
                            item.key === entry.key
                              ? { ...item, valueEn: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="w-full rounded-lg border border-ink-200 px-3 py-2"
                    />
                  </label>
                </div>
                <div className="mt-3">
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingKey === entry.key}
                    onClick={() => saveContent(entry)}
                  >
                    {savingKey === entry.key ? 'Се зачувува…' : 'Зачувај'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Услуги</h2>
          <p className="text-sm text-ink-500">
            Наслови, описи, цени и видливост на услуги.
          </p>
        </div>
        {services.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 px-4 py-8 text-sm text-ink-500">
            Нема CMS услуги. Пуштете го seed скриптот за почетни услуги.
          </p>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-xl border border-ink-200 bg-white p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-1 block text-ink-600">Наслов MK</span>
                    <input
                      value={service.titleMk}
                      onChange={(event) =>
                        setServices((prev) =>
                          prev.map((item) =>
                            item.id === service.id
                              ? { ...item, titleMk: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="w-full rounded-lg border border-ink-200 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-ink-600">Наслов EN</span>
                    <input
                      value={service.titleEn}
                      onChange={(event) =>
                        setServices((prev) =>
                          prev.map((item) =>
                            item.id === service.id
                              ? { ...item, titleEn: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="w-full rounded-lg border border-ink-200 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm sm:col-span-2">
                    <span className="mb-1 block text-ink-600">Опис MK</span>
                    <textarea
                      rows={2}
                      value={service.descriptionMk}
                      onChange={(event) =>
                        setServices((prev) =>
                          prev.map((item) =>
                            item.id === service.id
                              ? { ...item, descriptionMk: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="w-full rounded-lg border border-ink-200 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm sm:col-span-2">
                    <span className="mb-1 block text-ink-600">Опис EN</span>
                    <textarea
                      rows={2}
                      value={service.descriptionEn}
                      onChange={(event) =>
                        setServices((prev) =>
                          prev.map((item) =>
                            item.id === service.id
                              ? { ...item, descriptionEn: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="w-full rounded-lg border border-ink-200 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm sm:col-span-2">
                    <span className="mb-1 block text-ink-600">Детали MK</span>
                    <textarea
                      rows={2}
                      value={service.detailMk}
                      onChange={(event) =>
                        setServices((prev) =>
                          prev.map((item) =>
                            item.id === service.id
                              ? { ...item, detailMk: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="w-full rounded-lg border border-ink-200 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm sm:col-span-2">
                    <span className="mb-1 block text-ink-600">Детали EN</span>
                    <textarea
                      rows={2}
                      value={service.detailEn}
                      onChange={(event) =>
                        setServices((prev) =>
                          prev.map((item) =>
                            item.id === service.id
                              ? { ...item, detailEn: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="w-full rounded-lg border border-ink-200 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-ink-600">Почетна цена</span>
                    <input
                      type="number"
                      value={service.startingPrice}
                      onChange={(event) =>
                        setServices((prev) =>
                          prev.map((item) =>
                            item.id === service.id
                              ? {
                                  ...item,
                                  startingPrice: Number(event.target.value) || 0,
                                }
                              : item,
                          ),
                        )
                      }
                      className="w-full rounded-lg border border-ink-200 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-ink-600">Редослед</span>
                    <input
                      type="number"
                      value={service.sortOrder}
                      onChange={(event) =>
                        setServices((prev) =>
                          prev.map((item) =>
                            item.id === service.id
                              ? {
                                  ...item,
                                  sortOrder: Number(event.target.value) || 0,
                                }
                              : item,
                          ),
                        )
                      }
                      className="w-full rounded-lg border border-ink-200 px-3 py-2"
                    />
                  </label>
                  <label className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={service.active}
                        onChange={(event) =>
                          setServices((prev) =>
                            prev.map((item) =>
                              item.id === service.id
                                ? { ...item, active: event.target.checked }
                                : item,
                            ),
                          )
                        }
                      />
                      Активна
                    </span>
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={service.featured}
                        onChange={(event) =>
                          setServices((prev) =>
                            prev.map((item) =>
                              item.id === service.id
                                ? { ...item, featured: event.target.checked }
                                : item,
                            ),
                          )
                        }
                      />
                      Истакната
                    </span>
                  </label>
                </div>
                <div className="mt-3">
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingKey === service.id}
                    onClick={() => saveService(service)}
                  >
                    {savingKey === service.id ? 'Се зачувува…' : 'Зачувај услуга'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
