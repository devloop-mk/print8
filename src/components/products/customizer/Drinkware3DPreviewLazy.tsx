'use client';

import dynamic from 'next/dynamic';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

export type {
  DrinkwarePreviewMode,
  DrinkwarePreviewVariant,
} from '@/components/products/customizer/Drinkware3DPreview';

export { DrinkwarePreviewModeToggle } from '@/components/products/customizer/Drinkware3DPreview';

export const Drinkware3DPreviewLazy = dynamic(
  () =>
    import('@/components/products/customizer/Drinkware3DPreview').then(
      (mod) => mod.Drinkware3DPreview,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[3/4] w-[min(18rem,78vw)] items-center justify-center rounded-sm bg-[#eef2f6] md:w-[min(28rem,46vh)]">
        <LoadingIndicator size="sm" />
      </div>
    ),
  },
);
