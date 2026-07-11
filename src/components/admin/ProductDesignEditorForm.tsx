'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type {
  ProductDesignTemplate,
  ProductType,
} from '@/lib/data/catalog';
import { products } from '@/lib/data/catalog';
import type { ResolvedAdminProductDesign } from '@/lib/admin/product-designs-shared';
import {
  PRODUCT_DESIGN_CATEGORY_OPTIONS,
  PRODUCT_DESIGN_KIND_OPTIONS,
  PRODUCT_SIDE_OPTIONS,
  productTypes,
} from '@/lib/admin/product-designs-shared';
import { ProductDesignColorMatrix } from '@/components/admin/ProductDesignColorMatrix';
import { AdminAssetUploader } from '@/components/admin/AdminAssetUploader';
import { Button } from '@/components/ui/Button';
import { resolveAssetUrl } from '@/lib/storage/asset-url';

type ProductDesignEditorFormProps = {
  design: ResolvedAdminProductDesign;
};

function AssetField({
  label,
  value,
  onChange,
  folder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  folder: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink-700">{label}</span>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-ink-200 px-3 py-2"
        />
        <AdminAssetUploader folder={folder} onUploaded={onChange} />
      </div>
    </label>
  );
}

export function ProductDesignEditorForm({ design }: ProductDesignEditorFormProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<ProductDesignTemplate>(design.template);
  const [active, setActive] = useState(design.active);
  const [sortOrder, setSortOrder] = useState(String(design.sortOrder));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFolder = `product-designs/${design.id}`;

  const linkedProductOptions = useMemo(
    () =>
      products.filter((product) =>
        template.productTypes.includes(product.type),
      ),
    [template.productTypes],
  );

  function patchTemplate(patch: Partial<ProductDesignTemplate>) {
    setTemplate((current) => ({ ...current, ...patch }));
  }

  function toggleProductType(type: ProductType) {
    const next = template.productTypes.includes(type)
      ? template.productTypes.filter((item) => item !== type)
      : [...template.productTypes, type];
    patchTemplate({ productTypes: next.length ? next : [type] });
  }

  function toggleProductId(id: string) {
    const current = template.productIds ?? [];
    const next = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id];
    patchTemplate({ productIds: next.length ? next : undefined });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/product-designs/${design.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          active,
          sortOrder: Number(sortOrder) || 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to save product design');
      }

      setMessage('Промените се зачувани.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleResetOverride() {
    if (!design.managed) return;
    if (!confirm('Да се отстрани админ измената и да се врати на верзијата од код?')) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/product-designs/${design.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to reset');
      }
      router.push('/admin/product-designs');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset');
      setSaving(false);
    }
  }

  const previewSrc =
    template.overlayImage ??
    template.image ??
    (template.overlayColorVariants
      ? Object.values(template.overlayColorVariants)[0]
      : undefined);

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 xl:grid-cols-[280px_1fr]">
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
          <div className="relative aspect-square bg-ink-50">
            {previewSrc ? (
              <Image
                src={resolveAssetUrl(previewSrc)}
                alt={template.titleMk ?? template.id}
                fill
                sizes="280px"
                className="object-contain p-3"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink-400">
                Нема преглед
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-ink-200 bg-white p-4 text-sm text-ink-600">
          <p>
            <span className="font-medium text-ink-800">ID:</span> {design.id}
          </p>
          {design.staticTemplate ? (
            <p className="mt-2 text-amber-700">
              Овој дизајн е во кодот. Зачувувањето создава админ измена во база.
            </p>
          ) : (
            <p className="mt-2 text-brand-700">Само админ дизајн (не е во код).</p>
          )}
          {design.managed ? (
            <p className="mt-2 text-xs text-ink-500">
              Последна измена: {new Date(design.managed.updatedAt).toLocaleString('mk-MK')}
            </p>
          ) : null}
        </div>

        {design.managed ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={saving}
            onClick={() => void handleResetOverride()}
          >
            Отстрани админ измена
          </Button>
        ) : null}
      </div>

      <div className="space-y-8">
        <section className="rounded-xl border border-ink-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-ink-900">Основно</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-ink-700">nameKey</span>
              <input
                value={template.nameKey}
                onChange={(event) => patchTemplate({ nameKey: event.target.value })}
                className="w-full rounded-lg border border-ink-200 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink-700">Наслов (MK)</span>
              <input
                value={template.titleMk ?? ''}
                onChange={(event) => patchTemplate({ titleMk: event.target.value })}
                className="w-full rounded-lg border border-ink-200 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink-700">Наслов (EN)</span>
              <input
                value={template.titleEn ?? ''}
                onChange={(event) => patchTemplate({ titleEn: event.target.value })}
                className="w-full rounded-lg border border-ink-200 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink-700">Тип</span>
              <select
                value={template.kind}
                onChange={(event) =>
                  patchTemplate({
                    kind: event.target.value as ProductDesignTemplate['kind'],
                  })
                }
                className="w-full rounded-lg border border-ink-200 px-3 py-2"
              >
                {PRODUCT_DESIGN_KIND_OPTIONS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink-700">Категорија</span>
              <select
                value={template.category}
                onChange={(event) =>
                  patchTemplate({
                    category: event.target.value as ProductDesignTemplate['category'],
                  })
                }
                className="w-full rounded-lg border border-ink-200 px-3 py-2"
              >
                {PRODUCT_DESIGN_CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink-700">Колекција</span>
              <input
                value={template.collection ?? ''}
                onChange={(event) => patchTemplate({ collection: event.target.value || undefined })}
                className="w-full rounded-lg border border-ink-200 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink-700">Препорачана боја</span>
              <input
                type="color"
                value={template.recommendedColor ?? '#000000'}
                onChange={(event) => patchTemplate({ recommendedColor: event.target.value })}
                className="h-10 w-full rounded-lg border border-ink-200"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink-700">Страна</span>
              <select
                value={template.defaultSide}
                onChange={(event) =>
                  patchTemplate({
                    defaultSide: event.target.value as ProductDesignTemplate['defaultSide'],
                  })
                }
                className="w-full rounded-lg border border-ink-200 px-3 py-2"
              >
                {PRODUCT_SIDE_OPTIONS.map((side) => (
                  <option key={side} value={side}>
                    {side}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink-700">Редослед</span>
              <input
                type="number"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="w-full rounded-lg border border-ink-200 px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                className="h-4 w-4 rounded border-ink-300 text-brand-600"
              />
              <span className="font-medium text-ink-700">Активен на сајтот</span>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-ink-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-ink-900">Производи</h2>
          <p className="mt-1 text-sm text-ink-500">
            Типови и конкретни производи на кои важи дизајнот.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {productTypes.map((type) => (
              <label
                key={type}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={template.productTypes.includes(type)}
                  onChange={() => toggleProductType(type)}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600"
                />
                {type}
              </label>
            ))}
          </div>
          {linkedProductOptions.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-ink-700">
                Ограничи на производи (опционално)
              </p>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-ink-100 p-2">
                {linkedProductOptions.map((product) => (
                  <label
                    key={product.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-ink-50"
                  >
                    <input
                      type="checkbox"
                      checked={template.productIds?.includes(product.id) ?? false}
                      onChange={() => toggleProductId(product.id)}
                      className="h-4 w-4 rounded border-ink-300 text-brand-600"
                    />
                    <span>{product.id}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-ink-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-ink-900">Слики и overlay</h2>
          <div className="mt-4 grid gap-4">
            <AssetField
              label="image (thumbnail / full product)"
              value={template.image ?? ''}
              onChange={(value) => patchTemplate({ image: value || undefined })}
              folder={uploadFolder}
            />
            <AssetField
              label="overlayImage (PNG print art)"
              value={template.overlayImage ?? ''}
              onChange={(value) => patchTemplate({ overlayImage: value || undefined })}
              folder={uploadFolder}
            />
            <AssetField
              label="overlaySvg"
              value={template.overlaySvg ?? ''}
              onChange={(value) => patchTemplate({ overlaySvg: value || undefined })}
              folder={uploadFolder}
            />
            <AssetField
              label="printMasterImage"
              value={template.printMasterImage ?? ''}
              onChange={(value) => patchTemplate({ printMasterImage: value || undefined })}
              folder={uploadFolder}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink-700">overlayScale</span>
                <input
                  type="number"
                  value={template.overlayScale ?? ''}
                  onChange={(event) =>
                    patchTemplate({
                      overlayScale: event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    })
                  }
                  className="w-full rounded-lg border border-ink-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink-700">position X</span>
                <input
                  type="number"
                  value={template.overlayPosition?.x ?? ''}
                  onChange={(event) =>
                    patchTemplate({
                      overlayPosition: {
                        x: Number(event.target.value) || 0,
                        y: template.overlayPosition?.y ?? 44,
                      },
                    })
                  }
                  className="w-full rounded-lg border border-ink-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink-700">position Y</span>
                <input
                  type="number"
                  value={template.overlayPosition?.y ?? ''}
                  onChange={(event) =>
                    patchTemplate({
                      overlayPosition: {
                        x: template.overlayPosition?.x ?? 50,
                        y: Number(event.target.value) || 0,
                      },
                    })
                  }
                  className="w-full rounded-lg border border-ink-200 px-3 py-2"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink-700">Recolor primary</span>
                <input
                  type="color"
                  value={template.overlayRecolor?.primary ?? '#000000'}
                  onChange={(event) =>
                    patchTemplate({
                      overlayRecolor: {
                        ...template.overlayRecolor,
                        primary: event.target.value,
                      },
                    })
                  }
                  className="h-10 w-full rounded-lg border border-ink-200"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink-700">Recolor secondary</span>
                <input
                  type="color"
                  value={template.overlayRecolor?.secondary ?? '#ffffff'}
                  onChange={(event) =>
                    patchTemplate({
                      overlayRecolor: {
                        primary: template.overlayRecolor?.primary ?? '#000000',
                        secondary: event.target.value,
                      },
                    })
                  }
                  className="h-10 w-full rounded-lg border border-ink-200"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-ink-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-ink-900">Бои по производ</h2>
          <div className="mt-4">
            <ProductDesignColorMatrix
              template={template}
              applicableColors={template.applicableColors ?? []}
              overlayColorVariants={template.overlayColorVariants ?? {}}
              onApplicableColorsChange={(colors) =>
                patchTemplate({ applicableColors: colors })
              }
              onVariantsChange={(variants) =>
                patchTemplate({ overlayColorVariants: variants })
              }
              uploadFolder={uploadFolder}
            />
          </div>
        </section>

        {template.kind === 'text' ? (
          <section className="rounded-xl border border-ink-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-ink-900">Текст стил</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-ink-700">Текст</span>
                <input
                  value={template.textStyle?.text ?? ''}
                  onChange={(event) =>
                    patchTemplate({
                      textStyle: {
                        ...template.textStyle!,
                        text: event.target.value,
                        textColor: template.textStyle?.textColor ?? '#000000',
                        textSize: template.textStyle?.textSize ?? 24,
                        textPosition: template.textStyle?.textPosition ?? { x: 50, y: 50 },
                      },
                    })
                  }
                  className="w-full rounded-lg border border-ink-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink-700">Боја на текст</span>
                <input
                  type="color"
                  value={template.textStyle?.textColor ?? '#000000'}
                  onChange={(event) =>
                    patchTemplate({
                      textStyle: {
                        ...template.textStyle!,
                        text: template.textStyle?.text ?? '',
                        textColor: event.target.value,
                        textSize: template.textStyle?.textSize ?? 24,
                        textPosition: template.textStyle?.textPosition ?? { x: 50, y: 50 },
                      },
                    })
                  }
                  className="h-10 w-full rounded-lg border border-ink-200"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink-700">Големина</span>
                <input
                  type="number"
                  value={template.textStyle?.textSize ?? ''}
                  onChange={(event) =>
                    patchTemplate({
                      textStyle: {
                        ...template.textStyle!,
                        text: template.textStyle?.text ?? '',
                        textColor: template.textStyle?.textColor ?? '#000000',
                        textSize: Number(event.target.value) || 24,
                        textPosition: template.textStyle?.textPosition ?? { x: 50, y: 50 },
                      },
                    })
                  }
                  className="w-full rounded-lg border border-ink-200 px-3 py-2"
                />
              </label>
            </div>
          </section>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Се зачувува…' : 'Зачувај'}
          </Button>
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      </div>
    </form>
  );
}
