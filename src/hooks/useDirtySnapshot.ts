'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useDirtySnapshot(serializedSnapshot: string, ready: boolean) {
  const baselineRef = useRef<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const markClean = useCallback(() => {
    baselineRef.current = serializedSnapshot;
    setIsDirty(false);
  }, [serializedSnapshot]);

  useEffect(() => {
    if (!ready) return;

    if (baselineRef.current === null) {
      baselineRef.current = serializedSnapshot;
      setIsDirty(false);
      return;
    }

    setIsDirty(serializedSnapshot !== baselineRef.current);
  }, [ready, serializedSnapshot]);

  return { isDirty, markClean };
}
