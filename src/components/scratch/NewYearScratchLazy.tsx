'use client';

import dynamic from 'next/dynamic';

const NewYearScratch = dynamic(
  () =>
    import('@/components/scratch/NewYearScratch').then((mod) => mod.NewYearScratch),
  { ssr: false },
);

export function NewYearScratchLazy() {
  return <NewYearScratch />;
}
