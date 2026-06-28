'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CanvasFieldAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
  containerWidth: number;
  containerHeight: number;
};

type SvgCanvasInlineFieldEditorProps = {
  open: boolean;
  anchor: CanvasFieldAnchor | null;
  label: string;
  value: string;
  placeholder?: string;
  inputId: string;
  inputRef?: (node: HTMLInputElement | null) => void;
  onChange: (value: string) => void;
  onClose: () => void;
  closeLabel: string;
};

const FIELD_GAP_PX = 6;

function computeEditorStyle(anchor: CanvasFieldAnchor) {
  const editorWidth = Math.min(
    280,
    Math.max(anchor.width, 128, anchor.containerWidth - 16),
  );
  const editorHeight = 72;

  let left = anchor.x + anchor.width / 2 - editorWidth / 2;
  left = Math.max(8, Math.min(left, anchor.containerWidth - editorWidth - 8));

  let top = anchor.y + anchor.height + FIELD_GAP_PX;
  if (top + editorHeight + 8 > anchor.containerHeight) {
    top = anchor.y - FIELD_GAP_PX - editorHeight;
  }

  top = Math.max(8, Math.min(top, anchor.containerHeight - editorHeight - 8));

  return { left, top, width: editorWidth };
}

export function SvgCanvasInlineFieldEditor({
  open,
  anchor,
  label,
  value,
  placeholder,
  inputId,
  inputRef,
  onChange,
  onClose,
  closeLabel,
}: SvgCanvasInlineFieldEditorProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const localInputRef = useRef<HTMLInputElement>(null);

  const style = useMemo(
    () => (anchor ? computeEditorStyle(anchor) : null),
    [anchor],
  );

  useLayoutEffect(() => {
    if (!open || !style) return;
    const timer = window.setTimeout(() => {
      const node = localInputRef.current;
      if (!node) return;
      node.focus({ preventScroll: true });
      try {
        const length = node.value.length;
        node.setSelectionRange(length, length);
      } catch {
        // ignore
      }
    }, 40);
    return () => window.clearTimeout(timer);
  }, [open, inputId, style]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const panel = panelRef.current;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panel?.contains(target)) return;
      if (
        target instanceof Element &&
        target.closest('[data-hit-layer], [data-hit-field], [data-resize-handle]')
      ) {
        return;
      }

      onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [open, onClose]);

  if (!open || !anchor || !style) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <div
        ref={panelRef}
        className={cn(
          'pointer-events-auto absolute rounded-xl border border-brand-300/80 bg-white/70 p-2 shadow-lg backdrop-blur-[2px]',
          'ring-1 ring-white/60',
        )}
        style={{
          left: style.left,
          top: style.top,
          width: style.width,
        }}
      >
        <div className="mb-1 flex items-start justify-between gap-2">
          <label
            htmlFor={inputId}
            className="min-w-0 flex-1 truncate text-[10px] font-semibold uppercase tracking-wide text-brand-800/90"
          >
            {label}
          </label>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-0.5 text-ink-500/80 transition hover:bg-white/60 hover:text-ink-800"
            aria-label={closeLabel}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <input
          id={inputId}
          ref={(node) => {
            localInputRef.current = node;
            inputRef?.(node);
          }}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="off"
          autoCorrect="on"
          spellCheck
          className="w-full rounded-lg border border-ink-200/80 bg-white/75 px-2.5 py-2 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-500 focus:bg-white/90 focus:outline-none focus:ring-2 focus:ring-brand-200/80"
        />
      </div>
    </div>
  );
}
