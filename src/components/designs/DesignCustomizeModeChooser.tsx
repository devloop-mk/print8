'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DesignCardThumbnail } from '@/components/designs/DesignCardThumbnail';
import type { DesignTemplate } from '@/lib/data/catalog';
import { getDesignThumbAspect } from '@/lib/designs/design-thumb';
import {
  getDesignCustomizeHref,
  type DesignCustomizeMode,
} from '@/lib/designs/customize-modes';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

type ModeOption = {
  mode: DesignCustomizeMode;
  title: string;
  description: string;
};

function buildModeHref(
  templateId: string,
  mode: DesignCustomizeMode,
  edit: string | null,
) {
  const href = getDesignCustomizeHref(templateId, mode);
  if (!edit) return href;
  return `${href}?edit=${encodeURIComponent(edit)}`;
}

function ModeRadioOption({
  index,
  option,
  selected,
  onSelect,
  compact,
}: {
  index: number;
  option: ModeOption;
  selected: boolean;
  onSelect: () => void;
  compact: boolean;
}) {
  const inputId = `customize-mode-${option.mode}`;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'flex cursor-pointer items-start gap-2.5 rounded-xl border-2 p-2.5 transition sm:gap-3 sm:p-4',
        selected
          ? 'border-brand-500 bg-brand-50/60 shadow-sm'
          : 'border-ink-200 bg-white hover:border-brand-200',
      )}
    >
      <input
        id={inputId}
        type="radio"
        name="customize-mode"
        value={option.mode}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition',
          selected ? 'border-brand-600' : 'border-ink-300',
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            'h-2.5 w-2.5 rounded-full bg-brand-600 transition',
            selected ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
          )}
        />
      </span>
      <span className="flex min-w-0 flex-1 gap-2.5">
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
            selected ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600',
          )}
        >
          {index + 1}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink-900 sm:text-base">
            {option.title}
          </span>
          <span
            className={cn(
              'mt-0.5 block text-xs leading-relaxed text-ink-500 sm:text-sm',
              compact && 'line-clamp-2',
            )}
          >
            {option.description}
          </span>
        </span>
      </span>
    </label>
  );
}

export function DesignCustomizeModeChooser({
  template,
}: {
  template: DesignTemplate;
}) {
  const t = useTranslations('designs.customize');
  const td = useTranslations('designs');
  const router = useRouter();
  const searchParams = useSearchParams();
  const editCartItemId = searchParams.get('edit');
  const designName = td(`templates.${template.id}`);

  const options: ModeOption[] = [
    {
      mode: 'quick',
      title: t('modeQuickTitle'),
      description: t('modeQuickDesc'),
    },
    {
      mode: 'form',
      title: t('modeFormTitle'),
      description: t('modeFormDesc'),
    },
    {
      mode: 'canvas',
      title: t('modeCanvasTitle'),
      description: t('modeCanvasDesc'),
    },
  ];

  const [selectedMode, setSelectedMode] = useState<DesignCustomizeMode>('quick');

  function handleContinue() {
    router.push(buildModeHref(template.id, selectedMode, editCartItemId));
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Card className="overflow-hidden p-0 lg:grid lg:grid-cols-2">
        <div className="min-w-0 bg-gradient-to-b from-brand-50/40 to-white">
          <div className="border-b border-ink-100 px-4 py-3 sm:px-6 sm:py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              {t('selectedDesignPreview')}
            </p>
            <p className="mt-0.5 text-base font-semibold text-ink-900 sm:text-lg">
              {designName}
            </p>
          </div>
          <div
            className="relative mx-auto flex w-full max-w-md items-center justify-center overflow-hidden p-3 sm:max-w-lg sm:p-5"
            style={{
              aspectRatio: getDesignThumbAspect(template),
              maxHeight: 'min(52vh, 480px)',
            }}
          >
            <DesignCardThumbnail design={template} alt={designName} previewMode="live" />
          </div>
        </div>

        <div className="flex flex-col border-t border-ink-100 bg-white p-4 sm:p-6 lg:border-l lg:border-t-0">
          <h2 className="text-sm font-semibold text-ink-900 sm:text-lg">
            {t('chooseModeTitle')}
          </h2>
          <p className="mt-1 text-xs text-ink-500 sm:text-sm">{t('chooseModeSubtitle')}</p>

          <fieldset className="mt-3 flex flex-1 flex-col gap-2 sm:mt-5 sm:gap-3">
            <legend className="sr-only">{t('chooseModeTitle')}</legend>
            {options.map((option, index) => (
              <ModeRadioOption
                key={option.mode}
                index={index}
                option={option}
                selected={selectedMode === option.mode}
                onSelect={() => setSelectedMode(option.mode)}
                compact
              />
            ))}
          </fieldset>

          <Button
            type="button"
            className="mt-4 w-full gap-1.5 sm:mt-6"
            size="lg"
            onClick={handleContinue}
          >
            {t('modeContinue')}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
