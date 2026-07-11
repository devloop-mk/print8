'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  PRODUCT_PHOTO_MIN_SCALE,
  PRODUCT_PRINT_AREA_MAX_SCALE,
} from '@/lib/products/customizer-constants';
import { clampPhotoScale } from '@/lib/products/crop-image';
import {
  clampElementCenterToPrintArea,
  type PrintAreaInsets,
} from '@/lib/products/print-area';

function useDraggablePosition(
  position: { x: number; y: number },
  onChange: (pos: { x: number; y: number }) => void,
  printBounds?: PrintAreaInsets,
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
          elementRef.current,
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

function useScaleResize(
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

export function BrandingPackLogoOverlay({
  src,
  alt,
  scale,
  position,
  onScaleChange,
  onPositionChange,
  maxScale = PRODUCT_PRINT_AREA_MAX_SCALE,
  printBounds,
  interactive = true,
  selected = true,
}: {
  src: string;
  alt: string;
  scale: number;
  position: { x: number; y: number };
  onScaleChange?: (scale: number) => void;
  onPositionChange?: (pos: { x: number; y: number }) => void;
  maxScale?: number;
  printBounds?: PrintAreaInsets;
  interactive?: boolean;
  selected?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drag = useDraggablePosition(
    position,
    onPositionChange ?? (() => {}),
    printBounds,
  );
  const resize = useScaleResize(
    scale,
    (next) => {
      const clamped = clampPhotoScale(next, maxScale);
      onScaleChange?.(clamped);
      if (!printBounds || !onPositionChange) return;
      const parent = containerRef.current?.parentElement;
      if (!parent) return;
      const reclamped = clampElementCenterToPrintArea(
        containerRef.current,
        parent,
        printBounds,
        position,
        { width: clamped, height: clamped },
      );
      if (
        reclamped.x !== position.x ||
        reclamped.y !== position.y
      ) {
        onPositionChange(reclamped);
      }
    },
    PRODUCT_PHOTO_MIN_SCALE,
    maxScale,
  );

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        drag.ref.current = node;
      }}
      className={cn(
        'absolute pointer-events-auto',
        interactive ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none',
      )}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${scale}%`,
        transform: 'translate(-50%, -50%)',
        touchAction: 'none',
      }}
      onPointerDown={interactive ? drag.onPointerDown : undefined}
      onPointerMove={interactive ? drag.onPointerMove : undefined}
      onPointerUp={interactive ? drag.onPointerUp : undefined}
      onPointerCancel={interactive ? drag.onPointerCancel : undefined}
    >
      <div
        className={cn(
          'relative',
          interactive && selected && 'ring-2 ring-brand-500 ring-offset-2 ring-offset-transparent',
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          crossOrigin="anonymous"
          className="pointer-events-none block w-full bg-transparent object-contain"
        />
        {interactive ? (
          <div
            role="button"
            tabIndex={0}
            aria-label="Resize logo"
            className="absolute -bottom-2 -right-2 flex h-6 w-6 cursor-se-resize items-center justify-center rounded-full border-2 border-white bg-brand-600 shadow-md"
            style={{ touchAction: 'none' }}
            onPointerDown={resize.onPointerDown}
            onPointerMove={resize.onPointerMove}
            onPointerUp={resize.onPointerUp}
            onPointerCancel={resize.onPointerCancel}
          >
            <svg viewBox="0 0 10 10" className="h-3 w-3 text-white" aria-hidden>
              <path
                d="M9 1v8H1"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          </div>
        ) : null}
      </div>
    </div>
  );
}
