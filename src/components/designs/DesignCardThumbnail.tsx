'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { Palette } from 'lucide-react';
import { CustomizableDesignPreview } from '@/components/designs/CustomizableDesignPreview';
import { SvgDesignPreviewScaled } from '@/components/designs/SvgDesignPreview';
import {
  getDefaultFieldValues,
  getDesignLayout,
  getLayoutFields,
  type DesignLayout,
} from '@/lib/data/design-layouts';
import { getSvgDesignTemplate } from '@/lib/data/svg-design-templates';
import { buildDefaultSvgTemplateState } from '@/lib/designs/svg-template-engine';
import { toSvgSiteLocale } from '@/lib/designs/svg-locale-defaults';
import { fitDesignThumbSize } from '@/lib/designs/design-thumb';
import type { DesignTemplate } from '@/lib/data/catalog';
import { resolveAssetUrl } from '@/lib/storage/asset-url';

const THUMB_RENDER_WIDTH = 320;

function ScaledLayoutPreview({
  layout,
  values,
  fill = false,
}: {
  layout: DesignLayout;
  values: ReturnType<typeof getDefaultFieldValues>;
  fill?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const fitted = fill
        ? {
            width: container.clientWidth,
            height: container.clientHeight,
          }
        : fitDesignThumbSize(
            container.clientWidth,
            container.clientHeight,
            layout.aspectRatio,
          );
      setScale(fitted.width / THUMB_RENDER_WIDTH);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [fill, layout.aspectRatio]);

  return (
    <div
      ref={containerRef}
      className={`flex h-full w-full ${fill ? '' : 'items-center justify-center'}`}
    >
      <div
        className={fill ? 'h-full w-full' : 'origin-center'}
        style={
          fill
            ? undefined
            : {
                width: THUMB_RENDER_WIDTH,
                transform: `scale(${scale})`,
              }
        }
      >
        <CustomizableDesignPreview
          layout={layout}
          colors={layout.defaultColors}
          values={values}
          side="front"
          className={
            fill
              ? 'h-full w-full'
              : 'w-full overflow-hidden rounded-md shadow-sm ring-1 ring-ink-200/80'
          }
        />
      </div>
    </div>
  );
}

export function DesignCardThumbnail({
  design,
  alt,
  className,
  fill = false,
}: {
  design: DesignTemplate;
  alt: string;
  className?: string;
  fill?: boolean;
}) {
  const locale = useLocale();
  const svgLocale = toSvgSiteLocale(locale);

  if (design.kind === 'customizable' && design.svgTemplateId) {
    const svgTemplate = getSvgDesignTemplate(design.svgTemplateId);
    if (svgTemplate) {
      const state = buildDefaultSvgTemplateState(svgTemplate, svgLocale);
      return (
        <div className={`relative h-full w-full ${className ?? ''}`}>
          <SvgDesignPreviewScaled
            template={svgTemplate}
            state={state}
            side="front"
            fill={fill}
          />
        </div>
      );
    }
  }

  if (design.kind === 'customizable' && design.layoutId) {
    const layout = getDesignLayout(design.layoutId);
    if (layout) {
      const values = getDefaultFieldValues(getLayoutFields(layout), layout.id);

      return (
        <div className={`relative h-full w-full ${className ?? ''}`}>
          <ScaledLayoutPreview layout={layout} values={values} fill={fill} />
        </div>
      );
    }
  }

  if (design.image) {
    return (
      <div className={`relative h-full w-full ${className ?? ''}`}>
        <Image
          src={resolveAssetUrl(design.image)}
          alt={alt}
          fill
          sizes="320px"
          className={
            fill
              ? 'object-cover transition group-hover:scale-[1.02]'
              : 'object-contain p-1 transition group-hover:scale-[1.02]'
          }
        />
      </div>
    );
  }

  return (
    <div className={`relative flex h-full items-center justify-center ${className ?? ''}`}>
      <Palette className="h-16 w-16 text-ink-400" aria-hidden="true" />
    </div>
  );
}
