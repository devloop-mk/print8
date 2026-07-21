'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks a CSS media query on the client. Defaults to `false` on the server
 * and during the initial client render so hydration stays consistent —
 * the real value settles right after mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQueryList.addEventListener('change', listener);
    return () => mediaQueryList.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
