'use client';

import dynamic from 'next/dynamic';

const SpinWheelPromoPopup = dynamic(
  () =>
    import('@/components/rewards/SpinWheelPromoPopup').then(
      (mod) => mod.SpinWheelPromoPopup,
    ),
  { ssr: false },
);

export function SpinWheelPromoPopupLazy() {
  return <SpinWheelPromoPopup />;
}
