'use client';

import { useEffect } from 'react';

export function useUndoRedoKeyboard({
  undo,
  redo,
  canUndo,
  canRedo,
  enabled = true,
}: {
  undo: () => boolean;
  redo: () => boolean;
  canUndo: boolean;
  canRedo: boolean;
  enabled?: boolean;
}) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (!modifier || event.altKey) return;

      const key = event.key.toLowerCase();

      if (key === 'z' && !event.shiftKey) {
        if (!canUndo) return;
        event.preventDefault();
        undo();
        return;
      }

      if ((key === 'z' && event.shiftKey) || key === 'y') {
        if (!canRedo) return;
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canRedo, canUndo, enabled, redo, undo]);
}
