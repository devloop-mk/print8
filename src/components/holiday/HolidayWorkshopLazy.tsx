'use client';

import dynamic from 'next/dynamic';

const HolidayWorkshop = dynamic(
  () =>
    import('@/components/holiday/HolidayWorkshop').then((mod) => mod.HolidayWorkshop),
  { ssr: false },
);

export function HolidayWorkshopLazy() {
  return <HolidayWorkshop />;
}
