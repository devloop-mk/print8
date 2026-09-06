'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useDirtySnapshot(
  serializedSnapshot: string,
  ready: boolean,
  resetKey?: string,
) {
  const baselineRef = useRef<string | null>(null);
  const resetKeyRef = useRef(resetKey);
  const [isDirty, setIsDirty] = useState(false);

  if (resetKey !== resetKeyRef.current) {
    resetKeyRef.current = resetKey;
    baselineRef.current = null;
  }

  const markClean = useCallback(() => {
    baselineRef.current = serializedSnapshot;
    setIsDirty(false);
  }, [serializedSnapshot]);

  useEffect(() => {
    if (!ready) {
      baselineRef.current = null;
      setIsDirty(false);
      return;
    }

    if (baselineRef.current === null) {
      baselineRef.current = serializedSnapshot;
      setIsDirty(false);
      return;
    }

    setIsDirty(serializedSnapshot !== baselineRef.current);
  }, [ready, resetKey, serializedSnapshot]);

  return { isDirty, markClean };
}
