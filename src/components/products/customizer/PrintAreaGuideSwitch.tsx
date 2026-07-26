'use client';

import type { ProductMockupLayout } from '@/lib/products/product-mockup-layout';
import { DrinkwarePrintAreaGuide } from '@/components/products/customizer/DrinkwarePrintAreaGuide';
import { PrintAreaGuide } from '@/components/products/customizer/PrintAreaGuide';

type PrintAreaGuideSwitchProps = {
  layout: ProductMockupLayout;
  hidden?: boolean;
  label: string;
  wrapLabel: string;
  frontLabel: string;
  showHandleHint?: boolean;
  showCenterGuide?: boolean;
  handleHintLabel?: string;
  centerLabel?: string;
};

export function PrintAreaGuideSwitch({
  layout,
  hidden = false,
  label,
  wrapLabel,
  frontLabel,
  showHandleHint,
  showCenterGuide,
  handleHintLabel,
  centerLabel,
}: PrintAreaGuideSwitchProps) {
  if (layout.wrapPrintArea) {
    return (
      <DrinkwarePrintAreaGuide
        frontInsets={layout.printArea}
        wrapInsets={layout.wrapPrintArea}
        wrapLabel={wrapLabel}
        frontLabel={frontLabel}
        hidden={hidden}
        showHandleHint={showHandleHint}
        showCenterGuide={showCenterGuide}
        handleHintLabel={handleHintLabel}
        centerLabel={centerLabel}
      />
    );
  }

  return <PrintAreaGuide insets={layout.printArea} label={label} hidden={hidden} />;
}
