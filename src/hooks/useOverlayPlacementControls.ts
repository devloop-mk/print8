'use client';

import { useRef, type RefObject } from 'react';
import { clampElementCenterToPrintArea, type PrintAreaInsets } from '@/lib/products/print-area';

export function useDraggableOverlayPosition(
  position: { x: number; y: number },
  onChange: (pos: { x: number; y: number }) => void,
  printBounds?: PrintAreaInsets,
  measureRef?: RefObject<HTMLElement | null>,
) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const positionRef = useRef(position);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);

  positionRef.current = position;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    draggingRef.current = true;
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !dragStartRef.current) return;
    event.preventDefault();
    const deltaX = event.clientX - dragStartRef.current.x;
    const deltaY = event.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: event.clientX, y: event.clientY };

    const parent = elementRef.current?.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const currentX = (positionRef.current.x / 100) * parentRect.width;
    const currentY = (positionRef.current.y / 100) * parentRect.height;
    const nextX = Math.min(Math.max(currentX + deltaX, 0), parentRect.width);
    const nextY = Math.min(Math.max(currentY + deltaY, 0), parentRect.height);
    const nextPosition = printBounds
      ? clampElementCenterToPrintArea(
          measureRef?.current ?? elementRef.current,
          parent,
          printBounds,
          {
            x: (nextX / parentRect.width) * 100,
            y: (nextY / parentRect.height) * 100,
          },
        )
      : {
          x: (nextX / parentRect.width) * 100,
          y: (nextY / parentRect.height) * 100,
        };
    onChange(nextPosition);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) {
      draggingRef.current = false;
      dragStartRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  };

  return {
    ref: elementRef,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };
}

export function useOverlayScaleResize(
  scale: number,
  onScaleChange: (scale: number) => void,
  min = 15,
  max = 120,
) {
  const draggingRef = useRef(false);
  const startRef = useRef({ pointerX: 0, pointerY: 0, scale: 0 });
  const maxRef = useRef(max);
  maxRef.current = max;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    draggingRef.current = true;
    startRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      scale,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    event.preventDefault();
    const delta =
      event.clientX - startRef.current.pointerX +
      (event.clientY - startRef.current.pointerY);
    const next = Math.min(
      maxRef.current,
      Math.max(min, Math.round(startRef.current.scale + delta * 0.15)),
    );
    onScaleChange(next);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) {
      draggingRef.current = false;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };
}
