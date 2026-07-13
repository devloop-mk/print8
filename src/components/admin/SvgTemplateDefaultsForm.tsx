'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SvgDesignTemplate } from '@/lib/data/svg-design-templates';
import type { ManagedSvgTemplateDefaultsPayload } from '@/lib/db/managed-svg-templates';
import { buildDefaultSvgTemplateState } from '@/lib/designs/svg-template-engine';
import {
  applyManagedSvgTemplateDefaults,
  buildMergedDefaultSvgTemplateState,
} from '@/lib/designs/merge-svg-template-defaults';
import { getSvgFieldLabelId } from '@/lib/designs/svg-field-labels';
import { SvgInteractivePreview } from '@/components/designs/SvgInteractivePreview';
import { Button } from '@/components/ui/Button';
import {
  clampSvgTextScale,
  type SvgTextTransform,
} from '@/lib/designs/svg-text-transform';
import { cn } from '@/lib/utils';

type SvgTemplateDefaultsFormProps = {
  designId: string;
  svgTemplate: SvgDesignTemplate;
  initialDefaults: ManagedSvgTemplateDefaultsPayload | null;
};

function emptyDefaults(): ManagedSvgTemplateDefaultsPayload {
  return { textsEn: {}, textsMk: {}, colors: {}, transforms: {} };
}

function fieldRows(template: SvgDesignTemplate) {
  const rows: Array<{
    key: string;
    side: 'front' | 'back';
    field: SvgDesignTemplate['sides']['front']['texts'][number];
    label: string;
  }> = [];

  for (const [index, field] of template.sides.front.texts.entries()) {
    const key = `front:${field.id}`;
    rows.push({
      key,
      side: 'front',
      field,
      label: getSvgFieldLabelId(
        template,
        'front',
        field,
        index,
        template.sides.front.texts.length,
      ),
    });
  }

  if (template.sides.back) {
    for (const [index, field] of template.sides.back.texts.entries()) {
      const key = `back:${field.id}`;
      rows.push({
        key,
        side: 'back',
        field,
        label: getSvgFieldLabelId(
          template,
          'back',
          field,
          index,
          template.sides.back.texts.length,
        ),
      });
    }
  }

  return rows;
}

export function SvgTemplateDefaultsForm({
  designId,
  svgTemplate,
  initialDefaults,
}: SvgTemplateDefaultsFormProps) {
  const router = useRouter();
  const [defaults, setDefaults] = useState<ManagedSvgTemplateDefaultsPayload>(
    initialDefaults ?? emptyDefaults(),
  );
  const [localeTab, setLocaleTab] = useState<'mk' | 'en'>('mk');
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => fieldRows(svgTemplate), [svgTemplate]);

  const codeBaseMk = useMemo(
    () => buildDefaultSvgTemplateState(svgTemplate, 'mk'),
    [svgTemplate],
  );
  const codeBaseEn = useMemo(
    () => buildDefaultSvgTemplateState(svgTemplate, 'en'),
    [svgTemplate],
  );

  const previewStateMk = useMemo(
    () => buildMergedDefaultSvgTemplateState(svgTemplate, 'mk', defaults),
    [defaults, svgTemplate],
  );

  const hasBack = Boolean(svgTemplate.sides.back);

  const visibleRows = useMemo(
    () => rows.filter((row) => row.side === previewSide),
    [previewSide, rows],
  );

  function updateText(key: string, locale: 'mk' | 'en', value: string) {
    setDefaults((current) => ({
      ...current,
      textsMk:
        locale === 'mk'
          ? { ...current.textsMk, [key]: value }
          : current.textsMk,
      textsEn:
        locale === 'en'
          ? { ...current.textsEn, [key]: value }
          : current.textsEn,
    }));
  }

  function updateColor(slotId: string, value: string) {
    setDefaults((current) => ({
      ...current,
      colors: { ...current.colors, [slotId]: value },
    }));
  }

  function setFieldTransform(key: string, transform: SvgTextTransform) {
    setDefaults((current) => ({
      ...current,
      transforms: {
        ...current.transforms,
        [key]: {
          dx: transform.dx,
          dy: transform.dy,
          scale: clampSvgTextScale(transform.scale),
        },
      },
    }));
  }

  function updateTransform(
    key: string,
    patch: Partial<{ dx: number; dy: number; scale: number }>,
  ) {
    setFieldTransform(key, {
      dx: patch.dx ?? defaults.transforms[key]?.dx ?? 0,
      dy: patch.dy ?? defaults.transforms[key]?.dy ?? 0,
      scale: clampSvgTextScale(
        patch.scale ?? defaults.transforms[key]?.scale ?? 1,
      ),
    });
  }

  function selectField(key: string, side: 'front' | 'back') {
    setPreviewSide(side);
    setActiveFieldKey(key);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/designs/${designId}/svg-defaults`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaults }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to save defaults');
      }
      setDefaults(data.defaults);
      setMessage('Стандардните вредности се зачувани.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save defaults');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (
      !confirm(
        'Да се вратат стандардните вредности од кодот? Промените во базата ќе се избришат.',
      )
    ) {
      return;
    }

    setResetting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/designs/${designId}/svg-defaults`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to reset defaults');
      }
      setDefaults(emptyDefaults());
      setMessage('Стандардните вредности се вратени на вредностите од кодот.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset defaults');
    } finally {
      setResetting(false);
    }
  }

  const activeTexts = localeTab === 'mk' ? defaults.textsMk : defaults.textsEn;
  const codeTexts =
    localeTab === 'mk'
      ? applyManagedSvgTemplateDefaults(codeBaseMk, null, 'mk').texts
      : applyManagedSvgTemplateDefaults(codeBaseEn, null, 'en').texts;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 text-sm text-ink-700">
        Овде ги менувате <strong>стандардните</strong> текстови, бои и позиции што
        корисникот ги гледа при прво отворање на персонализаторот. Кликнете на текст на
        прегледот, повлечете го на ново место или променете ја големината со рачката во
        аголот — потоа зачувајте.
      </div>

      <section className="rounded-xl border border-ink-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Интерактивен преглед</h2>
            <p className="mt-1 text-sm text-ink-500">
              Изберете текст, повлечете за поместување, повлечете ја рачката за големина.
            </p>
          </div>
          {hasBack ? (
            <div className="flex rounded-lg border border-ink-200 p-1 text-sm">
              {(['front', 'back'] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => {
                    setPreviewSide(side);
                    setActiveFieldKey(null);
                  }}
                  className={cn(
                    'rounded-md px-3 py-1.5 font-medium',
                    previewSide === side
                      ? 'bg-brand-700 text-white'
                      : 'text-ink-600 hover:bg-ink-50',
                  )}
                >
                  {side === 'front' ? 'Предна' : 'Задна'}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mx-auto max-w-2xl rounded-lg border border-ink-200 bg-ink-50 p-2 sm:p-3">
          <SvgInteractivePreview
            template={svgTemplate}
            state={previewStateMk}
            side={previewSide}
            interactive
            activeFieldKey={activeFieldKey}
            onFieldSelect={setActiveFieldKey}
            onTransformChange={setFieldTransform}
          />
        </div>

        {visibleRows.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleRows.map((row) => (
              <button
                key={row.key}
                type="button"
                onClick={() => selectField(row.key, row.side)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition',
                  activeFieldKey === row.key
                    ? 'border-brand-600 bg-brand-50 text-brand-800'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
                )}
              >
                {row.label}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-ink-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink-900">Текст</h2>
              <div className="flex rounded-lg border border-ink-200 p-1 text-sm">
                {(['mk', 'en'] as const).map((locale) => (
                  <button
                    key={locale}
                    type="button"
                    onClick={() => setLocaleTab(locale)}
                    className={`rounded-md px-3 py-1.5 font-medium ${
                      localeTab === locale
                        ? 'bg-brand-700 text-white'
                        : 'text-ink-600 hover:bg-ink-50'
                    }`}
                  >
                    {locale.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {rows.map((row) => (
                <label key={`${localeTab}-${row.key}`} className="block text-sm">
                  <span className="mb-1 block font-medium text-ink-700">
                    {row.label}{' '}
                    <span className="font-normal text-ink-400">
                      ({row.key} · {row.side === 'front' ? 'предна' : 'задна'})
                    </span>
                  </span>
                  <input
                    value={activeTexts[row.key] ?? ''}
                    onChange={(event) =>
                      updateText(row.key, localeTab, event.target.value)
                    }
                    onFocus={() => selectField(row.key, row.side)}
                    placeholder={codeTexts[row.key] ?? row.field.default}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2',
                      activeFieldKey === row.key
                        ? 'border-brand-500 ring-2 ring-brand-200'
                        : 'border-ink-200',
                    )}
                  />
                  <span className="mt-1 block text-xs text-ink-400">
                    Код: {codeTexts[row.key] ?? row.field.default}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {svgTemplate.colors.length > 0 ? (
            <section className="rounded-xl border border-ink-200 bg-white p-5">
              <h2 className="mb-4 text-lg font-semibold text-ink-900">Бои</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {svgTemplate.colors.map((slot) => (
                  <label key={slot.id} className="block text-sm">
                    <span className="mb-1 block font-medium text-ink-700">
                      {slot.id}
                    </span>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={
                          defaults.colors[slot.id] ||
                          codeBaseMk.colors[slot.id] ||
                          slot.default
                        }
                        onChange={(event) =>
                          updateColor(slot.id, event.target.value)
                        }
                        className="h-10 w-14 cursor-pointer rounded border border-ink-200"
                      />
                      <input
                        value={defaults.colors[slot.id] ?? ''}
                        onChange={(event) =>
                          updateColor(slot.id, event.target.value)
                        }
                        placeholder={slot.default}
                        className="min-w-0 flex-1 rounded-lg border border-ink-200 px-3 py-2"
                      />
                    </div>
                  </label>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-xl border border-ink-200 bg-white p-5">
            <h2 className="mb-2 text-lg font-semibold text-ink-900">
              Големина и позиција
            </h2>
            <p className="mb-4 text-sm text-ink-500">
              Рачно прилагодување по поле (исто како на прегледот погоре).
            </p>
            <div className="grid gap-4">
              {rows.map((row) => {
                const transform = defaults.transforms[row.key];
                return (
                  <div
                    key={`transform-${row.key}`}
                    className="grid gap-3 rounded-lg border border-ink-100 bg-ink-50/70 p-3 sm:grid-cols-4"
                  >
                    <p className="text-sm font-medium text-ink-700 sm:col-span-4">
                      {row.label}{' '}
                      <span className="font-normal text-ink-400">
                        ({row.side === 'front' ? 'предна' : 'задна'})
                      </span>
                    </p>
                    <label className="text-sm">
                      <span className="mb-1 block text-ink-500">dx</span>
                      <input
                        type="number"
                        value={transform?.dx ?? ''}
                        onChange={(event) =>
                          updateTransform(row.key, {
                            dx: event.target.value === '' ? 0 : Number(event.target.value),
                          })
                        }
                        className="w-full rounded-lg border border-ink-200 px-3 py-2"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block text-ink-500">dy</span>
                      <input
                        type="number"
                        value={transform?.dy ?? ''}
                        onChange={(event) =>
                          updateTransform(row.key, {
                            dy: event.target.value === '' ? 0 : Number(event.target.value),
                          })
                        }
                        className="w-full rounded-lg border border-ink-200 px-3 py-2"
                      />
                    </label>
                    <label className="text-sm sm:col-span-2">
                      <span className="mb-1 block text-ink-500">scale</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.8"
                        max="1.2"
                        value={transform?.scale ?? ''}
                        onChange={(event) =>
                          updateTransform(row.key, {
                            scale:
                              event.target.value === '' ? 1 : Number(event.target.value),
                          })
                        }
                        className="w-full rounded-lg border border-ink-200 px-3 py-2"
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Се зачувува…' : 'Зачувај стандардни вредности'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={resetting}
          onClick={handleReset}
        >
          {resetting ? 'Се ресетира…' : 'Врати на код'}
        </Button>
      </div>
    </form>
  );
}
