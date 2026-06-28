'use client';

import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { SvgDesignTemplate, SvgTemplateState } from '@/lib/data/svg-design-templates';
import {
  prepareSvgForInlineDom,
  scopeSvgIdsForInlineDom,
} from '@/lib/designs/svg-template-engine';
import { fitDesignThumbSize } from '@/lib/designs/design-thumb';
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
  const instanceId = useId().replace(/:/g, '');
  const markup = useRenderedSvgTemplate(template, state, side);
  const height = width / template.aspectRatio;
  const inlineSvg =
    markup &&
    scopeSvgIdsForInlineDom(prepareSvgForInlineDom(markup), instanceId);

  return (
    <div
      className={className}
      style={{ width, height, maxWidth: '100%' }}
    >
      {inlineSvg ? (
        <div
          className="h-full w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: inlineSvg }}
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
}: {
  template: SvgDesignTemplate;
  state: SvgTemplateState;
  side: 'front' | 'back';
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 200, height: 120 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setSize(
        fitDesignThumbSize(
          container.clientWidth,
          container.clientHeight,
          template.aspectRatio,
        ),
      );
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [template.aspectRatio]);

  return (
    <div
      ref={containerRef}
      className={`relative flex h-full w-full items-center justify-center ${className ?? ''}`}
    >
      <SvgDesignPreview
        template={template}
        state={state}
        side={side}
        width={size.width}
        className="overflow-hidden rounded-md shadow-sm ring-1 ring-ink-200/80"
      />
    </div>
  );
}
