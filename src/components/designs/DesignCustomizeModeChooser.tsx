'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/Card';
import { getDesignCustomizeHref } from '@/lib/designs/customize-modes';

const MODE_ILLUSTRATIONS = {
  form: {
    src: '/customize/mode-form.svg',
    altKey: 'modeFormIllustrationAlt',
  },
  canvas: {
    src: '/customize/mode-canvas.svg',
    altKey: 'modeCanvasIllustrationAlt',
  },
} as const;

export function DesignCustomizeModeChooser({ designId }: { designId: string }) {
  const t = useTranslations('designs.customize');

  const options = [
    {
      mode: 'form' as const,
      href: getDesignCustomizeHref(designId, 'form'),
      illustration: MODE_ILLUSTRATIONS.form,
      title: t('modeFormTitle'),
      description: t('modeFormDesc'),
    },
    {
      mode: 'canvas' as const,
      href: getDesignCustomizeHref(designId, 'canvas'),
      illustration: MODE_ILLUSTRATIONS.canvas,
      title: t('modeCanvasTitle'),
      description: t('modeCanvasDesc'),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
        {options.map(({ mode, href, illustration, title, description }) => (
          <Link key={mode} href={href} className="group block h-full">
            <Card className="flex h-full flex-col overflow-hidden p-0 transition group-hover:border-brand-300 group-hover:shadow-lg">
              <div className="relative aspect-[5/3] w-full overflow-hidden border-b border-ink-100 bg-gradient-to-br from-brand-50/80 to-ink-50">
                <Image
                  src={illustration.src}
                  alt={t(illustration.altKey)}
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, 420px"
                  className="object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-ink-900 group-hover:text-brand-700">
                  {title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{description}</p>
                <p className="mt-5 text-sm font-semibold text-brand-600">
                  {t('modeContinue')} →
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
