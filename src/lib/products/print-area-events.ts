'use client';

/**
 * Fired when a dragged/resized layer ended up fully outside the print area
 * and was automatically recentered. Listened to by `OutOfPrintAreaToast` so
 * the notice can be shown without prop-drilling through every overlay layer.
 */
export const OUT_OF_PRINT_AREA_EVENT = 'product-customizer:out-of-print-area';

export function notifyMovedOutsidePrintArea() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(OUT_OF_PRINT_AREA_EVENT));
}
