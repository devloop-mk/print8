'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { SvgDesignTemplate, SvgTemplateState } from '@/lib/data/svg-design-templates';
import { prepareSvgForInlineDom } from '@/lib/designs/svg-template-engine';
import { useRenderedSvgTemplate } from '@/hooks/useSvgTemplateUrl';

const SVG_NS = 'http://www.w3.org/2000/svg';
const TAP_SLOP_PX = 14;
const MIN_TOUCH_TARGET_PX = 44;

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
  const isDesktop =
    typeof window !== 'undefined' &&
    window.matchMedia('(min-width: 1024px)').matches;

  const maxHeight = isDesktop
    ? Math.min(viewportHeight * 0.78, 760)
    : Math.min(viewportHeight * 0.36, 340);
  const maxWidth = Math.max(containerWidth, isDesktop ? 280 : 1);

  let width = maxWidth;
  let height = width / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  return { width, height };
}

function expandBBox(
  bbox: DOMRect,
  minWidth: number,
  minHeight: number,
  padding: number,
) {
  const width = Math.max(bbox.width + padding * 2, minWidth);
  const height = Math.max(bbox.height + padding * 2, minHeight);
  const x = bbox.x + bbox.width / 2 - width / 2;
  const y = bbox.y + bbox.height / 2 - height / 2;
  return { x, y, width, height };
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

    const sideConfig = side === 'front' ? template.sides.front : template.sides.back;
    if (!sideConfig) return;

    svg.querySelectorAll('[data-hit-field]').forEach((node) => node.remove());

    const textNodes = [...svg.querySelectorAll('text')];
    const cleanups: (() => void)[] = [];
    const hitLayer =
      svg.querySelector('[data-hit-layer]') ??
      (() => {
        const group = document.createElementNS(SVG_NS, 'g');
        group.setAttribute('data-hit-layer', 'true');
        svg.appendChild(group);
        return group;
      })();

    hitLayer.textContent = '';

    for (const field of sideConfig.texts) {
      const node = textNodes[field.index];
      if (!node) continue;

      const fieldKey = `${side}:${field.id}`;
      const isActive = activeFieldKey === fieldKey;

      if (isActive) {
        node.setAttribute('stroke', '#2563eb');
        node.setAttribute('stroke-width', '1.5');
        node.setAttribute('paint-order', 'stroke fill');
      } else {
        node.removeAttribute('stroke');
        node.removeAttribute('stroke-width');
        node.removeAttribute('paint-order');
      }

      if (!interactive || !onFieldSelect) continue;

      let bbox: DOMRect;
      try {
        bbox = node.getBBox();
      } catch {
        continue;
      }

      const pad = Math.max(6, bbox.height * 0.35);
      const expanded = expandBBox(bbox, MIN_TOUCH_TARGET_PX, MIN_TOUCH_TARGET_PX, pad);

      const hitRect = document.createElementNS(SVG_NS, 'rect');
      hitRect.setAttribute('data-hit-field', fieldKey);
      hitRect.setAttribute('x', String(expanded.x));
      hitRect.setAttribute('y', String(expanded.y));
      hitRect.setAttribute('width', String(expanded.width));
      hitRect.setAttribute('height', String(expanded.height));
      hitRect.setAttribute('rx', '6');
      hitRect.setAttribute('fill', isActive ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.04)');
      hitRect.setAttribute('stroke', isActive ? '#2563eb' : 'rgba(37, 99, 235, 0.35)');
      hitRect.setAttribute('stroke-width', isActive ? '2' : '1.5');
      hitRect.setAttribute('stroke-dasharray', isActive ? '' : '5 4');
      hitRect.style.cursor = 'pointer';
      hitRect.style.touchAction = 'manipulation';

      let trackingPointerId: number | null = null;
      let startX = 0;
      let startY = 0;

      const handlePointerDown = (event: PointerEvent) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        trackingPointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;
        hitRect.setPointerCapture(event.pointerId);
      };

      const handlePointerUp = (event: PointerEvent) => {
        if (trackingPointerId !== event.pointerId) return;
        trackingPointerId = null;

        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        if (dx * dx + dy * dy > TAP_SLOP_PX * TAP_SLOP_PX) return;

        event.preventDefault();
        event.stopPropagation();
        onFieldSelect(fieldKey);
      };

      const handlePointerCancel = (event: PointerEvent) => {
        if (trackingPointerId === event.pointerId) {
          trackingPointerId = null;
        }
      };

      hitRect.addEventListener('pointerdown', handlePointerDown);
      hitRect.addEventListener('pointerup', handlePointerUp);
      hitRect.addEventListener('pointercancel', handlePointerCancel);
      hitRect.setAttribute('role', 'button');
      hitRect.setAttribute('aria-label', t('editField', { n: field.index + 1 }));

      hitLayer.appendChild(hitRect);

      cleanups.push(() => {
        hitRect.removeEventListener('pointerdown', handlePointerDown);
        hitRect.removeEventListener('pointerup', handlePointerUp);
        hitRect.removeEventListener('pointercancel', handlePointerCancel);
        hitRect.remove();
      });
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
      hitLayer.textContent = '';
    };
  }, [
    activeFieldKey,
    interactive,
    markup,
    onFieldSelect,
    side,
    state.texts,
    t,
    template,
  ]);

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
          className="mx-auto w-full max-w-full shrink-0 select-none"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            maxWidth: '100%',
          }}
        >
          {markup ? (
            <div
              className={cn(
                'h-full w-full overflow-hidden rounded-sm [&>svg]:block [&>svg]:h-full [&>svg]:w-full',
                interactive && '[&_text]:pointer-events-none',
              )}
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
