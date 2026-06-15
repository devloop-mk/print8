import type { ReactNode } from "react";

/** Shared mockup overlay area — matches ProductCustomizer InteractivePreview layout */
export const PRODUCT_MOCKUP_INNER_CLASS = "relative h-[85%] w-[85%] select-none";

export function ProductMockupFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative flex aspect-square w-full items-center justify-center rounded-2xl bg-gradient-to-br from-ink-50 to-ink-100 shadow-inner ${className}`}
    >
      <div className={PRODUCT_MOCKUP_INNER_CLASS}>{children}</div>
    </div>
  );
}
