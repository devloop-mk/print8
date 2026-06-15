'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  readSavedDesigns,
  writeSavedDesigns,
  type SavedDesign,
} from '@/lib/designs/saved-designs';

export function useSavedDesigns() {
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDesigns(readSavedDesigns());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      writeSavedDesigns(designs);
    }
  }, [designs, hydrated]);

  const saveDesign = useCallback((design: SavedDesign) => {
    setDesigns((prev) => {
      const index = prev.findIndex((item) => item.id === design.id);
      if (index === -1) {
        return [design, ...prev];
      }
      const next = [...prev];
      next[index] = design;
      return next;
    });
  }, []);

  const deleteDesign = useCallback((id: string) => {
    setDesigns((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return { designs, hydrated, saveDesign, deleteDesign };
}
