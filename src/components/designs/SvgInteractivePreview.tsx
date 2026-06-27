'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { SvgDesignTemplate, SvgTemplateState } from '@/lib/data/svg-design-templates';
import { prepareSvgForInlineDom } from '@/lib/designs/svg-template-engine';
import { useRenderedSvgTemplate } from '@/hooks/useSvgTemplateUrl';

type SvgInteractivePreviewProps = {
  template: SvgDesignTemplate;
  state: SvgTemplateState;
  side: 'front' | 'back';
  className?: string;
  activeFieldKey?: string | null;
  onFieldSelect?: (fieldKey: string) => void;
  interactive?: boolean;
};

function computePreviewDimensions(
  aspectRatio: number,
  containerWidth: number,
  viewportHeight: number,
) {
  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;

  if (!isDesktop) {
    const height = Math.min(viewportHeight * 0.45, 420);
    return { width: height * aspectRatio, height };
  }

  const maxHeight = Math.min(viewportHeight * 0.78, 760);
  const maxWidth = Math.max(containerWidth, 280);

  let height = maxHeight;
  let width = height * aspectRatio;

  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return { width, height };
}

export function SvgInteractivePreview({
  template,
  state,
  side,
  className,
  activeFieldKey,
  onFieldSelect,
  interactive = false,
}: SvgInteractivePreviewProps) {
  const t = useTranslations('designs.customize');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const markup = useRenderedSvgTemplate(template, state, side);
  const [dimensions, setDimensions] = useState({ width: 280, height: 400 });
  const [canScrollHorizontally, setCanScrollHorizontally] = useState(false);

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const updateDimensions = () => {
      setDimensions(
        computePreviewDimensions(
          template.aspectRatio,
          scrollEl.clientWidth,
          window.innerHeight,
        ),
      );
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(scrollEl);
    window.addEventListener('resize', updateDimensions);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [template.aspectRatio]);

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const updateScrollState = () => {
      setCanScrollHorizontally(scrollEl.scrollWidth > scrollEl.clientWidth + 2);
    };

    updateScrollState();
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(scrollEl);
    return () => observer.disconnect();
  }, [dimensions.width, dimensions.height, markup]);

  useLayoutEffect(() => {
    const container = fitRef.current;
    if (!container || !markup) return;

    const svg = container.querySelector('svg');
    if (!svg) return;

    const textNodes = [...svg.querySelectorAll('text')];
    const sideConfig = side === 'front' ? template.sides.front : template.sides.back;
    if (!sideConfig) return;

    const cleanups: (() => void)[] = [];

    for (const field of sideConfig.texts) {
      const node = textNodes[field.index];
      if (!node) continue;

      const fieldKey = `${side}:${field.id}`;
      const isActive = activeFieldKey === fieldKey;

      node.style.cursor = interactive && onFieldSelect ? 'pointer' : '';
      node.style.pointerEvents = interactive && onFieldSelect ? 'auto' : '';
      if (isActive) {
        node.setAttribute('stroke', '#2563eb');
        node.setAttribute('stroke-width', '2');
        node.setAttribute('paint-order', 'stroke fill');
      } else {
        node.removeAttribute('stroke');
        node.removeAttribute('stroke-width');
        node.removeAttribute('paint-order');
      }

      if (!interactive || !onFieldSelect) continue;

      const handler = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        onFieldSelect(fieldKey);
      };

      node.addEventListener('click', handler);
      node.setAttribute('role', 'button');
      cleanups.push(() => {
        node.removeEventListener('click', handler);
        node.removeAttribute('role');
      });
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, [activeFieldKey, interactive, markup, onFieldSelect, side, template]);

  return (
    <div className={cn('w-full min-w-0 max-w-full', className)}>
      <div
        ref={scrollRef}
        className={cn(
          'w-full min-w-0 max-w-full overflow-y-hidden',
          canScrollHorizontally
            ? 'overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5'
            : 'overflow-x-hidden',
          interactive && 'touch-manipulation',
        )}
      >
        <div
          ref={fitRef}
          className="mx-auto shrink-0"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
          }}
        >
          {markup ? (
            <div
              className="h-full w-full overflow-hidden rounded-sm [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: prepareSvgForInlineDom(markup) }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-lg bg-ink-100 text-sm text-ink-500">
              …
            </div>
          )}
        </div>
      </div>
      {canScrollHorizontally ? (
        <p className="mt-2 text-center text-[11px] text-ink-400 md:text-xs">{t('scrollPreview')}</p>
      ) : null}
    </div>
  );
}
