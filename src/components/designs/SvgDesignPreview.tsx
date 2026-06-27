'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { SvgDesignTemplate, SvgTemplateState } from '@/lib/data/svg-design-templates';
import { prepareSvgForInlineDom } from '@/lib/designs/svg-template-engine';
import { useRenderedSvgTemplate } from '@/hooks/useSvgTemplateUrl';

type SvgDesignPreviewProps = {
  template: SvgDesignTemplate;
  state: SvgTemplateState;
  side: 'front' | 'back';
  className?: string;
  width?: number;
};

export function SvgDesignPreview({
  template,
  state,
  side,
  className,
  width = 480,
}: SvgDesignPreviewProps) {
  const markup = useRenderedSvgTemplate(template, state, side);
  const height = width / template.aspectRatio;

  return (
    <div
      className={className}
      style={{ width, height, maxWidth: '100%' }}
    >
      {markup ? (
        <div
          className="h-full w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
          // SVG is generated locally from our template files, not user HTML.
          dangerouslySetInnerHTML={{ __html: prepareSvgForInlineDom(markup) }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-lg bg-ink-100 text-sm text-ink-500">
          …
        </div>
      )}
    </div>
  );
}

export function SvgDesignPreviewScaled({
  template,
  state,
  side,
  className,
  renderWidth = 300,
}: {
  template: SvgDesignTemplate;
  state: SvgTemplateState;
  side: 'front' | 'back';
  className?: string;
  renderWidth?: number;
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
      const renderHeight = renderWidth / template.aspectRatio;
      const nextScale = Math.min(
        availableWidth / renderWidth,
        availableHeight / renderHeight,
        1,
      );
      setScale(nextScale);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [template.aspectRatio, renderWidth]);

  return (
    <div ref={containerRef} className={`relative h-full w-full ${className ?? ''}`}>
      <div
        className="absolute left-1/2 top-1/2 origin-center -translate-x-1/2 -translate-y-1/2"
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <SvgDesignPreview
          template={template}
          state={state}
          side={side}
          width={renderWidth}
          className="overflow-hidden rounded-md shadow-sm ring-1 ring-ink-200/80"
        />
      </div>
    </div>
  );
}
