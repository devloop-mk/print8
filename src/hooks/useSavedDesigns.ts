'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  readSavedDesigns,
  writeSavedDesigns,
  type SavedDesign,
} from '@/lib/designs/saved-designs';
import { dispatchDesignSaved } from '@/lib/drafts/draft-events';

export function useSavedDesigns() {
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDesigns(readSavedDesigns());
    setHydrated(true);
  }, []);

  const saveDesign = useCallback((design: SavedDesign) => {
    setDesigns((prev) => {
      const index = prev.findIndex((item) => item.id === design.id);
      const next =
        index === -1
          ? [design, ...prev]
          : prev.map((item, itemIndex) => (itemIndex === index ? design : item));
      writeSavedDesigns(next);
      if (index === -1) {
        dispatchDesignSaved();
      }
      return next;
    });
  }, []);

  const deleteDesign = useCallback((id: string) => {
    setDesigns((prev) => {
      const next = prev.filter((item) => item.id !== id);
      writeSavedDesigns(next);
      return next;
    });
  }, []);

  return { designs, hydrated, saveDesign, deleteDesign };
}
