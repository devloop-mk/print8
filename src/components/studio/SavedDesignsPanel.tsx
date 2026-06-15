'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import type { SavedDesign } from '@/lib/designs/saved-designs';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface SavedDesignsPanelProps {
  designs: SavedDesign[];
  onContinue: (design: SavedDesign) => void;
  onAddToCart: (design: SavedDesign) => void;
  onDelete: (id: string) => void;
}

function formatSavedDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function SavedDesignsPanel({
  designs,
  onContinue,
  onAddToCart,
  onDelete,
}: SavedDesignsPanelProps) {
  const t = useTranslations('studio');
  const locale = useLocale();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {designs.map((design) => (
        <Card
          key={design.id}
          className="flex flex-col overflow-hidden p-0"
        >
          <div className="relative aspect-[4/3] bg-ink-50">
            <Image
              src={design.previewDataUrl}
              alt={design.name}
              fill
              unoptimized
              className="object-contain p-3"
            />
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div>
              <h3 className="font-semibold text-ink-900">{design.name}</h3>
              <p className="mt-1 text-sm text-ink-500">
                {formatSavedDate(design.updatedAt, locale)}
              </p>
            </div>
            <div className="mt-auto flex flex-col gap-2">
              <Button
                size="sm"
                onClick={() => onContinue(design)}
              >
                {t('continueEditing')}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onAddToCart(design)}
              >
                {t('addToCart')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(design.id)}
              >
                {t('deleteDesign')}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
