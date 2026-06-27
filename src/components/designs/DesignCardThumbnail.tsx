'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
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
import type { DesignTemplate } from '@/lib/data/catalog';

const THUMB_RENDER_WIDTH = 300;

function ScaledPreview({
  layout,
  values,
}: {
  layout: DesignLayout;
  values: ReturnType<typeof getDefaultFieldValues>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const padding = 16;
      const availableWidth = Math.max(container.clientWidth - padding, 1);
      const availableHeight = Math.max(container.clientHeight - padding, 1);
      const renderHeight = THUMB_RENDER_WIDTH / layout.aspectRatio;
      const nextScale = Math.min(
        availableWidth / THUMB_RENDER_WIDTH,
        availableHeight / renderHeight,
        1,
      );
      setScale(nextScale);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [layout.aspectRatio]);

  return (
    <div ref={containerRef} className="absolute inset-0 flex items-center justify-center">
      <div
        className="origin-center"
        style={{
          width: THUMB_RENDER_WIDTH,
          transform: `scale(${scale})`,
        }}
      >
        <CustomizableDesignPreview
          layout={layout}
          colors={layout.defaultColors}
          values={values}
          side="front"
          className="w-full overflow-hidden rounded-md shadow-sm ring-1 ring-ink-200/80"
        />
      </div>
    </div>
  );
}

export function DesignCardThumbnail({
  design,
  alt,
  className,
}: {
  design: DesignTemplate;
  alt: string;
  className?: string;
}) {
  if (design.kind === 'customizable' && design.svgTemplateId) {
    const svgTemplate = getSvgDesignTemplate(design.svgTemplateId);
    if (svgTemplate) {
      const state = buildDefaultSvgTemplateState(svgTemplate);
      return (
        <div className={`relative h-full w-full ${className ?? ''}`}>
          <SvgDesignPreviewScaled
            template={svgTemplate}
            state={state}
            side="front"
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
          <ScaledPreview layout={layout} values={values} />
        </div>
      );
    }
  }

  if (design.image) {
    return (
      <div className={`relative h-full w-full ${className ?? ''}`}>
        <Image
          src={design.image}
          alt={alt}
          fill
          sizes="320px"
          className="object-contain p-4 transition group-hover:scale-[1.02]"
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
