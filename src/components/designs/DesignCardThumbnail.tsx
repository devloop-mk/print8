'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { Palette } from 'lucide-react';
import { CustomizableDesignPreview } from '@/components/designs/CustomizableDesignPreview';
import { SvgDesignPreviewThumb } from '@/components/designs/SvgDesignPreview';
import {
  getDefaultFieldValues,
  getDesignLayout,
  getLayoutFields,
  type DesignLayout,
} from '@/lib/data/design-layouts';
import { getSvgDesignTemplate } from '@/lib/data/svg-design-templates';
import type { ManagedSvgTemplateDefaultsPayload } from '@/lib/db/managed-svg-templates';
import { buildMergedDefaultSvgTemplateState } from '@/lib/designs/merge-svg-template-defaults';
import { toSvgSiteLocale } from '@/lib/designs/svg-locale-defaults';
import { fitDesignThumbSize, getDesignGalleryImage } from '@/lib/designs/design-thumb';
import type { DesignTemplate } from '@/lib/data/catalog';
import { resolveAssetUrl } from '@/lib/storage/asset-url';
import { useInView } from '@/hooks/useInView';

const THUMB_RENDER_WIDTH = 320;

type DesignCardThumbnailProps = {
  design: DesignTemplate;
  alt: string;
  className?: string;
  fill?: boolean;
  svgDefaultsMap?: Record<string, ManagedSvgTemplateDefaultsPayload>;
  /** lazy: live preview when scrolled into view; live: always; static: image file only */
  previewMode?: 'static' | 'live' | 'lazy';
};

function isSvgAsset(path: string) {
  return path.toLowerCase().endsWith('.svg');
}

function DesignCardImageThumb({
  src,
  alt,
  fill = false,
  className,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
}) {
  const resolved = resolveAssetUrl(src);
  const imageClassName = fill
    ? 'h-full w-full object-cover transition group-hover:scale-[1.02]'
    : 'h-full w-full object-contain p-1 transition group-hover:scale-[1.02]';

  if (isSvgAsset(src)) {
    return (
      <img
        src={resolved}
        alt={alt}
        className={`${imageClassName} ${className ?? ''}`}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div className={`relative h-full w-full ${className ?? ''}`}>
      <Image
        src={resolved}
        alt={alt}
        fill
        sizes="320px"
        className={imageClassName}
      />
    </div>
  );
}

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

function SvgTemplateCardThumb({
  design,
  svgTemplateId,
  fill = false,
  className,
  svgDefaultsMap,
}: {
  design: DesignTemplate;
  svgTemplateId: string;
  fill?: boolean;
  className?: string;
  svgDefaultsMap?: Record<string, ManagedSvgTemplateDefaultsPayload>;
}) {
  const locale = useLocale();
  const svgLocale = toSvgSiteLocale(locale);
  const svgTemplate = getSvgDesignTemplate(svgTemplateId);

  const state = useMemo(() => {
    if (!svgTemplate) return null;
    return buildMergedDefaultSvgTemplateState(
      svgTemplate,
      svgLocale,
      svgDefaultsMap?.[svgTemplateId] ?? null,
    );
  }, [svgDefaultsMap, svgLocale, svgTemplate, svgTemplateId]);

  if (!svgTemplate || !state) return null;

  return (
    <div className={`relative h-full w-full ${className ?? ''}`}>
      <SvgDesignPreviewThumb
        template={svgTemplate}
        state={state}
        side="front"
        scopeId={design.id}
        fill={fill}
      />
    </div>
  );
}

function DesignCardThumbnailLive({
  design,
  alt,
  className,
  fill = false,
  svgDefaultsMap,
}: DesignCardThumbnailProps) {
  if (design.kind === 'customizable' && design.svgTemplateId) {
    const svgTemplate = getSvgDesignTemplate(design.svgTemplateId);
    if (svgTemplate) {
      return (
        <SvgTemplateCardThumb
          design={design}
          svgTemplateId={design.svgTemplateId}
          fill={fill}
          className={className}
          svgDefaultsMap={svgDefaultsMap}
        />
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
        <DesignCardImageThumb src={design.image} alt={alt} fill={fill} />
      </div>
    );
  }

  return (
    <div className={`relative flex h-full items-center justify-center ${className ?? ''}`}>
      <Palette className="h-16 w-16 text-ink-400" aria-hidden="true" />
    </div>
  );
}

function DesignCardThumbnailLazy(props: DesignCardThumbnailProps) {
  const { ref, inView } = useInView<HTMLDivElement>({
    rootMargin: '80px 0px',
    once: false,
  });

  return (
    <div
      ref={ref}
      className={`relative h-full w-full [content-visibility:auto] [contain-intrinsic-size:auto_280px] ${props.className ?? ''}`}
    >
      {inView ? (
        <DesignCardThumbnailLive {...props} className={undefined} />
      ) : props.design.image ? (
        <DesignCardImageThumb src={props.design.image} alt={props.alt} fill={props.fill} />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-ink-50"
          aria-hidden
        >
          <div className="h-10 w-10 animate-pulse rounded-full bg-ink-200/80" />
        </div>
      )}
    </div>
  );
}

export function DesignCardThumbnail({
  previewMode = 'lazy',
  ...props
}: DesignCardThumbnailProps) {
  const galleryImage = getDesignGalleryImage(props.design);
  if (galleryImage) {
    return (
      <div className={`relative h-full w-full ${props.className ?? ''}`}>
        <DesignCardImageThumb
          src={galleryImage}
          alt={props.alt}
          fill={props.fill}
        />
      </div>
    );
  }

  if (previewMode === 'lazy') {
    return <DesignCardThumbnailLazy {...props} />;
  }

  if (previewMode === 'static' && props.design.image) {
    return (
      <div className={`relative h-full w-full ${props.className ?? ''}`}>
        <DesignCardImageThumb
          src={props.design.image}
          alt={props.alt}
          fill={props.fill}
        />
      </div>
    );
  }

  return <DesignCardThumbnailLive {...props} />;
}
