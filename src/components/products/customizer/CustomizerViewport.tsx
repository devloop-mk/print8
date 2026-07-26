'use client';

import { useEffect, type ReactNode } from 'react';

/**
 * Full-screen customizer shell pinned below the site header.
 * Avoids fragile flex/min-height chains through main + PageTransition.
 */
export function CustomizerViewport({ children }: { children: ReactNode }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-x-0 bottom-0 top-[var(--site-header-height,4.5rem)] z-30 flex flex-col overflow-hidden bg-white"
    >
      {children}
    </div>
  );
}
