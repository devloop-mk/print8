'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { SvgDesignTemplate, SvgTemplateState } from '@/lib/data/svg-design-templates';
import { prepareSvgForInlineDom } from '@/lib/designs/svg-template-engine';
import {
  getSvgContactGroup,
  getSvgContactGroupTransformKey,
} from '@/lib/designs/svg-contact-groups';
import {
  getSvgLogoSlotFallbackTextIndices,
  getSvgLogoSlots,
  isSvgLogoFieldKey,
  logoStateKey,
} from '@/lib/designs/svg-logo-slots';
import {
  applySvgGroupTransform,
  applySvgTextNodeTransform,
  applyTransformsToSvgDom,
  clampLogoScale,
  clampSvgTextScale,
  clientPointToSvg,
  getRenderedElementBBoxInSvg,
  getRenderedTextBBoxInSvg,
  getSvgLogoTransform,
  getSvgTextTransform,
  serializeSvgTemplateStateWithoutTransforms,
  serializeSvgTemplateTransforms,
  tightTextHitBox,
  updateHitRectGeometry,
  updateResizeHandleGeometry,
  type SvgTextTransform,
} from '@/lib/designs/svg-text-transform';
import { useRenderedSvgTemplate } from '@/hooks/useSvgTemplateUrl';
import type { CanvasFieldAnchor } from '@/components/designs/SvgCanvasInlineFieldEditor';

const SVG_NS = 'http://www.w3.org/2000/svg';
const TAP_SLOP_PX = 14;
const RESIZE_SENSITIVITY = 0.0025;

type SvgInteractivePreviewProps = {
  template: SvgDesignTemplate;
  state: SvgTemplateState;
  side: 'front' | 'back';
  className?: string;
  activeFieldKey?: string | null;
  onFieldSelect?: (fieldKey: string) => void;
  onTransformChange?: (fieldKey: string, transform: SvgTextTransform) => void;
  overlayRootRef?: React.RefObject<HTMLElement | null>;
  onActiveFieldAnchor?: (anchor: CanvasFieldAnchor | null) => void;
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

function isHiddenTextNode(node: SVGGraphicsElement) {
  if (node.getAttribute('visibility') === 'hidden') return true;
  if (node.getAttribute('display') === 'none') return true;
  const style = node.getAttribute('style') ?? '';
  return style.includes('visibility:hidden') || style.includes('display:none');
}

export function SvgInteractivePreview({
  template,
  state,
  side,
  className,
  activeFieldKey,
  onFieldSelect,
  onTransformChange,
  overlayRootRef,
  onActiveFieldAnchor,
  interactive = false,
}: SvgInteractivePreviewProps) {
  const t = useTranslations('designs.customize');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const svgHostRef = useRef<HTMLDivElement>(null);
  const contentSignatureRef = useRef<string | null>(null);
  const markupSignatureRef = useRef<string | null>(null);
  const renderedSideRef = useRef<'front' | 'back' | null>(null);
  const transformsRef = useRef(state.transforms);
  transformsRef.current = state.transforms;
  const activeFieldKeyRef = useRef(activeFieldKey);
  activeFieldKeyRef.current = activeFieldKey;
  const onActiveFieldAnchorRef = useRef(onActiveFieldAnchor);
  onActiveFieldAnchorRef.current = onActiveFieldAnchor;
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

  const contentSignature = serializeSvgTemplateStateWithoutTransforms(state);
  const transformSignature = serializeSvgTemplateTransforms(state);

  const measureActiveFieldAnchor = () => {
    const fieldKey = activeFieldKeyRef.current;
    const overlayRoot = overlayRootRef?.current;
    const host = svgHostRef.current;
    if (!fieldKey || !overlayRoot || !host) {
      onActiveFieldAnchorRef.current?.(null);
      return;
    }

    const svg = host.querySelector('svg');
    const sideConfig = side === 'front' ? template.sides.front : template.sides.back;
    if (!svg || !sideConfig) {
      onActiveFieldAnchorRef.current?.(null);
      return;
    }

    if (isSvgLogoFieldKey(fieldKey)) {
      const logoSlot = getSvgLogoSlots(template.id, side).find(
        (slot) => logoStateKey(side, slot.id) === fieldKey,
      );
      const groupNode = logoSlot
        ? (svg.getElementById(logoSlot.elementId) as SVGGraphicsElement | null)
        : null;
      if (!groupNode) {
        onActiveFieldAnchorRef.current?.(null);
        return;
      }

      const nodeRect = groupNode.getBoundingClientRect();
      const rootRect = overlayRoot.getBoundingClientRect();
      if (nodeRect.width < 0.5 && nodeRect.height < 0.5) {
        onActiveFieldAnchorRef.current?.(null);
        return;
      }

      onActiveFieldAnchorRef.current?.({
        x: nodeRect.left - rootRect.left,
        y: nodeRect.top - rootRect.top,
        width: nodeRect.width,
        height: nodeRect.height,
        containerWidth: rootRect.width,
        containerHeight: rootRect.height,
      });
      return;
    }

    const fieldId = fieldKey.split(':').slice(1).join(':');
    const field = sideConfig.texts.find((item) => item.id === fieldId);
    if (!field) {
      onActiveFieldAnchorRef.current?.(null);
      return;
    }

    const textNodes = [...svg.querySelectorAll('text')] as SVGTextElement[];
    const node = textNodes[field.index];
    if (!node || isHiddenTextNode(node)) {
      onActiveFieldAnchorRef.current?.(null);
      return;
    }

    const nodeRect = node.getBoundingClientRect();
    const rootRect = overlayRoot.getBoundingClientRect();
    if (nodeRect.width < 0.5 && nodeRect.height < 0.5) {
      onActiveFieldAnchorRef.current?.(null);
      return;
    }

    onActiveFieldAnchorRef.current?.({
      x: nodeRect.left - rootRect.left,
      y: nodeRect.top - rootRect.top,
      width: nodeRect.width,
      height: nodeRect.height,
      containerWidth: rootRect.width,
      containerHeight: rootRect.height,
    });
  };

  useLayoutEffect(() => {
    const host = svgHostRef.current;
    if (!host) return;

    if (!markup) {
      if (renderedSideRef.current !== null && renderedSideRef.current !== side) {
        host.innerHTML = '';
        contentSignatureRef.current = null;
        markupSignatureRef.current = null;
        renderedSideRef.current = null;
      }
      return;
    }

    const svg = host.querySelector('svg');
    const transformOnly =
      Boolean(svg) &&
      contentSignatureRef.current !== null &&
      contentSignatureRef.current === contentSignature &&
      markupSignatureRef.current === markup &&
      renderedSideRef.current === side;

    if (transformOnly) {
      return;
    }

    host.innerHTML = prepareSvgForInlineDom(markup);
    contentSignatureRef.current = contentSignature;
    markupSignatureRef.current = markup;
    renderedSideRef.current = side;
  }, [contentSignature, markup, side, state, template]);

  useLayoutEffect(() => {
    const host = svgHostRef.current;
    const svg = host?.querySelector('svg');
    if (
      !svg ||
      contentSignatureRef.current !== contentSignature ||
      renderedSideRef.current !== side
    ) {
      return;
    }

    applyTransformsToSvgDom(svg, template, state, side);
  }, [contentSignature, side, state, template]);

  useLayoutEffect(() => {
    if (!interactive || !onActiveFieldAnchorRef.current) return;

    measureActiveFieldAnchor();

    const overlayRoot = overlayRootRef?.current;
    const host = svgHostRef.current;
    if (!overlayRoot) return;

    const update = () => measureActiveFieldAnchor();
    const observer = new ResizeObserver(update);
    observer.observe(overlayRoot);
    if (host) observer.observe(host);

    const scrollEl = scrollRef.current;
    scrollEl?.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      scrollEl?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [
    activeFieldKey,
    contentSignature,
    dimensions.height,
    dimensions.width,
    interactive,
    markup,
    overlayRootRef,
    side,
    template,
    transformSignature,
  ]);

  useLayoutEffect(() => {
    const container = svgHostRef.current;
    if (!container || !markup) return;

    let cancelled = false;
    const cleanups: (() => void)[] = [];

    async function setupHitLayer() {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      if (cancelled) return;

      const svg = container?.querySelector('svg');
      if (!svg) return;

      const sideConfig = side === 'front' ? template.sides.front : template.sides.back;
      if (!sideConfig) return;

      svg.querySelectorAll('[data-hit-field]').forEach((node) => node.remove());

      const textNodes = [...svg.querySelectorAll('text')] as SVGTextElement[];
      const logoFallbackIndices = getSvgLogoSlotFallbackTextIndices(template.id, side);
      const contactGroup = getSvgContactGroup(template.id, side);
      const contactTransformKey = getSvgContactGroupTransformKey(side);
      const contactFieldKeys = new Set(
        contactGroup?.fieldIds.map((fieldId) => `${side}:${fieldId}`) ?? [],
      );
      const isContactGroupActive = activeFieldKey === contactTransformKey;

      const hitLayer =
        svg.querySelector('[data-hit-layer]') ??
        (() => {
          const group = document.createElementNS(SVG_NS, 'g');
          group.setAttribute('data-hit-layer', 'true');
          svg.appendChild(group);
          return group;
        })();

      hitLayer.textContent = '';

      type FieldHit = {
        fieldKey: string;
        field: (typeof sideConfig.texts)[number];
        node: SVGTextElement;
        bbox: { x: number; y: number; width: number; height: number };
        area: number;
      };

      const fieldHits: FieldHit[] = [];

      for (const field of sideConfig.texts) {
        const node = textNodes[field.index];
        if (!node || logoFallbackIndices.has(field.index) || isHiddenTextNode(node)) {
          continue;
        }

        const fieldKey = `${side}:${field.id}`;
        const isContactField = contactFieldKeys.has(fieldKey);
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

        const bbox = getRenderedTextBBoxInSvg(svg, node);
        if (!bbox) continue;

        fieldHits.push({
          fieldKey,
          field,
          node,
          bbox,
          area: bbox.width * bbox.height,
        });
      }

      fieldHits.sort((a, b) => b.area - a.area);

      for (const { fieldKey, field, node, bbox } of fieldHits) {
        const isContactField = contactFieldKeys.has(fieldKey);
        const isActive = activeFieldKey === fieldKey;
        const hitBox = tightTextHitBox(bbox);
        const canTransform = Boolean(isActive && onTransformChange && !isContactField);

        const hitGroup = document.createElementNS(SVG_NS, 'g');
        const hitRect = document.createElementNS(SVG_NS, 'rect');
        hitRect.setAttribute('data-hit-field', fieldKey);
        updateHitRectGeometry(hitRect, hitBox);
        hitRect.setAttribute('rx', '4');
        hitRect.setAttribute('fill', isActive ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.04)');
        hitRect.setAttribute('stroke', isActive ? '#2563eb' : 'rgba(37, 99, 235, 0.35)');
        hitRect.setAttribute('stroke-width', isActive ? '2' : '1.5');
        hitRect.setAttribute('stroke-dasharray', isActive ? '' : '5 4');
        hitRect.style.cursor = canTransform ? 'grab' : 'pointer';
        hitRect.style.touchAction = 'none';

        let trackingPointerId: number | null = null;
        let startClientX = 0;
        let startClientY = 0;
        let dragStartSvg: { x: number; y: number } | null = null;
        let dragStartTransform: SvgTextTransform | null = null;
        let liveTransform: SvgTextTransform | null = null;
        let isDragging = false;
        let isResizing = false;
        let resizeStart: { clientX: number; clientY: number; scale: number } | null = null;
        let resizeHandle: SVGCircleElement | null = null;
        const handleSize = Math.max(14, Math.min(hitBox.width, hitBox.height) * 0.18);

        const syncOverlayToNode = (transform: SvgTextTransform) => {
          applySvgTextNodeTransform(node, transform);
          const nextBBox = getRenderedTextBBoxInSvg(svg, node);
          if (!nextBBox) return;
          const nextHitBox = tightTextHitBox(nextBBox);
          updateHitRectGeometry(hitRect, nextHitBox);
          if (resizeHandle) {
            updateResizeHandleGeometry(resizeHandle, nextHitBox, handleSize);
          }
          measureActiveFieldAnchor();
        };

        const commitTransform = () => {
          if (!liveTransform || !onTransformChange) return;
          const finalTransform = liveTransform;
          liveTransform = null;
          requestAnimationFrame(() => {
            onTransformChange(fieldKey, finalTransform);
          });
        };

        const handlePointerDown = (event: PointerEvent) => {
          if (event.pointerType === 'mouse' && event.button !== 0) return;
          trackingPointerId = event.pointerId;
          startClientX = event.clientX;
          startClientY = event.clientY;
          isDragging = false;
          isResizing = false;
          liveTransform = getSvgTextTransform(transformsRef.current, fieldKey);

          if (canTransform) {
            dragStartSvg = clientPointToSvg(svg, event.clientX, event.clientY);
            dragStartTransform = { ...liveTransform };
          }

          (event.currentTarget as Element).setPointerCapture(event.pointerId);
        };

        const handlePointerMove = (event: PointerEvent) => {
          if (trackingPointerId !== event.pointerId) return;

          if (isResizing && resizeStart && dragStartTransform) {
            event.preventDefault();
            const delta =
              event.clientX - resizeStart.clientX + (event.clientY - resizeStart.clientY);
            liveTransform = {
              ...dragStartTransform,
              scale: clampSvgTextScale(resizeStart.scale + delta * RESIZE_SENSITIVITY),
            };
            syncOverlayToNode(liveTransform);
            return;
          }

          if (!canTransform || !dragStartSvg || !dragStartTransform) {
            return;
          }

          const dxClient = event.clientX - startClientX;
          const dyClient = event.clientY - startClientY;
          if (!isDragging && dxClient * dxClient + dyClient * dyClient <= TAP_SLOP_PX * TAP_SLOP_PX) {
            return;
          }

          isDragging = true;
          event.preventDefault();
          hitRect.style.cursor = 'grabbing';

          const currentSvg = clientPointToSvg(svg, event.clientX, event.clientY);
          liveTransform = {
            ...dragStartTransform,
            dx: dragStartTransform.dx + (currentSvg.x - dragStartSvg.x),
            dy: dragStartTransform.dy + (currentSvg.y - dragStartSvg.y),
          };
          syncOverlayToNode(liveTransform);
        };

        const handlePointerUp = (event: PointerEvent) => {
          if (trackingPointerId !== event.pointerId) return;
          trackingPointerId = null;

          if (isDragging || isResizing) {
            isDragging = false;
            isResizing = false;
            resizeStart = null;
            dragStartSvg = null;
            dragStartTransform = null;
            hitRect.style.cursor = canTransform ? 'grab' : 'pointer';
            commitTransform();
            return;
          }

          isResizing = false;
          resizeStart = null;
          dragStartSvg = null;
          dragStartTransform = null;
          liveTransform = null;
          hitRect.style.cursor = canTransform ? 'grab' : 'pointer';

          event.preventDefault();
          event.stopPropagation();

          const candidates = document
            .elementsFromPoint(event.clientX, event.clientY)
            .map((element) => {
              const target = element as Element;
              const hitField = target.getAttribute('data-hit-field');
              const hitArea = target.getAttribute('data-hit-area');
              if (!hitField || !hitArea) return null;
              return { fieldKey: hitField, area: Number(hitArea) };
            })
            .filter((value): value is { fieldKey: string; area: number } => value !== null);

          if (candidates.length > 0) {
            const best = candidates.reduce((smallest, current) =>
              current.area < smallest.area ? current : smallest,
            );
            onFieldSelect?.(best.fieldKey);
            return;
          }

          onFieldSelect?.(fieldKey);
        };

        const handlePointerCancel = (event: PointerEvent) => {
          if (trackingPointerId !== event.pointerId) return;
          trackingPointerId = null;
          isDragging = false;
          isResizing = false;
          resizeStart = null;
          dragStartSvg = null;
          dragStartTransform = null;
          liveTransform = null;
          hitRect.style.cursor = canTransform ? 'grab' : 'pointer';
          applySvgTextNodeTransform(node, getSvgTextTransform(transformsRef.current, fieldKey));
        };

        hitRect.addEventListener('pointerdown', handlePointerDown);
        hitRect.addEventListener('pointermove', handlePointerMove);
        hitRect.addEventListener('pointerup', handlePointerUp);
        hitRect.addEventListener('pointercancel', handlePointerCancel);
        hitRect.setAttribute('role', 'button');
        hitRect.setAttribute('aria-label', t('editField', { n: field.index + 1 }));

        hitGroup.appendChild(hitRect);

        if (canTransform) {
          resizeHandle = document.createElementNS(SVG_NS, 'circle');
          resizeHandle.setAttribute('data-resize-handle', 'true');
          updateResizeHandleGeometry(resizeHandle, hitBox, handleSize);
          resizeHandle.setAttribute('fill', '#2563eb');
          resizeHandle.setAttribute('stroke', '#ffffff');
          resizeHandle.setAttribute('stroke-width', '2');
          resizeHandle.style.cursor = 'nwse-resize';
          resizeHandle.style.touchAction = 'none';
          resizeHandle.setAttribute('role', 'button');
          resizeHandle.setAttribute('aria-label', t('resizeField'));

          const handleResizeDown = (event: PointerEvent) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            trackingPointerId = event.pointerId;
            isResizing = true;
            isDragging = false;
            liveTransform = getSvgTextTransform(transformsRef.current, fieldKey);
            dragStartTransform = { ...liveTransform };
            resizeStart = {
              clientX: event.clientX,
              clientY: event.clientY,
              scale: liveTransform.scale,
            };
            resizeHandle!.setPointerCapture(event.pointerId);
          };

          resizeHandle.addEventListener('pointerdown', handleResizeDown);
          resizeHandle.addEventListener('pointermove', handlePointerMove);
          resizeHandle.addEventListener('pointerup', handlePointerUp);
          resizeHandle.addEventListener('pointercancel', handlePointerCancel);
          hitGroup.appendChild(resizeHandle);

          cleanups.push(() => {
            resizeHandle?.removeEventListener('pointerdown', handleResizeDown);
            resizeHandle?.removeEventListener('pointermove', handlePointerMove);
            resizeHandle?.removeEventListener('pointerup', handlePointerUp);
            resizeHandle?.removeEventListener('pointercancel', handlePointerCancel);
          });
        }

        hitLayer.appendChild(hitGroup);

        cleanups.push(() => {
          hitRect.removeEventListener('pointerdown', handlePointerDown);
          hitRect.removeEventListener('pointermove', handlePointerMove);
          hitRect.removeEventListener('pointerup', handlePointerUp);
          hitRect.removeEventListener('pointercancel', handlePointerCancel);
          hitGroup.remove();
        });
      }

      if (
        contactGroup &&
        interactive &&
        onFieldSelect &&
        onTransformChange
      ) {
        const groupNode = svg.getElementById(
          contactGroup.groupElementId,
        ) as SVGGraphicsElement | null;

        if (groupNode) {
          const groupBBox = getRenderedElementBBoxInSvg(svg, groupNode);
          if (groupBBox) {
            const hitBox = tightTextHitBox(groupBBox, 10);
            const canTransformGroup = isContactGroupActive;

            const hitGroup = document.createElementNS(SVG_NS, 'g');
            const hitRect = document.createElementNS(SVG_NS, 'rect');
            hitRect.setAttribute('data-hit-field', contactTransformKey);
            updateHitRectGeometry(hitRect, hitBox);
            hitRect.setAttribute('rx', '6');
            hitRect.setAttribute(
              'fill',
              canTransformGroup
                ? 'rgba(37, 99, 235, 0.1)'
                : 'rgba(37, 99, 235, 0.04)',
            );
            hitRect.setAttribute(
              'stroke',
              canTransformGroup ? '#2563eb' : 'rgba(37, 99, 235, 0.35)',
            );
            hitRect.setAttribute('stroke-width', canTransformGroup ? '2' : '1.5');
            hitRect.setAttribute('stroke-dasharray', canTransformGroup ? '' : '5 4');
            hitRect.style.cursor = canTransformGroup ? 'grab' : 'pointer';
            hitRect.style.touchAction = 'none';

            let trackingPointerId: number | null = null;
            let startClientX = 0;
            let startClientY = 0;
            let dragStartSvg: { x: number; y: number } | null = null;
            let dragStartTransform: SvgTextTransform | null = null;
            let liveTransform: SvgTextTransform | null = null;
            let isDragging = false;
            let isResizing = false;
            let resizeStart: { clientX: number; clientY: number; scale: number } | null =
              null;
            let resizeHandle: SVGCircleElement | null = null;
            const handleSize = Math.max(14, Math.min(hitBox.width, hitBox.height) * 0.12);

            const syncGroupOverlay = (transform: SvgTextTransform) => {
              applySvgGroupTransform(groupNode, transform);
              const nextBBox = getRenderedElementBBoxInSvg(svg, groupNode);
              if (!nextBBox) return;
              const nextHitBox = tightTextHitBox(nextBBox, 10);
              updateHitRectGeometry(hitRect, nextHitBox);
              if (resizeHandle) {
                updateResizeHandleGeometry(resizeHandle, nextHitBox, handleSize);
              }
              measureActiveFieldAnchor();
            };

            const commitGroupTransform = () => {
              if (!liveTransform) return;
              const finalTransform = liveTransform;
              liveTransform = null;
              requestAnimationFrame(() => {
                onTransformChange(contactTransformKey, finalTransform);
              });
            };

            const handlePointerDown = (event: PointerEvent) => {
              if (event.pointerType === 'mouse' && event.button !== 0) return;
              trackingPointerId = event.pointerId;
              startClientX = event.clientX;
              startClientY = event.clientY;
              isDragging = false;
              isResizing = false;
              liveTransform = getSvgTextTransform(
                transformsRef.current,
                contactTransformKey,
              );

              if (canTransformGroup) {
                dragStartSvg = clientPointToSvg(svg, event.clientX, event.clientY);
                dragStartTransform = { ...liveTransform };
              }

              (event.currentTarget as Element).setPointerCapture(event.pointerId);
            };

            const handlePointerMove = (event: PointerEvent) => {
              if (trackingPointerId !== event.pointerId) return;

              if (isResizing && resizeStart && dragStartTransform) {
                event.preventDefault();
                const delta =
                  event.clientX - resizeStart.clientX + (event.clientY - resizeStart.clientY);
                liveTransform = {
                  ...dragStartTransform,
                  scale: clampSvgTextScale(resizeStart.scale + delta * RESIZE_SENSITIVITY),
                };
                syncGroupOverlay(liveTransform);
                return;
              }

              if (!canTransformGroup || !dragStartSvg || !dragStartTransform) {
                return;
              }

              const dxClient = event.clientX - startClientX;
              const dyClient = event.clientY - startClientY;
              if (
                !isDragging &&
                dxClient * dxClient + dyClient * dyClient <= TAP_SLOP_PX * TAP_SLOP_PX
              ) {
                return;
              }

              isDragging = true;
              event.preventDefault();
              hitRect.style.cursor = 'grabbing';

              const currentSvg = clientPointToSvg(svg, event.clientX, event.clientY);
              liveTransform = {
                ...dragStartTransform,
                dx: dragStartTransform.dx + (currentSvg.x - dragStartSvg.x),
                dy: dragStartTransform.dy + (currentSvg.y - dragStartSvg.y),
              };
              syncGroupOverlay(liveTransform);
            };

            const handlePointerUp = (event: PointerEvent) => {
              if (trackingPointerId !== event.pointerId) return;
              trackingPointerId = null;

              if (isDragging || isResizing) {
                isDragging = false;
                isResizing = false;
                resizeStart = null;
                dragStartSvg = null;
                dragStartTransform = null;
                hitRect.style.cursor = canTransformGroup ? 'grab' : 'pointer';
                commitGroupTransform();
                return;
              }

              isResizing = false;
              resizeStart = null;
              dragStartSvg = null;
              dragStartTransform = null;
              liveTransform = null;
              hitRect.style.cursor = canTransformGroup ? 'grab' : 'pointer';

              event.preventDefault();
              event.stopPropagation();
              onFieldSelect(contactTransformKey);
            };

            const handlePointerCancel = (event: PointerEvent) => {
              if (trackingPointerId !== event.pointerId) return;
              trackingPointerId = null;
              isDragging = false;
              isResizing = false;
              resizeStart = null;
              dragStartSvg = null;
              dragStartTransform = null;
              liveTransform = null;
              hitRect.style.cursor = canTransformGroup ? 'grab' : 'pointer';
              applySvgGroupTransform(
                groupNode,
                getSvgTextTransform(transformsRef.current, contactTransformKey),
              );
            };

            hitRect.addEventListener('pointerdown', handlePointerDown);
            hitRect.addEventListener('pointermove', handlePointerMove);
            hitRect.addEventListener('pointerup', handlePointerUp);
            hitRect.addEventListener('pointercancel', handlePointerCancel);
            hitRect.setAttribute('role', 'button');
            hitRect.setAttribute('aria-label', t('editContactBlock'));

            hitGroup.appendChild(hitRect);

            if (canTransformGroup) {
              resizeHandle = document.createElementNS(SVG_NS, 'circle');
              resizeHandle.setAttribute('data-resize-handle', 'true');
              updateResizeHandleGeometry(resizeHandle, hitBox, handleSize);
              resizeHandle.setAttribute('fill', '#2563eb');
              resizeHandle.setAttribute('stroke', '#ffffff');
              resizeHandle.setAttribute('stroke-width', '2');
              resizeHandle.style.cursor = 'nwse-resize';
              resizeHandle.style.touchAction = 'none';
              resizeHandle.setAttribute('role', 'button');
              resizeHandle.setAttribute('aria-label', t('resizeField'));

              const handleResizeDown = (event: PointerEvent) => {
                if (event.pointerType === 'mouse' && event.button !== 0) return;
                event.preventDefault();
                event.stopPropagation();
                trackingPointerId = event.pointerId;
                isResizing = true;
                isDragging = false;
                liveTransform = getSvgTextTransform(
                  transformsRef.current,
                  contactTransformKey,
                );
                dragStartTransform = { ...liveTransform };
                resizeStart = {
                  clientX: event.clientX,
                  clientY: event.clientY,
                  scale: liveTransform.scale,
                };
                resizeHandle!.setPointerCapture(event.pointerId);
              };

              resizeHandle.addEventListener('pointerdown', handleResizeDown);
              resizeHandle.addEventListener('pointermove', handlePointerMove);
              resizeHandle.addEventListener('pointerup', handlePointerUp);
              resizeHandle.addEventListener('pointercancel', handlePointerCancel);
              hitGroup.appendChild(resizeHandle);

              cleanups.push(() => {
                resizeHandle?.removeEventListener('pointerdown', handleResizeDown);
                resizeHandle?.removeEventListener('pointermove', handlePointerMove);
                resizeHandle?.removeEventListener('pointerup', handlePointerUp);
                resizeHandle?.removeEventListener('pointercancel', handlePointerCancel);
              });
            }

            hitLayer.insertBefore(hitGroup, hitLayer.firstChild);

            cleanups.push(() => {
              hitRect.removeEventListener('pointerdown', handlePointerDown);
              hitRect.removeEventListener('pointermove', handlePointerMove);
              hitRect.removeEventListener('pointerup', handlePointerUp);
              hitRect.removeEventListener('pointercancel', handlePointerCancel);
              hitGroup.remove();
            });
          }
        }
      }

      for (const slot of getSvgLogoSlots(template.id, side)) {
        if (!interactive || !onFieldSelect || !onTransformChange) continue;

        const fieldKey = logoStateKey(side, slot.id);
        const groupNode = svg.getElementById(
          slot.elementId,
        ) as SVGGraphicsElement | null;
        if (!groupNode) continue;

        const groupBBox = getRenderedElementBBoxInSvg(svg, groupNode);
        if (!groupBBox) continue;

        const isActive = activeFieldKey === fieldKey;
        const hitBox = tightTextHitBox(groupBBox, 10);
        const canTransform = Boolean(isActive && onTransformChange);

        const hitGroup = document.createElementNS(SVG_NS, 'g');
        const hitRect = document.createElementNS(SVG_NS, 'rect');
        hitRect.setAttribute('data-hit-field', fieldKey);
        updateHitRectGeometry(hitRect, hitBox);
        hitRect.setAttribute('rx', '6');
        hitRect.setAttribute(
          'fill',
          isActive ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.04)',
        );
        hitRect.setAttribute(
          'stroke',
          isActive ? '#2563eb' : 'rgba(37, 99, 235, 0.35)',
        );
        hitRect.setAttribute('stroke-width', isActive ? '2' : '1.5');
        hitRect.setAttribute('stroke-dasharray', isActive ? '' : '5 4');
        hitRect.style.cursor = canTransform ? 'grab' : 'pointer';
        hitRect.style.touchAction = 'none';

        let trackingPointerId: number | null = null;
        let startClientX = 0;
        let startClientY = 0;
        let dragStartSvg: { x: number; y: number } | null = null;
        let dragStartTransform: SvgTextTransform | null = null;
        let liveTransform: SvgTextTransform | null = null;
        let isDragging = false;
        let isResizing = false;
        let resizeStart: { clientX: number; clientY: number; scale: number } | null =
          null;
        let resizeHandle: SVGCircleElement | null = null;
        const handleSize = Math.max(14, Math.min(hitBox.width, hitBox.height) * 0.18);

        const syncLogoOverlay = (transform: SvgTextTransform) => {
          applySvgGroupTransform(groupNode, transform, clampLogoScale);
          const nextBBox = getRenderedElementBBoxInSvg(svg, groupNode);
          if (!nextBBox) return;
          const nextHitBox = tightTextHitBox(nextBBox, 10);
          updateHitRectGeometry(hitRect, nextHitBox);
          if (resizeHandle) {
            updateResizeHandleGeometry(resizeHandle, nextHitBox, handleSize);
          }
          measureActiveFieldAnchor();
        };

        const commitLogoTransform = () => {
          if (!liveTransform) return;
          const finalTransform = liveTransform;
          liveTransform = null;
          requestAnimationFrame(() => {
            onTransformChange(fieldKey, finalTransform);
          });
        };

        const handlePointerDown = (event: PointerEvent) => {
          if (event.pointerType === 'mouse' && event.button !== 0) return;
          trackingPointerId = event.pointerId;
          startClientX = event.clientX;
          startClientY = event.clientY;
          isDragging = false;
          isResizing = false;
          liveTransform = getSvgLogoTransform(transformsRef.current, fieldKey);

          if (canTransform) {
            dragStartSvg = clientPointToSvg(svg, event.clientX, event.clientY);
            dragStartTransform = { ...liveTransform };
          }

          (event.currentTarget as Element).setPointerCapture(event.pointerId);
        };

        const handlePointerMove = (event: PointerEvent) => {
          if (trackingPointerId !== event.pointerId) return;

          if (isResizing && resizeStart && dragStartTransform) {
            event.preventDefault();
            const delta =
              event.clientX - resizeStart.clientX + (event.clientY - resizeStart.clientY);
            liveTransform = {
              ...dragStartTransform,
              scale: clampLogoScale(resizeStart.scale + delta * RESIZE_SENSITIVITY),
            };
            syncLogoOverlay(liveTransform);
            return;
          }

          if (!canTransform || !dragStartSvg || !dragStartTransform) return;

          const dxClient = event.clientX - startClientX;
          const dyClient = event.clientY - startClientY;
          if (
            !isDragging &&
            dxClient * dxClient + dyClient * dyClient <= TAP_SLOP_PX * TAP_SLOP_PX
          ) {
            return;
          }

          isDragging = true;
          event.preventDefault();
          hitRect.style.cursor = 'grabbing';

          const currentSvg = clientPointToSvg(svg, event.clientX, event.clientY);
          liveTransform = {
            ...dragStartTransform,
            dx: dragStartTransform.dx + (currentSvg.x - dragStartSvg.x),
            dy: dragStartTransform.dy + (currentSvg.y - dragStartSvg.y),
          };
          syncLogoOverlay(liveTransform);
        };

        const handlePointerUp = (event: PointerEvent) => {
          if (trackingPointerId !== event.pointerId) return;
          trackingPointerId = null;

          if (isDragging || isResizing) {
            isDragging = false;
            isResizing = false;
            resizeStart = null;
            dragStartSvg = null;
            dragStartTransform = null;
            hitRect.style.cursor = canTransform ? 'grab' : 'pointer';
            commitLogoTransform();
            return;
          }

          isResizing = false;
          resizeStart = null;
          dragStartSvg = null;
          dragStartTransform = null;
          liveTransform = null;
          hitRect.style.cursor = canTransform ? 'grab' : 'pointer';

          event.preventDefault();
          event.stopPropagation();
          onFieldSelect(fieldKey);
        };

        const handlePointerCancel = (event: PointerEvent) => {
          if (trackingPointerId !== event.pointerId) return;
          trackingPointerId = null;
          isDragging = false;
          isResizing = false;
          resizeStart = null;
          dragStartSvg = null;
          dragStartTransform = null;
          liveTransform = null;
          hitRect.style.cursor = canTransform ? 'grab' : 'pointer';
          applySvgGroupTransform(
            groupNode,
            getSvgLogoTransform(transformsRef.current, fieldKey),
            clampLogoScale,
          );
        };

        hitRect.addEventListener('pointerdown', handlePointerDown);
        hitRect.addEventListener('pointermove', handlePointerMove);
        hitRect.addEventListener('pointerup', handlePointerUp);
        hitRect.addEventListener('pointercancel', handlePointerCancel);
        hitRect.setAttribute('role', 'button');
        hitRect.setAttribute('aria-label', t('editLogo'));

        hitGroup.appendChild(hitRect);

        if (canTransform) {
          resizeHandle = document.createElementNS(SVG_NS, 'circle');
          resizeHandle.setAttribute('data-resize-handle', 'true');
          updateResizeHandleGeometry(resizeHandle, hitBox, handleSize);
          resizeHandle.setAttribute('fill', '#2563eb');
          resizeHandle.setAttribute('stroke', '#ffffff');
          resizeHandle.setAttribute('stroke-width', '2');
          resizeHandle.style.cursor = 'nwse-resize';
          resizeHandle.style.touchAction = 'none';
          resizeHandle.setAttribute('role', 'button');
          resizeHandle.setAttribute('aria-label', t('resizeLogo'));

          const handleResizeDown = (event: PointerEvent) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            trackingPointerId = event.pointerId;
            isResizing = true;
            isDragging = false;
            liveTransform = getSvgLogoTransform(transformsRef.current, fieldKey);
            dragStartTransform = { ...liveTransform };
            resizeStart = {
              clientX: event.clientX,
              clientY: event.clientY,
              scale: liveTransform.scale,
            };
            resizeHandle!.setPointerCapture(event.pointerId);
          };

          resizeHandle.addEventListener('pointerdown', handleResizeDown);
          resizeHandle.addEventListener('pointermove', handlePointerMove);
          resizeHandle.addEventListener('pointerup', handlePointerUp);
          resizeHandle.addEventListener('pointercancel', handlePointerCancel);
          hitGroup.appendChild(resizeHandle);

          cleanups.push(() => {
            resizeHandle?.removeEventListener('pointerdown', handleResizeDown);
            resizeHandle?.removeEventListener('pointermove', handlePointerMove);
            resizeHandle?.removeEventListener('pointerup', handlePointerUp);
            resizeHandle?.removeEventListener('pointercancel', handlePointerCancel);
          });
        }

        hitLayer.appendChild(hitGroup);

        cleanups.push(() => {
          hitRect.removeEventListener('pointerdown', handlePointerDown);
          hitRect.removeEventListener('pointermove', handlePointerMove);
          hitRect.removeEventListener('pointerup', handlePointerUp);
          hitRect.removeEventListener('pointercancel', handlePointerCancel);
          hitGroup.remove();
        });
      }
    }

    void setupHitLayer();

    return () => {
      cancelled = true;
      for (const cleanup of cleanups) cleanup();
      const svg = container?.querySelector('svg');
      svg?.querySelector('[data-hit-layer]')?.replaceChildren();
    };
  }, [
    activeFieldKey,
    contentSignature,
    interactive,
    onFieldSelect,
    onTransformChange,
    side,
    t,
    template,
    transformSignature,
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
              ref={svgHostRef}
              className={cn(
                'h-full w-full overflow-hidden rounded-sm [&>svg]:block [&>svg]:h-full [&>svg]:w-full',
                interactive && '[&_text]:pointer-events-none',
              )}
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
