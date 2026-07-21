'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Keeps the previous image src visible until the next one is decoded,
 * so color/mockup swaps do not collapse or flash empty space.
 */
export function useStableImageSrc(nextSrc: string | undefined | null) {
  const [displayed, setDisplayed] = useState<string | null>(nextSrc ?? null);
  const [loading, setLoading] = useState(false);
  const displayedRef = useRef(displayed);
  displayedRef.current = displayed;

  useEffect(() => {
    if (!nextSrc) {
      setDisplayed(null);
      setLoading(false);
      return;
    }

    if (nextSrc === displayedRef.current) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const img = new window.Image();
    const finish = () => {
      if (cancelled) return;
      setDisplayed(nextSrc);
      setLoading(false);
    };

    img.onload = finish;
    img.onerror = finish;
    img.src = nextSrc;

    if (img.complete && img.naturalWidth > 0) {
      finish();
    }

    return () => {
      cancelled = true;
    };
  }, [nextSrc]);

  return { src: displayed, loading };
}
